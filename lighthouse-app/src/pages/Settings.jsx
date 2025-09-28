import { useState } from 'react'
import { Settings as SettingsIcon, Target, BookOpen, Trash2, Download, Upload, Users, Brain, ToggleLeft, ToggleRight, User, Clock, Database } from 'lucide-react'
import SubjectManager from '../components/SubjectManager'
import { successRateDataCollector } from '../utils/successRateDataCollector'

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

  const handleExportPredictionData = () => {
    try {
      const allCollectedData = successRateDataCollector.exportAllCollectedData()
      const dataStr = JSON.stringify(allCollectedData, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement('a')
      link.href = url
      link.download = `lighthouse-prediction-data-${new Date().toISOString().split('T')[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
      alert('합격률 예측 데이터를 내보냈습니다.')
    } catch (error) {
      alert('데이터 내보내기에 실패했습니다.')
      console.error(error)
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
          className={`tab ${activeTab === 'reflection' ? 'active' : ''}`}
          onClick={() => setActiveTab('reflection')}
        >
          <Brain size={16} />
          성찰 설정
        </button>
        <button
          className={`tab ${activeTab === 'personal' ? 'active' : ''}`}
          onClick={() => setActiveTab('personal')}
        >
          <User size={16} />
          개인 정보
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

        {activeTab === 'reflection' && (
          <div className="reflection-settings">
            <div className="setting-section">
              <h3>자동 성찰 기능</h3>
              <p>학습 세션 완료 후 자동으로 성찰을 시작합니다</p>
              <div className="toggle-setting">
                <button
                  className={`toggle-btn ${studyData.globalSettings?.reflectionEnabled !== false ? 'active' : ''}`}
                  onClick={() => setStudyData(prev => ({
                    ...prev,
                    globalSettings: {
                      ...prev.globalSettings,
                      reflectionEnabled: prev.globalSettings?.reflectionEnabled !== false ? false : true
                    }
                  }))}
                >
                  {studyData.globalSettings?.reflectionEnabled !== false ? (
                    <>
                      <ToggleRight size={24} />
                      <span>활성화됨</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft size={24} />
                      <span>비활성화됨</span>
                    </>
                  )}
                </button>
              </div>
              <div className="setting-description">
                {studyData.globalSettings?.reflectionEnabled !== false ? (
                  <p className="enabled-text">✅ 학습 완료 시 자동으로 성찰 프로세스가 시작됩니다</p>
                ) : (
                  <p className="disabled-text">❌ 성찰 기능이 비활성화되어 있습니다. 수동으로 성찰 페이지에서만 이용 가능합니다</p>
                )}
              </div>
            </div>

            <div className="setting-section">
              <h3>성찰 통계</h3>
              <div className="reflection-stats">
                <div className="stat-item">
                  <span className="stat-label">총 성찰 수:</span>
                  <span className="stat-value">{studyData.reflections?.length || 0}개</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">이번 주 성찰:</span>
                  <span className="stat-value">
                    {(() => {
                      const thisWeek = new Date()
                      const startOfWeek = new Date(thisWeek.getFullYear(), thisWeek.getMonth(), thisWeek.getDate() - thisWeek.getDay())
                      const weeklyReflections = (studyData.reflections || []).filter(r =>
                        new Date(r.date) >= startOfWeek
                      )
                      return weeklyReflections.length
                    })()}개
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">평균 만족도:</span>
                  <span className="stat-value">
                    {(() => {
                      const reflections = studyData.reflections || []
                      if (reflections.length === 0) return '데이터 없음'
                      const avgRating = reflections.reduce((sum, r) => sum + (r.selfRating || 0), 0) / reflections.length
                      return `${avgRating.toFixed(1)}/5`
                    })()}
                  </span>
                </div>
              </div>
            </div>

            <div className="setting-section">
              <h3>성찰 워크플로우</h3>
              <p>새로운 성찰 시스템의 단계별 과정:</p>
              <div className="workflow-steps">
                <div className="workflow-step">
                  <div className="step-number">1</div>
                  <div className="step-content">
                    <h4>주제 입력</h4>
                    <p>학습한 내용이나 주제를 간단히 입력</p>
                  </div>
                </div>
                <div className="workflow-step">
                  <div className="step-number">2</div>
                  <div className="step-content">
                    <h4>랜덤 질문</h4>
                    <p>시스템이 제공하는 성찰 질문 확인</p>
                  </div>
                </div>
                <div className="workflow-step">
                  <div className="step-number">3</div>
                  <div className="step-content">
                    <h4>자유 작성</h4>
                    <p>질문에 대한 생각을 자유롭게 작성</p>
                  </div>
                </div>
                <div className="workflow-step">
                  <div className="step-number">4</div>
                  <div className="step-content">
                    <h4>셀프 체크</h4>
                    <p>성찰이 얼마나 도움이 되었는지 평가</p>
                  </div>
                </div>
                <div className="workflow-step">
                  <div className="step-number">5</div>
                  <div className="step-content">
                    <h4>추가 정보</h4>
                    <p>어려움, 계획 등 추가 정보 입력 (선택)</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'personal' && (
          <div className="personal-settings">
            <div className="setting-section">
              <h3>개인 정보</h3>
              <p>학습 환경에 맞는 맞춤 설정을 위해 정보를 입력해주세요</p>
            </div>

            <div className="setting-section">
              <h4>
                <Clock size={20} />
                하루 가능 학습 시간
              </h4>
              <p>하루에 학습할 수 있는 최대 시간을 설정하세요</p>
              <div className="hours-input">
                <input
                  type="number"
                  value={studyData.globalSettings?.dailyStudyHours || ''}
                  onChange={(e) => setStudyData(prev => ({
                    ...prev,
                    globalSettings: {
                      ...prev.globalSettings,
                      dailyStudyHours: parseFloat(e.target.value) || 0
                    }
                  }))}
                  min="0"
                  max="24"
                  step="0.5"
                  placeholder="8"
                />
                <span className="hours-unit">시간</span>
              </div>
            </div>

            <div className="setting-section">
              <h4>
                <User size={20} />
                현재 직업
              </h4>
              <p>학습 스케줄 추천에 도움이 됩니다</p>
              <div className="occupation-selection">
                {[
                  { id: 'student', name: '학생', description: '전일제 학생' },
                  { id: 'worker', name: '직장인', description: '아침-저녁 근무' },
                  { id: 'fulltime', name: '전업', description: '전업 수험생' }
                ].map(occ => (
                  <div
                    key={occ.id}
                    className={`occupation-card ${
                      (studyData.globalSettings?.occupation || '') === occ.id ? 'selected' : ''
                    }`}
                    onClick={() => setStudyData(prev => ({
                      ...prev,
                      globalSettings: {
                        ...prev.globalSettings,
                        occupation: occ.id
                      }
                    }))}
                  >
                    <div className="occupation-name">{occ.name}</div>
                    <div className="occupation-description">{occ.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="setting-section">
              <h4>학습 통계</h4>
              <div className="personal-stats">
                <div className="stat-item">
                  <span className="stat-label">총 학습 시간:</span>
                  <span className="stat-value">
                    {(studyData.sessions || []).reduce((sum, s) => sum + (s.duration || 0), 0).toFixed(1)}시간
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">평균 일일 학습:</span>
                  <span className="stat-value">
                    {(() => {
                      const sessions = studyData.sessions || []
                      if (sessions.length === 0) return '0시간'
                      const dates = [...new Set(sessions.map(s => s.date))]
                      const totalHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
                      return `${(totalHours / dates.length).toFixed(1)}시간`
                    })()}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">가장 많이 한 학습:</span>
                  <span className="stat-value">
                    {(() => {
                      const sessions = studyData.sessions || []
                      if (sessions.length === 0) return '데이터 없음'
                      const typeCount = {}
                      sessions.forEach(s => {
                        if (s.studyType) {
                          typeCount[s.studyType] = (typeCount[s.studyType] || 0) + 1
                        }
                      })
                      const mostType = Object.entries(typeCount).sort((a, b) => b[1] - a[1])[0]
                      const typeNames = {
                        'concept': '개념 이해',
                        'practice': '문제 풀이',
                        'memorize': '암기',
                        'review': '복습'
                      }
                      return mostType ? typeNames[mostType[0]] || mostType[0] : '데이터 없음'
                    })()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'data' && (
          <div className="data-settings">
            <div className="setting-section">
              <h3>학습 데이터 내보내기</h3>
              <p>학습 데이터를 JSON 파일로 다운로드하세요</p>
              <button onClick={handleExportData} className="btn-secondary">
                <Download size={16} />
                학습 데이터 내보내기
              </button>
            </div>

            <div className="setting-section">
              <h3>
                <Database size={20} />
                합격률 예측 데이터
              </h3>
              <p>추후 합격률 예측 기능을 위해 수집되는 데이터입니다</p>
              <div className="prediction-data-info">
                <div className="data-collection-status">
                  <div className="status-item">
                    <span>학습 패턴 데이터:</span>
                    <span className="status-value">
                      {JSON.parse(localStorage.getItem('lighthouse-learning-pattern-data') || '[]').length}개 기록
                    </span>
                  </div>
                  <div className="status-item">
                    <span>점수 진행 데이터:</span>
                    <span className="status-value">
                      {JSON.parse(localStorage.getItem('lighthouse-score-progress-data') || '[]').length}개 기록
                    </span>
                  </div>
                  <div className="status-item">
                    <span>개인 특성 데이터:</span>
                    <span className="status-value">
                      {JSON.parse(localStorage.getItem('lighthouse-personal-characteristics-data') || '[]').length}개 기록
                    </span>
                  </div>
                  <div className="status-item">
                    <span>예측 데이터:</span>
                    <span className="status-value">
                      {JSON.parse(localStorage.getItem('lighthouse-prediction-data') || '[]').length}개 기록
                    </span>
                  </div>
                </div>
                <button onClick={handleExportPredictionData} className="btn-primary">
                  <Database size={16} />
                  예측 데이터 내보내기
                </button>
              </div>
              <div className="data-collection-note">
                <p><strong>참고:</strong> 이 데이터는 5회 세션마다 또는 점수 기록 시 자동으로 수집됩니다.</p>
                <p>합격률 예측 기능이 활성화되면 이 데이터를 사용하여 개인화된 합격률을 제공합니다.</p>
              </div>
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