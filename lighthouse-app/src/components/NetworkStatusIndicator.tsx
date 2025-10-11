import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import './NetworkStatusIndicator.css';

export function NetworkStatusIndicator() {
  const status = useNetworkStatus();

  if (status.isOnline) {
    return null; // 온라인일 때는 숨김
  }

  return (
    <div className="network-status-indicator offline">
      <span className="indicator-icon">📡</span>
      <span className="indicator-text">오프라인</span>
    </div>
  );
}
