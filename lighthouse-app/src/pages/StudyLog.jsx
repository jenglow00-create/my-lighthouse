import { useState } from 'react'
import { Plus, Clock, BookOpen, Calendar } from 'lucide-react'

function StudyLog({ studyData, setStudyData }) {
  const [isLogging, setIsLogging] = useState(false)
  const [sessionData, setSessionData] = useState({
    duration: '',
    subjectId: '',
    topic: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!sessionData.duration || !sessionData.topic || !sessionData.subjectId) return

    const newSession = {
      id: Date.now(),
      subjectId: sessionData.subjectId,
      duration: parseFloat(sessionData.duration),
      topic: sessionData.topic,
      notes: sessionData.notes,
      date: sessionData.date,
      timestamp: new Date().toISOString()
    }

    setStudyData(prev => {
      const updatedSubjects = { ...prev.subjects }
      if (updatedSubjects[sessionData.subjectId]) {
        updatedSubjects[sessionData.subjectId] = {
          ...updatedSubjects[sessionData.subjectId],
          totalHours: (updatedSubjects[sessionData.subjectId].totalHours || 0) + newSession.duration
        }
      }

      return {
        ...prev,
        subjects: updatedSubjects,
        sessions: [newSession, ...prev.sessions]
      }
    })

    setSessionData({
      duration: '',
      subjectId: '',
      topic: '',
      notes: '',
      date: new Date().toISOString().split('T')[0]
    })
    setIsLogging(false)
  }

  const recentSessions = (studyData.sessions || []).slice(0, 10)
  const subjects = studyData.subjects || {}
  const subjectsList = Object.entries(subjects)

  return (
    <div className="study-log">
      <div className="page-header">
        <h1>학습 기록</h1>
        <button
          className="btn-primary"
          onClick={() => setIsLogging(!isLogging)}
        >
          <Plus size={20} />
          학습 기록하기
        </button>
      </div>

      {isLogging && (
        <div className="log-form-container">
          <form onSubmit={handleSubmit} className="log-form">
            <h3>학습 세션 기록</h3>

            <div className="form-group">
              <label>
                <Clock size={16} />
                학습 시간 (시간)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={sessionData.duration}
                onChange={(e) => setSessionData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="예: 1.5"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <BookOpen size={16} />
                과목 선택
              </label>
              <select
                value={sessionData.subjectId}
                onChange={(e) => setSessionData(prev => ({ ...prev, subjectId: e.target.value }))}
                required
              >
                <option value="">과목을 선택하세요</option>
                {subjectsList.map(([subjectId, subject]) => (
                  <option key={subjectId} value={subjectId}>
                    {subject.name} ({subject.examType})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>학습 주제</label>
              <input
                type="text"
                value={sessionData.topic}
                onChange={(e) => setSessionData(prev => ({ ...prev, topic: e.target.value }))}
                placeholder="예: 문법 연습, 듣기 연습, 단어 암기"
                required
              />
            </div>

            <div className="form-group">
              <label>
                <Calendar size={16} />
                날짜
              </label>
              <input
                type="date"
                value={sessionData.date}
                onChange={(e) => setSessionData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>메모 (선택사항)</label>
              <textarea
                value={sessionData.notes}
                onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="무엇을 배웠나요? 어떤 어려움이 있었나요?"
                rows="3"
              />
            </div>

            <div className="form-actions">
              <button type="button" onClick={() => setIsLogging(false)} className="btn-secondary">
                취소
              </button>
              <button type="submit" className="btn-primary">
                저장하기
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="recent-sessions">
        <h3>최근 학습 세션</h3>
        {subjectsList.length === 0 && (
          <div className="no-subjects-warning">
            <p>⚠️ 등록된 과목이 없습니다. <strong>설정</strong>에서 과목을 먼저 추가해주세요.</p>
          </div>
        )}
        {recentSessions.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} />
            <p>아직 학습 세션이 없습니다.</p>
            {subjectsList.length === 0 ? (
              <p>먼저 설정에서 과목을 추가해주세요!</p>
            ) : (
              <p>학습 기록을 시작해보세요!</p>
            )}
          </div>
        ) : (
          <div className="sessions-list">
            {recentSessions.map(session => {
              const subject = subjects[session.subjectId]
              return (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <div className="session-subject">
                      <span className="subject-name">{subject?.name || '알 수 없는 과목'}</span>
                      <span className="exam-type">{subject?.examType}</span>
                    </div>
                    <span className="session-duration">{session.duration}시간</span>
                  </div>
                  <div className="session-topic">{session.topic}</div>
                  <div className="session-date">{session.date}</div>
                  {session.notes && (
                    <div className="session-notes">{session.notes}</div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default StudyLog