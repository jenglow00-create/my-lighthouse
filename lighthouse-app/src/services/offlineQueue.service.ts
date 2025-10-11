import { db, type QueuedRequest } from '@/db/schema';
import { logger } from '@/utils/logger';
import { useUIStore } from '@/store';

/**
 * 오프라인 큐 서비스
 */
class OfflineQueueService {
  private isSyncing = false;
  private maxRetries = 3;

  /**
   * 요청 큐에 추가
   */
  async enqueue(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<void> {
    try {
      const queuedRequest: QueuedRequest = {
        ...request,
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        retryCount: 0,
        status: 'pending'
      };

      await db.offlineQueue.add(queuedRequest);

      logger.info('Request queued for offline sync', {
        id: queuedRequest.id,
        method: queuedRequest.method,
        url: queuedRequest.url
      });

      // 온라인이면 즉시 동기화 시도
      if (navigator.onLine) {
        this.sync();
      }
    } catch (error) {
      logger.error('Failed to enqueue request', error as Error);
      throw error;
    }
  }

  /**
   * 큐 동기화
   */
  async sync(): Promise<void> {
    if (this.isSyncing) {
      logger.debug('Sync already in progress');
      return;
    }

    if (!navigator.onLine) {
      logger.debug('Cannot sync while offline');
      return;
    }

    this.isSyncing = true;

    try {
      const pendingRequests = await db.offlineQueue
        .where('status')
        .equals('pending')
        .toArray();

      if (pendingRequests.length === 0) {
        logger.info('No pending requests to sync');
        return;
      }

      logger.info(`Syncing ${pendingRequests.length} pending requests`);

      let successCount = 0;
      let failCount = 0;

      for (const request of pendingRequests) {
        try {
          // 상태 업데이트: syncing
          await db.offlineQueue.update(request.id, { status: 'syncing' });

          // 요청 실행
          const response = await fetch(request.url, {
            method: request.method,
            headers: {
              'Content-Type': 'application/json',
              ...request.headers
            },
            body: request.body ? JSON.stringify(request.body) : undefined
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          // 성공: synced
          await db.offlineQueue.update(request.id, {
            status: 'synced',
            error: undefined
          });

          successCount++;

          logger.info('Request synced successfully', {
            id: request.id,
            method: request.method,
            url: request.url
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          // 재시도 횟수 증가
          const newRetryCount = request.retryCount + 1;

          if (newRetryCount >= this.maxRetries) {
            // 최대 재시도 초과: failed
            await db.offlineQueue.update(request.id, {
              status: 'failed',
              retryCount: newRetryCount,
              error: errorMessage
            });

            failCount++;

            logger.error('Request failed after max retries', error as Error, {
              id: request.id,
              retryCount: newRetryCount
            });
          } else {
            // 재시도 대기: pending
            await db.offlineQueue.update(request.id, {
              status: 'pending',
              retryCount: newRetryCount,
              error: errorMessage
            });

            logger.warn('Request sync failed, will retry', {
              id: request.id,
              retryCount: newRetryCount,
              error: errorMessage
            });
          }
        }
      }

      // 결과 알림
      if (successCount > 0 || failCount > 0) {
        const { addToast } = useUIStore.getState();

        if (failCount === 0) {
          addToast(`${successCount}개 항목이 동기화되었습니다`, 'success');
        } else {
          addToast(
            `${successCount}개 성공, ${failCount}개 실패`,
            'warning'
          );
        }
      }

      // 오래된 synced 항목 정리 (7일 이상)
      await this.cleanup();

    } catch (error) {
      logger.error('Sync failed', error as Error);
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * 큐 상태 조회
   */
  async getQueueStatus(): Promise<{
    pending: number;
    syncing: number;
    synced: number;
    failed: number;
    total: number;
  }> {
    try {
      const all = await db.offlineQueue.toArray();

      return {
        pending: all.filter(r => r.status === 'pending').length,
        syncing: all.filter(r => r.status === 'syncing').length,
        synced: all.filter(r => r.status === 'synced').length,
        failed: all.filter(r => r.status === 'failed').length,
        total: all.length
      };
    } catch (error) {
      logger.error('Failed to get queue status', error as Error);
      return { pending: 0, syncing: 0, synced: 0, failed: 0, total: 0 };
    }
  }

  /**
   * 실패한 요청 재시도
   */
  async retryFailed(): Promise<void> {
    try {
      const failedRequests = await db.offlineQueue
        .where('status')
        .equals('failed')
        .toArray();

      // 상태를 pending으로 변경
      await Promise.all(
        failedRequests.map(request =>
          db.offlineQueue.update(request.id, {
            status: 'pending',
            retryCount: 0,
            error: undefined
          })
        )
      );

      logger.info(`${failedRequests.length} failed requests reset to pending`);

      // 동기화 시도
      await this.sync();
    } catch (error) {
      logger.error('Failed to retry failed requests', error as Error);
      throw error;
    }
  }

  /**
   * 오래된 항목 정리
   */
  async cleanup(): Promise<void> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const oldItems = await db.offlineQueue
        .where('status')
        .equals('synced')
        .and(item => new Date(item.timestamp) < sevenDaysAgo)
        .toArray();

      if (oldItems.length > 0) {
        await Promise.all(
          oldItems.map(item => db.offlineQueue.delete(item.id))
        );

        logger.info(`Cleaned up ${oldItems.length} old synced items`);
      }
    } catch (error) {
      logger.error('Failed to cleanup queue', error as Error);
    }
  }

  /**
   * 큐 초기화
   */
  async clear(): Promise<void> {
    try {
      await db.offlineQueue.clear();
      logger.info('Offline queue cleared');
    } catch (error) {
      logger.error('Failed to clear queue', error as Error);
      throw error;
    }
  }
}

export const offlineQueueService = new OfflineQueueService();

/**
 * 온라인 복귀 시 자동 동기화
 */
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    logger.info('Back online, syncing queue');
    offlineQueueService.sync();
  });
}
