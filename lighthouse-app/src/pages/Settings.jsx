import { useState } from 'react'
import { Settings as SettingsIcon, Target, BookOpen, Trash2, Download, Upload, Users } from 'lucide-react'
import SubjectManager from '../components/SubjectManager'

function Settings({ studyData, setStudyData }) {
  const [activeTab, setActiveTab] = useState('subjects')

  const examTypes = [
    { id: 'TOEIC', name: 'TOEIC', description: '영어 능력 시험' },
    { id: 'TOEFL', name: 'TOEFL', description: '영어 시험' },
    { id: 'IELTS', name: 'IELTS', description: '국제 영어 시험' },
    { id: 'Korean History', name: '한국사', description: '한국사 시험' },
    { id: 'Civil Service', name: '공무원', description: '공무원 시험' },
    { id: 'SAT', name: 'SAT', description: '대학 입학 시험' },
    { id: 'GRE', name: 'GRE', description: '대학원 입학 시험' },
    { id: 'Other', name: '기타', description: '사용자 지정 시험' }
  ]

  const handleExamTypeChange = (examType) => {
    setStudyData(prev => ({ ...prev, examType }))
  }

  const handleTargetScoreChange = (e) => {
    setStudyData(prev => ({ ...prev, targetScore: parseInt(e.target.value) || 0 }))
  }

  const handleExportData = () => {
    const dataStr = JSON.stringify(studyData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `lighthouse-study-data-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleImportData = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target?.result)
        setStudyData(importedData)
        alert('데이터를 성공적으로 가져왔습니다!')
      } catch {
        alert('데이터 가져오기 오류입니다. 파일 형식을 확인해주세요.')
      }
    }
    reader.readAsText(file)
  }

  const handleClearData = () => {
    if (window.confirm('정말로 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setStudyData({
        totalHours: 0,
        sessions: [],
        examType: 'TOEIC',
        targetScore: 800,
        reflections: []
      })
      alert('모든 데이터가 삭제되었습니다.')
    }
  }

  return (
    <div className="settings">
      <div className="page-header">
        <h1>
          <SettingsIcon size={24} />
          설정
        </h1>
        <p>나만의 학습 경험 만들기</p>
      </div>

      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'subjects' ? 'active' : ''}`}
          onClick={() => setActiveTab('subjects')}
        >
          <Users size={16} />
          과목 관리
        </button>
        <button
          className={`tab ${activeTab === 'exam' ? 'active' : ''}`}
          onClick={() => setActiveTab('exam')}
        >
          <Target size={16} />
          전역 설정
        </button>
        <button
          className={`tab ${activeTab === 'data' ? 'active' : ''}`}
          onClick={() => setActiveTab('data')}
        >
          <BookOpen size={16} />
          데이터 관리
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'subjects' && (
          <SubjectManager studyData={studyData} setStudyData={setStudyData} />
        )}

        {activeTab === 'exam' && (
          <div className="exam-settings">
            <div className="setting-section">
              <h3>시험 유형</h3>
              <p>준비하고 있는 시험을 선택하세요</p>
              <div className="exam-grid">
                {examTypes.map(exam => (
                  <div
                    key={exam.id}
                    className={`exam-card ${studyData.examType === exam.id ? 'selected' : ''}`}
                    onClick={() => handleExamTypeChange(exam.id)}
                  >
                    <div className="exam-name">{exam.name}</div>
                    <div className="exam-description">{exam.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="setting-section">
              <h3>목표 점수</h3>
              <p>{studyData.examType} 목표 점수를 설정하세요</p>
              <div className="score-input">
                <input
                  type="number"
                  value={studyData.targetScore}
                  onChange={handleTargetScoreChange}
                  min="0"
                  max="1000"
                />
                <span className="score-unit">점</span>
              </div>
            </div>

            <div className="setting-section">
              <h3>학습 목표</h3>
              <p>등대까지의 현재 진행률 (100시간)</p>
              <div className="goal-progress">
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${Math.min((studyData.totalHours / 100) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="progress-text">
                  {studyData.totalHours} / 100시간 ({Math.round((studyData.totalHours / 100) * 100)}%)
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-settings">
            <div className="setting-section">
              <h3>데이터 내보내기</h3>
              <p>학습 데이터를 JSON 파일로 다운로드하세요</p>
              <button onClick={handleExportData} className="btn-secondary">
                <Download size={16} />
                데이터 내보내기
              </button>
            </div>

            <div className="setting-section">
              <h3>데이터 가져오기</h3>
              <p>이전에 내보낸 데이터 파일을 업로드하세요</p>
              <label className="file-input-label">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  style={{ display: 'none' }}
                />
                <span className="btn-secondary">
                  <Upload size={16} />
                  데이터 가져오기
                </span>
              </label>
            </div>

            <div className="setting-section">
              <h3>데이터 전체 삭제</h3>
              <p>모든 학습 세션, 성찰, 진행상황을 삭제합니다</p>
              <button onClick={handleClearData} className="btn-danger">
                <Trash2 size={16} />
                데이터 전체 삭제
              </button>
            </div>

            <div className="setting-section">
              <h3>데이터 요약</h3>
              <div className="data-summary">
                <div className="summary-item">
                  <span className="summary-label">총 학습시간:</span>
                  <span className="summary-value">{studyData.totalHours}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">학습 세션:</span>
                  <span className="summary-value">{studyData.sessions?.length || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">성찰:</span>
                  <span className="summary-value">{studyData.reflections?.length || 0}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">현재 시험:</span>
                  <span className="summary-value">{studyData.examType}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Settings