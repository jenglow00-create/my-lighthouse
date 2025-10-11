import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import Navigation from './components/Navigation'
import AuthModal from './components/AuthModal'
import ToastContainer from './components/ToastContainer'
import PWAInstallPrompt from './components/PWAInstallPrompt'
import PWAUpdateNotification from './components/PWAUpdateNotification'
import OfflineIndicator from './components/OfflineIndicator'
import { InstallPrompt } from './components/InstallPrompt'
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator'
import ErrorBoundary, { PageErrorFallback } from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'

// 코드 스플리팅: 페이지별 lazy loading
const OceanView = lazy(() => import('./pages/OceanView'))
const Goals = lazy(() => import('./pages/Goals'))
const StudyLog = lazy(() => import('./pages/StudyLog'))
const Metacognition = lazy(() => import('./pages/Metacognition'))
const MetacognitionHistory = lazy(() => import('./pages/MetacognitionHistory'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Settings = lazy(() => import('./pages/Settings'))
const AuditLog = lazy(() => import('./pages/AuditLog'))
const NotificationSettings = lazy(() => import('./pages/NotificationSettings'))
const LogViewer = lazy(() => import('./pages/LogViewer'))
import { collectDataPeriodically } from './utils/successRateDataCollector'
import { migrateFromLocalStorage } from './db/migration'
import { db } from './db/schema'
import type { UserData, AuthUser } from '@/types'
import { initializeStores } from './store'
import logo from './assets/images/logos/등대 로고.png'
import './App.css'

function App() {
  const [studyData, setStudyData] = useState<UserData>({
    subjects: {},
    globalSettings: {
      progressUnit: 'weekly',
      defaultTargetHours: 100
    },
    sessions: []
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isMigrating, setIsMigrating] = useState(false)
  const [migrationProgress, setMigrationProgress] = useState(0)
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    async function initialize() {
      try {
        // 1. 마스터 계정 생성
        const users = JSON.parse(localStorage.getItem('lighthouse-users') || '[]')
        const masterUser: AuthUser = {
          id: 1,
          username: '1',
          email: 'master@lighthouse.com',
          password: '1',
          createdAt: new Date().toISOString()
        }

        const filteredUsers = users.filter((user: AuthUser) => user.username !== '1')
        const updatedUsers = [masterUser, ...filteredUsers]
        localStorage.setItem('lighthouse-users', JSON.stringify(updatedUsers))

        // 2. 현재 사용자 로드
        const savedUser = localStorage.getItem('lighthouse-current-user')
        if (savedUser) {
          try {
            setCurrentUser(JSON.parse(savedUser))
          } catch (error) {
            console.error('사용자 데이터 로드 오류:', error)
            localStorage.removeItem('lighthouse-current-user')
          }
        }

        // 3. 마이그레이션 체크 및 실행
        const migrationFlag = localStorage.getItem('lighthouse-migration-completed')
        const hasLegacyData = localStorage.getItem('lighthouse-study-data')

        if (!migrationFlag && hasLegacyData) {
          console.log('🔄 localStorage → IndexedDB 마이그레이션 시작...')
          setIsMigrating(true)

          const result = await migrateFromLocalStorage((progress) => {
            const percent = Math.round((progress.current / progress.total) * 100)
            setMigrationProgress(percent)
            console.log(`마이그레이션 진행: ${percent}% - ${progress.phase}`)
          })

          if (result.success) {
            console.log('✅ 마이그레이션 성공:', result)
            localStorage.setItem('lighthouse-migration-completed', 'true')

            // 백업 키 저장
            if (result.backupKey) {
              console.log(`📦 백업 생성됨: ${result.backupKey}`)
            }
          } else {
            console.error('❌ 마이그레이션 실패:', result.errors)
            alert(`마이그레이션 실패: ${result.errors?.join(', ') || '알 수 없는 오류'}`)
          }

          setIsMigrating(false)
        } else if (migrationFlag) {
          console.log('✅ 마이그레이션 이미 완료됨')
        } else {
          console.log('ℹ️ 마이그레이션할 데이터 없음 (새로운 사용자)')
        }

        // 4. Zustand 스토어 초기화
        await initializeStores()
        console.log('✅ Zustand 스토어 초기화 완료')

        // 4. IndexedDB에서 데이터 로드 (마이그레이션 후 또는 기존 사용자)
        const sessions = await db.sessions.toArray()
        const subjects = await db.subjects.toArray()

        // subjects를 Record 형태로 변환
        const subjectsRecord = subjects.reduce((acc, subject) => {
          acc[subject.id] = subject
          return acc
        }, {} as Record<string, any>)

        setStudyData({
          subjects: subjectsRecord,
          globalSettings: {
            progressUnit: 'weekly',
            defaultTargetHours: 100
          },
          sessions: sessions as any
        })

      } catch (error) {
        console.error('초기화 오류:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initialize()
  }, [])

  // 합격률 예측을 위한 데이터 수집 (주기적)
  useEffect(() => {
    if (!currentUser || !studyData.sessions?.length) return

    const shouldCollectData =
      studyData.sessions?.length > 0 &&
      (studyData.sessions.length % 5 === 0 ||
        Object.values(studyData.subjects || {}).some(subject =>
          subject.scores && subject.scores.length > 0
        ))

    if (shouldCollectData) {
      try {
        collectDataPeriodically(studyData, currentUser)
        console.log('합격률 예측용 데이터 수집 완료')
      } catch (error) {
        console.warn('데이터 수집 중 오류:', error)
      }
    }
  }, [studyData.sessions?.length, currentUser, studyData.subjects])

  const handleAuth = (user: AuthUser) => {
    setCurrentUser(user)
    setShowAuthModal(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('lighthouse-current-user')
    setCurrentUser(null)
    setShowAuthModal(true)
  }

  if (isLoading || isMigrating) {
    return (
      <div className="app" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <img src={logo} alt="등대 로고" style={{ width: '80px', height: '80px', marginBottom: '1rem', objectFit: 'contain' }} />
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
            {isMigrating ? '데이터 마이그레이션 중...' : '등대 앱 로딩 중...'}
          </div>
          {isMigrating && (
            <div style={{ marginTop: '1rem' }}>
              <div style={{
                width: '300px',
                height: '8px',
                background: 'rgba(255,255,255,0.3)',
                borderRadius: '4px',
                overflow: 'hidden',
                margin: '0 auto'
              }}>
                <div style={{
                  width: `${migrationProgress}%`,
                  height: '100%',
                  background: 'white',
                  transition: 'width 0.3s ease'
                }} />
              </div>
              <div style={{ marginTop: '0.5rem', opacity: 0.8 }}>
                {migrationProgress}% 완료
              </div>
            </div>
          )}
          {!isMigrating && (
            <div style={{ marginTop: '1rem', opacity: 0.8 }}>잠시만 기다려주세요</div>
          )}
        </div>
      </div>
    )
  }

  // Show auth modal if no user is logged in
  if (!currentUser && !showAuthModal) {
    setShowAuthModal(true)
  }

  return (
    <ErrorBoundary>
      <Router>
        <div className="app">
          <a href="#main-content" className="skip-link">
            메인 컨텐츠로 건너뛰기
          </a>
          <Navigation currentUser={currentUser} onLogout={handleLogout} onShowAuth={() => setShowAuthModal(true)} />
          <main id="main-content" className="main-content" tabIndex={-1}>
            {currentUser ? (
              <Suspense fallback={<LoadingSpinner />}>
                <Routes>
                  <Route path="/" element={
                    <ErrorBoundary fallbackComponent={(error, reset) => (
                      <PageErrorFallback pageName="홈" error={error} onReset={reset} />
                    )}>
                      <OceanView studyData={studyData} />
                    </ErrorBoundary>
                  } />
                <Route path="/goals" element={
                  <ErrorBoundary fallbackComponent={(error, reset) => (
                    <PageErrorFallback pageName="목표" error={error} onReset={reset} />
                  )}>
                    <Goals studyData={studyData} />
                  </ErrorBoundary>
                } />
                <Route path="/study" element={
                  <ErrorBoundary fallbackComponent={(error, reset) => (
                    <PageErrorFallback pageName="학습 기록" error={error} onReset={reset} />
                  )}>
                    <StudyLog studyData={studyData} setStudyData={setStudyData} />
                  </ErrorBoundary>
                } />
                <Route path="/metacognition" element={
                  <ErrorBoundary fallbackComponent={(error, reset) => (
                    <PageErrorFallback pageName="성찰" error={error} onReset={reset} />
                  )}>
                    <Metacognition studyData={studyData} setStudyData={setStudyData} />
                  </ErrorBoundary>
                } />
                <Route path="/metacognition/history" element={
                  <ErrorBoundary fallbackComponent={(error, reset) => (
                    <PageErrorFallback pageName="성찰 히스토리" error={error} onReset={reset} />
                  )}>
                    <MetacognitionHistory studyData={studyData} />
                  </ErrorBoundary>
                } />
                <Route path="/dashboard" element={
                  <ErrorBoundary fallbackComponent={(error, reset) => (
                    <PageErrorFallback pageName="대시보드" error={error} onReset={reset} />
                  )}>
                    <Dashboard studyData={studyData} />
                  </ErrorBoundary>
                } />
                <Route path="/settings" element={
                  <ErrorBoundary fallbackComponent={(error, reset) => (
                    <PageErrorFallback pageName="설정" error={error} onReset={reset} />
                  )}>
                    <Settings studyData={studyData} setStudyData={setStudyData} />
                  </ErrorBoundary>
                } />
                <Route path="/audit" element={
                  <ErrorBoundary><AuditLog /></ErrorBoundary>
                } />
                <Route path="/notifications" element={
                  <ErrorBoundary><NotificationSettings /></ErrorBoundary>
                } />
                <Route path="/logs" element={
                  <ErrorBoundary fallbackComponent={(error, reset) => (
                    <PageErrorFallback pageName="로그 뷰어" error={error} onReset={reset} />
                  )}>
                    <LogViewer />
                  </ErrorBoundary>
                } />
              </Routes>
              </Suspense>
          ) : (
            <div className="auth-required">
              <div className="auth-placeholder">
                <img src={logo} alt="등대 로고" style={{ width: '80px', height: '80px', marginBottom: '1rem', objectFit: 'contain' }} />
                <h2>등대 학습 앱에 오신 것을 환영합니다</h2>
                <p>시작하려면 로그인하거나 계정을 만드세요</p>
                <button onClick={() => setShowAuthModal(true)} className="btn-primary">
                  시작하기
                </button>
              </div>
            </div>
          )}
        </main>
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => currentUser && setShowAuthModal(false)}
          onAuth={handleAuth}
        />
        <ToastContainer />
        <PWAInstallPrompt />
        <PWAUpdateNotification />
        <OfflineIndicator />
        <InstallPrompt />
        <NetworkStatusIndicator />
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
