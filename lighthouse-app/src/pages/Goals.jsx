import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react'

function Goals({ studyData }) {
  const navigate = useNavigate()
  const [selectedSubjectId, setSelectedSubjectId] = useState(null)
  const [progressUnit, setProgressUnit] = useState('weekly')

  const subjects = useMemo(() => studyData.subjects || {}, [studyData.subjects])
  const subjectsList = useMemo(() => Object.entries(subjects), [subjects])

  // 선택된 과목이 없거나 존재하지 않으면 첫 번째 과목 선택
  useEffect(() => {
    if (!selectedSubjectId && subjectsList.length > 0) {
      setSelectedSubjectId(subjectsList[0][0])
    } else if (selectedSubjectId && !subjects[selectedSubjectId] && subjectsList.length > 0) {
      setSelectedSubjectId(subjectsList[0][0])
    }
  }, [subjects, selectedSubjectId, subjectsList])

  const currentSubject = selectedSubjectId ? subjects[selectedSubjectId] : null
  const progress = currentSubject ? Math.min((currentSubject.totalHours / currentSubject.targetHours) * 100, 100) : 0

  const calculateDaysUntilExam = (examDate) => {
    if (!examDate) return null
    const today = new Date()
    const exam = new Date(examDate)
    const diffTime = exam - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculateProgress = (unit) => {
    if (!currentSubject) return { current: 0, target: 0, percentage: 0 }

    const daysLeft = calculateDaysUntilExam(currentSubject.examDate)
    if (!daysLeft || daysLeft <= 0) {
      return { current: currentSubject.totalHours, target: currentSubject.targetHours, percentage: progress }
    }

    const hoursLeft = currentSubject.targetHours - currentSubject.totalHours
    const today = new Date()
    const startOfWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay())
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

    const sessions = studyData.sessions || []
    const subjectSessions = sessions.filter(s => s.subjectId === selectedSubjectId)

    switch (unit) {
      case 'daily': {
        const todayStr = new Date().toISOString().split('T')[0]
        const todaySessions = subjectSessions.filter(s => s.date === todayStr)
        const todayHours = todaySessions.reduce((sum, s) => sum + s.duration, 0)
        const dailyTarget = Math.max(hoursLeft / daysLeft, 0)
        return {
          current: todayHours,
          target: dailyTarget,
          percentage: dailyTarget > 0 ? Math.min((todayHours / dailyTarget) * 100, 100) : 0,
          label: '오늘'
        }
      }
      case 'weekly': {
        const weekSessions = subjectSessions.filter(s => new Date(s.date) >= startOfWeek)
        const weekHours = weekSessions.reduce((sum, s) => sum + s.duration, 0)
        const weeklyTarget = Math.max((hoursLeft / daysLeft) * 7, 0)
        return {
          current: weekHours,
          target: weeklyTarget,
          percentage: weeklyTarget > 0 ? Math.min((weekHours / weeklyTarget) * 100, 100) : 0,
          label: '이번 주'
        }
      }
      case 'monthly': {
        const monthSessions = subjectSessions.filter(s => new Date(s.date) >= startOfMonth)
        const monthHours = monthSessions.reduce((sum, s) => sum + s.duration, 0)
        const monthlyTarget = Math.max((hoursLeft / daysLeft) * 30, 0)
        return {
          current: monthHours,
          target: monthlyTarget,
          percentage: monthlyTarget > 0 ? Math.min((monthHours / monthlyTarget) * 100, 100) : 0,
          label: '이번 달'
        }
      }
      case 'total':
      default:
        return {
          current: currentSubject.totalHours,
          target: currentSubject.targetHours,
          percentage: progress,
          label: '전체 진행률'
        }
    }
  }

  const progressData = calculateProgress(progressUnit)
  const daysLeft = currentSubject ? calculateDaysUntilExam(currentSubject.examDate) : null

  return (
    <div className="goals">
      <div className="page-header">
        <h1>목표 관리</h1>
        <p>학습 목표를 설정하고 진행 상황을 확인하세요</p>
      </div>

      <div className="goals-content">
        {subjectsList.length === 0 ? (
          <div className="no-subjects-message">
            <h2>과목을 추가해주세요</h2>
            <p>학습 여정을 시작하려면 먼저 과목을 추가해야 합니다.</p>
            <button className="btn-primary" onClick={() => navigate('/settings')}>
              <Settings size={20} />
              과목 추가하기
            </button>
          </div>
        ) : (
          <>
            <div className="subject-selection">
              <div className="subject-tabs">
                {subjectsList.map(([subjectId, subject]) => {
                  const subjectProgress = Math.min((subject.totalHours / subject.targetHours) * 100, 100)
                  const isActive = selectedSubjectId === subjectId
                  return (
                    <button
                      key={subjectId}
                      className={`subject-tab ${isActive ? 'active' : ''}`}
                      onClick={() => setSelectedSubjectId(subjectId)}
                    >
                      <div className="tab-header">
                        <span className="tab-name">{subject.name}</span>
                        <span className="tab-progress">{Math.round(subjectProgress)}%</span>
                      </div>
                      <div className="tab-progress-bar">
                        <div
                          className="tab-progress-fill"
                          style={{ width: `${subjectProgress}%` }}
                        ></div>
                      </div>
                      <div className="tab-details">
                        <span className="exam-type">{subject.examType}</span>
                        {subject.examDate && (
                          <span className="days-remaining">
                            {(() => {
                              const days = calculateDaysUntilExam(subject.examDate)
                              if (days === null) return ''
                              if (days > 0) return `D-${days}`
                              if (days === 0) return 'D-Day!'
                              return '시험종료'
                            })()}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="current-subject-info">
              <h2>{currentSubject?.name}</h2>
              <div className="subject-meta">
                <span className="exam-type-large">{currentSubject?.examType}</span>
                {daysLeft !== null && (
                  <span className={`days-left-large ${daysLeft <= 7 ? 'urgent' : daysLeft <= 30 ? 'warning' : 'normal'}`}>
                    {daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day!' : '시험 종료'}
                  </span>
                )}
              </div>
              {currentSubject?.description && (
                <p className="subject-description">{currentSubject.description}</p>
              )}
            </div>

            <div className="progress-controls">
              <div className="unit-selector">
                {[
                  { key: 'daily', label: '일간' },
                  { key: 'weekly', label: '주간' },
                  { key: 'monthly', label: '월간' },
                  { key: 'total', label: '전체' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    className={`unit-btn ${progressUnit === key ? 'active' : ''}`}
                    onClick={() => setProgressUnit(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="progress-dashboard">
              <div className="progress-section main-progress">
                <div className="section-header">
                  <h3>등대까지의 여정</h3>
                  <span className="progress-percentage">{Math.round(progress)}%</span>
                </div>
                <div className="large-progress-bar">
                  <div
                    className="large-progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="progress-details">
                  <span>학습시간: {currentSubject?.totalHours || 0} / {currentSubject?.targetHours || 0}시간</span>
                  <span>남은 시간: {Math.max(0, (currentSubject?.targetHours || 0) - (currentSubject?.totalHours || 0))}시간</span>
                </div>
              </div>

              <div className="progress-section period-progress">
                <div className="section-header">
                  <h3>{progressData.label} 목표</h3>
                  <span className="progress-percentage">{Math.round(progressData.percentage)}%</span>
                </div>
                <div className="medium-progress-bar">
                  <div
                    className="medium-progress-fill"
                    style={{ width: `${progressData.percentage}%` }}
                  ></div>
                </div>
                <div className="progress-details">
                  <span>현재: {progressData.current.toFixed(1)}시간</span>
                  <span>목표: {progressData.target.toFixed(1)}시간</span>
                </div>
              </div>
            </div>

            {daysLeft > 0 && (
              <div className="daily-targets">
                <h3>남은 기간 대비 목표</h3>
                <div className="targets-grid">
                  <div className="target-card">
                    <div className="target-label">일일 목표</div>
                    <div className="target-value">{(() => {
                      const hoursLeft = Math.max(0, (currentSubject?.targetHours || 0) - (currentSubject?.totalHours || 0))
                      return (hoursLeft / daysLeft).toFixed(1)
                    })()} 시간</div>
                    <div className="target-note">매일 필요한 학습량</div>
                  </div>

                  <div className="target-card">
                    <div className="target-label">주간 목표</div>
                    <div className="target-value">{(() => {
                      const hoursLeft = Math.max(0, (currentSubject?.targetHours || 0) - (currentSubject?.totalHours || 0))
                      return ((hoursLeft / daysLeft) * 7).toFixed(1)
                    })()} 시간</div>
                    <div className="target-note">주당 필요한 학습량</div>
                  </div>

                  <div className="target-card">
                    <div className="target-label">남은 기간</div>
                    <div className="target-value">{daysLeft} 일</div>
                    <div className="target-note">시험까지 남은 시간</div>
                  </div>
                </div>
              </div>
            )}

            <div className="motivation-section">
              <div className="motivation-card">
                {progress < 25 && (
                  <>
                    <div className="motivation-icon">🌱</div>
                    <div className="motivation-text">
                      <h4>시작이 반이야!</h4>
                      <p>모든 전문가도 처음엔 초보였습니다. 항해를 시작하세요!</p>
                    </div>
                  </>
                )}
                {progress >= 25 && progress < 50 && (
                  <>
                    <div className="motivation-icon">⛵</div>
                    <div className="motivation-text">
                      <h4>순풍을 타고 있어요!</h4>
                      <p>등대가 가까워지고 있어요. 계속 항해하세요!</p>
                    </div>
                  </>
                )}
                {progress >= 50 && progress < 80 && (
                  <>
                    <div className="motivation-icon">🌅</div>
                    <div className="motivation-text">
                      <h4>등대의 빛이 보여요!</h4>
                      <p>절반을 지났습니다! 빛이 앞길을 비춰주고 있어요.</p>
                    </div>
                  </>
                )}
                {progress >= 80 && (
                  <>
                    <div className="motivation-icon">🏆</div>
                    <div className="motivation-text">
                      <h4>등대에 도착!</h4>
                      <p>거의 다 왔어요! 등대가 당신을 집으로 안내합니다!</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Goals