import '../styles/LoadingSpinner.css'

export default function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
      <p>로딩 중...</p>
    </div>
  )
}
