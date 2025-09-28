import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navigation from './components/Navigation'
import OceanView from './pages/OceanView'
import StudyLog from './pages/StudyLog'
import Metacognition from './pages/Metacognition'
import Dashboard from './pages/Dashboard'
import Settings from './pages/Settings'
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

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    localStorage.setItem('lighthouse-study-data', JSON.stringify(studyData))
  }, [studyData])

  return (
    <Router>
      <div className="app">
        <Navigation />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<OceanView studyData={studyData} />} />
            <Route path="/study" element={<StudyLog studyData={studyData} setStudyData={setStudyData} />} />
            <Route path="/metacognition" element={<Metacognition studyData={studyData} setStudyData={setStudyData} />} />
            <Route path="/dashboard" element={<Dashboard studyData={studyData} />} />
            <Route path="/settings" element={<Settings studyData={studyData} setStudyData={setStudyData} />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
