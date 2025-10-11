/**
 * 캐시 관리 유틸리티
 * PWA의 캐시를 관리하고 모니터링하는 기능 제공
 */

export interface CacheInfo {
  name: string
  size: number
  itemCount: number
}

export interface CacheStats {
  totalSize: number
  caches: CacheInfo[]
}

/**
 * 모든 캐시의 이름을 가져옵니다
 */
export async function getCacheNames(): Promise<string[]> {
  if (!('caches' in window)) {
    return []
  }
  return await caches.keys()
}

/**
 * 특정 캐시의 크기를 계산합니다 (근사치)
 */
export async function getCacheSize(cacheName: string): Promise<number> {
  if (!('caches' in window)) {
    return 0
  }

  const cache = await caches.open(cacheName)
  const requests = await cache.keys()

  let totalSize = 0
  for (const request of requests) {
    const response = await cache.match(request)
    if (response) {
      const blob = await response.blob()
      totalSize += blob.size
    }
  }

  return totalSize
}

/**
 * 특정 캐시의 항목 수를 가져옵니다
 */
export async function getCacheItemCount(cacheName: string): Promise<number> {
  if (!('caches' in window)) {
    return 0
  }

  const cache = await caches.open(cacheName)
  const requests = await cache.keys()
  return requests.length
}

/**
 * 모든 캐시의 통계를 가져옵니다
 */
export async function getCacheStats(): Promise<CacheStats> {
  const cacheNames = await getCacheNames()

  const caches: CacheInfo[] = await Promise.all(
    cacheNames.map(async (name) => {
      const [size, itemCount] = await Promise.all([
        getCacheSize(name),
        getCacheItemCount(name)
      ])

      return {
        name,
        size,
        itemCount
      }
    })
  )

  const totalSize = caches.reduce((sum, cache) => sum + cache.size, 0)

  return {
    totalSize,
    caches
  }
}

/**
 * 특정 캐시를 삭제합니다
 */
export async function deleteCache(cacheName: string): Promise<boolean> {
  if (!('caches' in window)) {
    return false
  }

  return await caches.delete(cacheName)
}

/**
 * 모든 캐시를 삭제합니다
 */
export async function clearAllCaches(): Promise<number> {
  const cacheNames = await getCacheNames()

  let deletedCount = 0
  for (const cacheName of cacheNames) {
    const deleted = await deleteCache(cacheName)
    if (deleted) {
      deletedCount++
    }
  }

  return deletedCount
}

/**
 * 오래된 캐시를 정리합니다 (workbox- 또는 vite-pwa- 접두사가 없는 캐시)
 */
export async function cleanupOldCaches(): Promise<number> {
  const cacheNames = await getCacheNames()

  // vite-plugin-pwa나 workbox가 생성한 캐시는 유지
  const oldCaches = cacheNames.filter(
    name => !name.startsWith('workbox-') && !name.startsWith('vite-pwa-')
  )

  let deletedCount = 0
  for (const cacheName of oldCaches) {
    const deleted = await deleteCache(cacheName)
    if (deleted) {
      deletedCount++
    }
  }

  return deletedCount
}

/**
 * 바이트를 읽기 쉬운 형식으로 변환합니다
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Service Worker를 강제로 업데이트합니다
 */
export async function updateServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    return false
  }

  await registration.update()
  return true
}

/**
 * Service Worker를 등록 해제합니다
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  const registration = await navigator.serviceWorker.getRegistration()
  if (!registration) {
    return false
  }

  return await registration.unregister()
}

/**
 * Storage API를 사용하여 사용 가능한 저장 공간을 확인합니다
 */
export async function getStorageEstimate(): Promise<{
  usage: number
  quota: number
  percentUsed: number
} | null> {
  if (!('storage' in navigator && 'estimate' in navigator.storage)) {
    return null
  }

  const estimate = await navigator.storage.estimate()
  const usage = estimate.usage || 0
  const quota = estimate.quota || 0
  const percentUsed = quota > 0 ? (usage / quota) * 100 : 0

  return {
    usage,
    quota,
    percentUsed
  }
}
