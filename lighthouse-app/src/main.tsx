import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { initializeErrorHandling } from './utils/errorHandler'
import { logger } from './utils/logger'
import { initializePerformanceMonitoring } from './utils/performanceMonitor'

// 에러 핸들링 초기화
initializeErrorHandling()

// 성능 모니터링 초기화
initializePerformanceMonitoring()

// 앱 시작 로그
logger.info('App starting', {
  environment: import.meta.env.MODE,
  timestamp: new Date().toISOString()
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
