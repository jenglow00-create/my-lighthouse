import { useUIStore } from '@/store'
import './ToastContainer.css'

export default function ToastContainer() {
  const { toasts, removeToast } = useUIStore()

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
          onClick={() => removeToast(toast.id)}
          role="alert"
        >
          <span className="toast-icon" aria-hidden="true">
            {toast.type === 'success' && '✓'}
            {toast.type === 'error' && '⚠'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span className="toast-message">{toast.message}</span>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation()
              removeToast(toast.id)
            }}
            aria-label="알림 닫기"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
