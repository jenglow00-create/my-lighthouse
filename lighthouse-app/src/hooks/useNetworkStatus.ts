import { useState, useEffect } from 'react';
import { logger } from '@/utils/logger';

export interface NetworkStatus {
  isOnline: boolean;
  effectiveType?: string; // '4g', '3g', '2g', 'slow-2g'
  downlink?: number; // Mbps
  rtt?: number; // ms
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine
  });

  useEffect(() => {
    const updateStatus = () => {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      setStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt
      });
    };

    const handleOnline = () => {
      logger.info('Network: Online');
      updateStatus();
    };

    const handleOffline = () => {
      logger.warn('Network: Offline');
      updateStatus();
    };

    const handleConnectionChange = () => {
      logger.info('Network: Connection changed');
      updateStatus();
    };

    // 초기 상태
    updateStatus();

    // 이벤트 리스너
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, []);

  return status;
}
