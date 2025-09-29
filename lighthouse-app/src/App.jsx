import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import AuthModal from './components/AuthModal'
import OceanView from './pages/OceanView'
import Goals from './pages/Goals'
import StudyLog from './pages/StudyLog'
import Metacognition from './pages/Metacognition'
import MetacognitionHistory from './pages/MetacognitionHistory'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
import { collectDataPeriodically } from './utils/successRateDataCollector'
import logo from './assets/images/logos/등대 로고.png'
import './App.css'

function App() {
  const [studyData, setStudyData] = useState({
    subjects: {}, // 과목별 데이터 저장
    globalSettings: {
      progressUnit: 'weekly', // 'daily', 'weekly', 'monthly'
      defaultTargetHours: 100
    },
    sessions: [] // 전체 세션 기록
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(null)
  const [showAuthModal, setShowAuthModal] = useState(false)

  useEffect(() => {
    // Always ensure master user exists for testing (force create)
    const users = JSON.parse(localStorage.getItem('lighthouse-users') || '[]')
    const masterUser = {
      id: 1,
      username: '1',
      email: 'master@lighthouse.com',
      password: '1',
      createdAt: new Date().toISOString()
    }

    // Remove existing master if any and add fresh one
    const filteredUsers = users.filter(user => user.username !== '1')
    const updatedUsers = [masterUser, ...filteredUsers]
    localStorage.setItem('lighthouse-users', JSON.stringify(updatedUsers))

    // Load current user
    const savedUser = localStorage.getItem('lighthouse-current-user')
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser))
      } catch (error) {
        console.error('사용자 데이터 로드 오류:', error)
        localStorage.removeItem('lighthouse-current-user')
      }
    }

    // Load study data
    const savedData = localStorage.getItem('lighthouse-study-data')
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData)
        // 데이터 구조 검증 및 마이그레이션
        if (parsedData && typeof parsedData === 'object') {
          // 새로운 구조로 마이그레이션
          if (!parsedData.subjects && parsedData.examType) {
            // 구버전 데이터 감지 - 새 구조로 변환
            setStudyData({
              subjects: {},
              globalSettings: {
                progressUnit: 'weekly',
                defaultTargetHours: 100
              },
              sessions: parsedData.sessions || []
            })
            localStorage.removeItem('lighthouse-study-data') // 기존 데이터 삭제
          } else {
            // 새 구조 데이터인 경우 그대로 로드
            setStudyData(parsedData)
          }
        }
      } catch (error) {
        console.error('데이터 로드 오류:', error)
        localStorage.removeItem('lighthouse-study-data')
      }
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    localStorage.setItem('lighthouse-study-data', JSON.stringify(studyData))
  }, [studyData])

  // 합격률 예측을 위한 데이터 수집 (주기적)
  useEffect(() => {
    if (!currentUser || !studyData.sessions?.length) return

    // 중요한 이벤트 시점에 데이터 수집
    const shouldCollectData =
      studyData.sessions?.length > 0 && // 세션이 있을 때
      (studyData.sessions.length % 5 === 0 || // 5회 세션마다
       Object.values(studyData.subjects || {}).some(subject =>
         subject.scores && subject.scores.length > 0 // 점수가 기록되었을 때
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

  const handleAuth = (user) => {
    setCurrentUser(user)
    setShowAuthModal(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('lighthouse-current-user')
    setCurrentUser(null)
    setShowAuthModal(true)
  }

  if (isLoading) {
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
          <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>등대 앱 로딩 중...</div>
          <div style={{ marginTop: '1rem', opacity: 0.8 }}>잠시만 기다려주세요</div>
        </div>
      </div>
    )
  }

  // Show auth modal if no user is logged in
  if (!currentUser && !showAuthModal) {
    setShowAuthModal(true)
  }

  return (
    <Router>
      <div className="app">
        <Navigation currentUser={currentUser} onLogout={handleLogout} onShowAuth={() => setShowAuthModal(true)} />
        <main className="main-content">
          {currentUser ? (
            <Routes>
              <Route path="/" element={<OceanView studyData={studyData} />} />
              <Route path="/goals" element={<Goals studyData={studyData} />} />
              <Route path="/study" element={<StudyLog studyData={studyData} setStudyData={setStudyData} />} />
              <Route path="/metacognition" element={<Metacognition studyData={studyData} setStudyData={setStudyData} />} />
              <Route path="/metacognition/history" element={<MetacognitionHistory studyData={studyData} />} />
              <Route path="/dashboard" element={<Dashboard studyData={studyData} />} />
              <Route path="/settings" element={<Settings studyData={studyData} setStudyData={setStudyData} />} />
            </Routes>
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
      </div>
    </Router>
  )
}

export default App
