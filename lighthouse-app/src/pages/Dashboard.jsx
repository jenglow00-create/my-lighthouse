import { BarChart3, Clock, Target, TrendingUp, Calendar, BookOpen, ChevronDown, Filter } from 'lucide-react'
import { useState } from 'react'

function Dashboard({ studyData }) {
  const [selectedSubjectId, setSelectedSubjectId] = useState('all')
  const [showSubjectFilter, setShowSubjectFilter] = useState(false)

  const sessions = studyData.sessions || []
  const reflections = studyData.reflections || []
  const subjects = studyData.subjects || {}
  const subjectsList = Object.entries(subjects)

  // 필터링된 세션
  const filteredSessions = selectedSubjectId === 'all'
    ? sessions
    : sessions.filter(session => session.subjectId === selectedSubjectId)

  // 현재 선택된 과목
  const currentSubject = selectedSubjectId !== 'all' ? subjects[selectedSubjectId] : null

  const calculateTotalHours = (sessions) => {
    return sessions.reduce((total, session) => total + session.duration, 0)
  }

  const totalHours = calculateTotalHours(filteredSessions)

  const stats = {
    totalHours,
    totalSessions: filteredSessions.length,
    averageSession: filteredSessions.length > 0 ? (totalHours / filteredSessions.length).toFixed(1) : 0,
    streak: calculateStreak(filteredSessions),
    thisWeek: calculateWeeklyHours(filteredSessions),
    thisMonth: calculateMonthlyHours(filteredSessions),
    progress: currentSubject ? Math.min((currentSubject.totalHours / currentSubject.targetHours) * 100, 100) : 0
  }

  const recentActivity = filteredSessions.slice(0, 10)
  const topicStats = calculateTopicStats(filteredSessions)

  function calculateStreak(sessions) {
    if (sessions.length === 0) return 0

    const today = new Date()
    let streak = 0
    let currentDate = new Date(today)

    while (true) {
      const dateStr = currentDate.toISOString().split('T')[0]
      const hasSession = sessions.some(session => session.date === dateStr)

      if (hasSession) {
        streak++
        currentDate.setDate(currentDate.getDate() - 1)
      } else if (streak === 0 && dateStr === today.toISOString().split('T')[0]) {
        currentDate.setDate(currentDate.getDate() - 1)
      } else {
        break
      }
    }

    return streak
  }

  function calculateWeeklyHours(sessions) {
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    return sessions
      .filter(session => new Date(session.date) >= oneWeekAgo)
      .reduce((total, session) => total + session.duration, 0)
  }

  function calculateMonthlyHours(sessions) {
    const oneMonthAgo = new Date()
    oneMonthAgo.setDate(oneMonthAgo.getDate() - 30)

    return sessions
      .filter(session => new Date(session.date) >= oneMonthAgo)
      .reduce((total, session) => total + session.duration, 0)
  }

  function calculateTopicStats(sessions) {
    const topicMap = {}
    sessions.forEach(session => {
      topicMap[session.topic] = (topicMap[session.topic] || 0) + session.duration
    })

    return Object.entries(topicMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([topic, hours]) => ({ topic, hours }))
  }

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1>
          <BarChart3 size={24} />
          대시보드
        </h1>
        <p>나의 학습 진행 상황과 통찰</p>
      </div>

      {subjectsList.length > 0 && (
        <div className="subject-filter">
          <div className="filter-container">
            <button
              className="filter-btn"
              onClick={() => setShowSubjectFilter(!showSubjectFilter)}
            >
              <Filter size={16} />
              {selectedSubjectId === 'all' ? '전체 과목' : subjects[selectedSubjectId]?.name}
              <ChevronDown size={16} className={showSubjectFilter ? 'rotated' : ''} />
            </button>

            {showSubjectFilter && (
              <div className="filter-dropdown">
                <button
                  className={`filter-option ${selectedSubjectId === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSubjectId('all')
                    setShowSubjectFilter(false)
                  }}
                >
                  전체 과목
                </button>
                {subjectsList.map(([subjectId, subject]) => (
                  <button
                    key={subjectId}
                    className={`filter-option ${selectedSubjectId === subjectId ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedSubjectId(subjectId)
                      setShowSubjectFilter(false)
                    }}
                  >
                    {subject.name} ({subject.examType})
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalHours}시간</div>
            <div className="stat-label">총 학습시간</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalSessions}</div>
            <div className="stat-label">학습 세션</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.streak}</div>
            <div className="stat-label">연속 일수</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <Target size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.averageSession}시간</div>
            <div className="stat-label">평균 세션</div>
          </div>
        </div>

        {currentSubject && (
          <div className="stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div className="stat-content">
              <div className="stat-value">{Math.round(stats.progress)}%</div>
              <div className="stat-label">목표 달성률</div>
            </div>
          </div>
        )}
      </div>

      <div className="dashboard-sections">
        <div className="section">
          <h3>최근 활동</h3>
          <div className="time-stats">
            <div className="time-stat">
              <span className="time-period">이번 주</span>
              <span className="time-value">{stats.thisWeek.toFixed(1)}시간</span>
            </div>
            <div className="time-stat">
              <span className="time-period">이번 달</span>
              <span className="time-value">{stats.thisMonth.toFixed(1)}시간</span>
            </div>
          </div>

          {recentActivity.length > 0 ? (
            <div className="activity-list">
              {recentActivity.map(session => {
                const subject = subjects[session.subjectId]
                return (
                  <div key={session.id} className="activity-item">
                    <div className="activity-date">{session.date}</div>
                    <div className="activity-details">
                      {selectedSubjectId === 'all' && (
                        <div className="activity-subject">{subject?.name || '알 수 없음'}</div>
                      )}
                      <div className="activity-topic">{session.topic}</div>
                    </div>
                    <div className="activity-duration">{session.duration}시간</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-state">
              <Calendar size={48} />
              <p>아직 기록된 세션이 없습니다</p>
            </div>
          )}
        </div>

        <div className="section">
          <h3>주요 학습 주제</h3>
          {topicStats.length > 0 ? (
            <div className="topics-list">
              {topicStats.map(({ topic, hours }) => (
                <div key={topic} className="topic-item">
                  <div className="topic-name">{topic}</div>
                  <div className="topic-bar">
                    <div
                      className="topic-progress"
                      style={{ width: `${(hours / topicStats[0].hours) * 100}%` }}
                    ></div>
                  </div>
                  <div className="topic-hours">{hours.toFixed(1)}시간</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <BookOpen size={48} />
              <p>학습을 시작하면 주요 주제를 확인할 수 있습니다</p>
            </div>
          )}
        </div>

        <div className="section">
          <h3>학습 인사이트</h3>
          <div className="insights">
            {subjectsList.length === 0 && (
              <div className="insight">
                <span className="insight-icon">📚</span>
                <p>먼저 설정에서 과목을 추가해주세요!</p>
              </div>
            )}

            {stats.totalHours === 0 && subjectsList.length > 0 && (
              <div className="insight">
                <span className="insight-icon">🚀</span>
                <p>학습 여정을 시작할 준비가 되셨나요? 첫 번째 학습 세션을 기록해보세요!</p>
              </div>
            )}

            {stats.totalHours > 0 && stats.totalHours < 10 && (
              <div className="insight">
                <span className="insight-icon">🌱</span>
                <p>훌륭한 시작입니다! 학습 습관을 만들어가고 있어요.</p>
              </div>
            )}

            {stats.streak >= 3 && (
              <div className="insight">
                <span className="insight-icon">🔥</span>
                <p>훌륭합니다! {stats.streak}일 연속 학습 중이에요!</p>
              </div>
            )}

            {stats.averageSession > 2 && (
              <div className="insight">
                <span className="insight-icon">⏰</span>
                <p>평균 세션 시간이 {stats.averageSession}시간이네요 - 훌륭한 집중력입니다!</p>
              </div>
            )}

            {currentSubject && stats.progress > 50 && (
              <div className="insight">
                <span className="insight-icon">🎯</span>
                <p>{currentSubject.name} 목표의 {Math.round(stats.progress)}%를 달성했어요!</p>
              </div>
            )}

            {reflections.length >= 3 && (
              <div className="insight">
                <span className="insight-icon">🧠</span>
                <p>정기적인 성찰을 통해 강한 메타인지 능력을 발달시키고 있어요!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard