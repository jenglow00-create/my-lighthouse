import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Clock, BookOpen, Calendar, Brain, TrendingUp, Users } from 'lucide-react'
import { generateInstantFeedback, generateRealTimeFeedback, type AIFeedback } from '@/utils/aiAnalysis'
import type { StudySession, UserData, Rating } from '@/types'

interface StudyLogProps {
  studyData: UserData
  setStudyData: React.Dispatch<React.SetStateAction<UserData>>
}

interface SessionFormData {
  duration: string
  subjectId: string
  notes: string
  date: string
  studyType: string
  concentration: Rating
  understanding: Rating
  fatigue: Rating
}

interface StudyTypeInfo {
  id: string
  name: string
  description: string
}

function StudyLog({ studyData, setStudyData }: StudyLogProps) {
  const navigate = useNavigate()
  const [isLogging, setIsLogging] = useState(false)
  const [showReflectionPrompt, setShowReflectionPrompt] = useState(false)
  const [lastSessionTopic, setLastSessionTopic] = useState('')
  const [aiFeedback, setAiFeedback] = useState<AIFeedback | null>(null)
  const [realTimeFeedback, setRealTimeFeedback] = useState<Record<string, string>>({})
  const [showFeedback, setShowFeedback] = useState(false)
  const [sessionData, setSessionData] = useState<SessionFormData>({
    duration: '',
    subjectId: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
    studyType: '',
    concentration: 3,
    understanding: 3,
    fatigue: 3
  })

  const studyTypes: StudyTypeInfo[] = [
    { id: 'concept', name: '개념 이해', description: '교재 읽기, 강의 듣기' },
    { id: 'practice', name: '문제 풀이', description: '기출문제, 모의고사' },
    { id: 'memorize', name: '암기', description: '단어, 공식' },
    { id: 'review', name: '복습', description: '오답 정리, 재학습' }
  ]

  const ratingLabels: Record<'concentration' | 'understanding' | 'fatigue', string[]> = {
    concentration: ['산만', '떨어짐', '보통', '집중', '매우 집중'],
    understanding: ['전혀 모름', '조금 알겠음', '어느정도', '잘 알겠음', '완전 이해'],
    fatigue: ['매우 피곤', '피곤', '보통', '쌈', '매우 쌈']
  }

  // AI 피드백 생성
  useEffect(() => {
    if (sessionData.duration && sessionData.concentration && sessionData.understanding) {
      const userProfile = studyData.personalInfo || {}
      const allSessions = studyData.sessions || []

      // sessionData를 Partial<StudySession> 형식으로 변환
      const sessionForFeedback: Partial<StudySession> = {
        duration: parseFloat(sessionData.duration) || 0,
        concentration: sessionData.concentration,
        understanding: sessionData.understanding,
        fatigue: sessionData.fatigue,
        studyType: sessionData.studyType as any
      }

      const feedback = generateInstantFeedback(sessionForFeedback, userProfile, allSessions)
      setAiFeedback(feedback)
      setShowFeedback(true)
    }
  }, [sessionData.concentration, sessionData.understanding, sessionData.fatigue, sessionData.duration, sessionData.studyType, studyData.personalInfo, studyData.sessions])

  // 실시간 피드백 처리
  const handleRealTimeFeedback = (fieldName: string, value: number | string) => {
    const feedback = generateRealTimeFeedback(fieldName, value)

    if (feedback.length > 0) {
      setRealTimeFeedback(prev => ({ ...prev, [fieldName]: feedback[0] }))
      setTimeout(() => {
        setRealTimeFeedback(prev => {
          const newFeedback = { ...prev }
          delete newFeedback[fieldName]
          return newFeedback
        })
      }, 3000)
    }
  }

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!sessionData.duration || !sessionData.subjectId || !sessionData.studyType) return

    const newSession: StudySession = {
      id: Date.now(),
      subjectId: sessionData.subjectId,
      duration: parseFloat(sessionData.duration),
      notes: sessionData.notes,
      date: sessionData.date,
      timestamp: new Date().toISOString(),
      studyType: sessionData.studyType as any, // StudyType enum으로 변환 필요
      concentration: sessionData.concentration,
      understanding: sessionData.understanding,
      fatigue: sessionData.fatigue
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
        sessions: [newSession, ...(prev.sessions || [])]
      }
    })

    // 성찰 자동 트리거 체크
    const reflectionEnabled = (studyData.settings?.autoReflection?.enabled) !== false
    if (reflectionEnabled) {
      setLastSessionTopic('학습 세션')
      setShowReflectionPrompt(true)
    }

    if (!reflectionEnabled) {
      resetSessionData()
    }
  }

  const resetSessionData = () => {
    setSessionData({
      duration: '',
      subjectId: '',
      notes: '',
      date: new Date().toISOString().split('T')[0],
      studyType: '',
      concentration: 3,
      understanding: 3,
      fatigue: 3
    })
    setIsLogging(false)
  }

  const handleStartReflection = () => {
    setShowReflectionPrompt(false)
    resetSessionData()

    navigate('/metacognition', {
      state: {
        autoTrigger: true,
        topic: lastSessionTopic
      }
    })
  }

  const handleSkipReflection = () => {
    setShowReflectionPrompt(false)
    resetSessionData()
  }

  const recentSessions = (studyData.sessions || []).slice(0, 10)
  const subjects = studyData.subjects || {}
  const subjectsList = Object.entries(subjects)

  return (
    <main className="study-log" aria-labelledby="study-log-title">
      <header className="page-header">
        <h1 id="study-log-title">학습 기록</h1>
        <button
          className="btn-primary"
          onClick={() => setIsLogging(!isLogging)}
          aria-label={isLogging ? "학습 기록 폼 닫기" : "학습 기록 폼 열기"}
          aria-expanded={isLogging}
        >
          <Plus size={20} aria-hidden="true" />
          학습 기록하기
        </button>
      </header>

      {isLogging && (
        <section className="log-form-container" aria-labelledby="log-form-title">
          <form onSubmit={handleSubmit} className="log-form" aria-describedby="form-help">
            <h2 id="log-form-title">학습 세션 기록</h2>

            <div className="form-group">
              <label htmlFor="duration-input">
                <Clock size={16} aria-hidden="true" />
                학습 시간 (시간)
              </label>
              <input
                id="duration-input"
                type="number"
                step="0.5"
                min="0"
                value={sessionData.duration}
                onChange={(e) => {
                  setSessionData(prev => ({ ...prev, duration: e.target.value }))
                  handleRealTimeFeedback('duration', parseFloat(e.target.value))
                }}
                placeholder="예: 1.5"
                aria-describedby="duration-help"
                required
              />
              <span id="duration-help" className="help-text">
                소수점 입력 가능 (예: 1.5시간)
              </span>
            </div>

            <div className="form-group">
              <label htmlFor="subject-select">
                <BookOpen size={16} aria-hidden="true" />
                과목 선택
              </label>
              <select
                id="subject-select"
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
              <label htmlFor="study-type-select">
                <BookOpen size={16} aria-hidden="true" />
                학습 유형
              </label>
              <select
                id="study-type-select"
                value={sessionData.studyType}
                onChange={(e) => setSessionData(prev => ({ ...prev, studyType: e.target.value }))}
                required
              >
                <option value="">학습 유형을 선택하세요</option>
                {studyTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name} - {type.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="date-input">
                <Calendar size={16} aria-hidden="true" />
                날짜
              </label>
              <input
                id="date-input"
                type="date"
                value={sessionData.date}
                onChange={(e) => setSessionData(prev => ({ ...prev, date: e.target.value }))}
                required
              />
            </div>

            <fieldset className="study-state-section">
              <legend>학습 상태 체크</legend>
              <div className="rating-grid">
                <div className="rating-item">
                  <span id="concentration-label" className="rating-title">집중도</span>
                  <div
                    className="rating-buttons"
                    role="radiogroup"
                    aria-labelledby="concentration-label"
                    aria-describedby="concentration-value"
                  >
                    {([1, 2, 3, 4, 5] as const).map(num => (
                      <button
                        key={num}
                        type="button"
                        role="radio"
                        aria-checked={sessionData.concentration === num}
                        aria-label={`집중도 ${num}점 - ${ratingLabels.concentration[num - 1]}`}
                        className={`rating-btn ${sessionData.concentration === num ? 'selected' : ''}`}
                        onClick={() => {
                          setSessionData(prev => ({ ...prev, concentration: num }))
                          handleRealTimeFeedback('concentration', num)
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <span id="concentration-value" className="rating-label" aria-live="polite">
                    {ratingLabels.concentration[sessionData.concentration - 1]}
                  </span>
                  {realTimeFeedback.concentration && (
                    <div className="real-time-feedback" role="status" aria-live="polite">
                      {realTimeFeedback.concentration}
                    </div>
                  )}
                </div>

                <div className="rating-item">
                  <span id="understanding-label" className="rating-title">이해도</span>
                  <div
                    className="rating-buttons"
                    role="radiogroup"
                    aria-labelledby="understanding-label"
                    aria-describedby="understanding-value"
                  >
                    {([1, 2, 3, 4, 5] as const).map(num => (
                      <button
                        key={num}
                        type="button"
                        role="radio"
                        aria-checked={sessionData.understanding === num}
                        aria-label={`이해도 ${num}점 - ${ratingLabels.understanding[num - 1]}`}
                        className={`rating-btn ${sessionData.understanding === num ? 'selected' : ''}`}
                        onClick={() => {
                          setSessionData(prev => ({ ...prev, understanding: num }))
                          handleRealTimeFeedback('understanding', num)
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <span id="understanding-value" className="rating-label" aria-live="polite">
                    {ratingLabels.understanding[sessionData.understanding - 1]}
                  </span>
                  {realTimeFeedback.understanding && (
                    <div className="real-time-feedback" role="status" aria-live="polite">
                      {realTimeFeedback.understanding}
                    </div>
                  )}
                </div>

                <div className="rating-item">
                  <span id="fatigue-label" className="rating-title">피로도</span>
                  <div
                    className="rating-buttons"
                    role="radiogroup"
                    aria-labelledby="fatigue-label"
                    aria-describedby="fatigue-value"
                  >
                    {([1, 2, 3, 4, 5] as const).map(num => (
                      <button
                        key={num}
                        type="button"
                        role="radio"
                        aria-checked={sessionData.fatigue === num}
                        aria-label={`피로도 ${num}점 - ${ratingLabels.fatigue[num - 1]}`}
                        className={`rating-btn ${sessionData.fatigue === num ? 'selected' : ''}`}
                        onClick={() => {
                          setSessionData(prev => ({ ...prev, fatigue: num }))
                          handleRealTimeFeedback('fatigue', num)
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <span id="fatigue-value" className="rating-label" aria-live="polite">
                    {ratingLabels.fatigue[sessionData.fatigue - 1]}
                  </span>
                  {realTimeFeedback.fatigue && (
                    <div className="real-time-feedback" role="status" aria-live="polite">
                      {realTimeFeedback.fatigue}
                    </div>
                  )}
                </div>
              </div>
            </fieldset>

            {/* AI 피드백 박스 */}
            {showFeedback && aiFeedback && (
              <aside className="ai-feedback-box" role="status" aria-live="polite" aria-labelledby="ai-feedback-title">
                <div className="feedback-header">
                  <TrendingUp size={20} aria-hidden="true" />
                  <h3 id="ai-feedback-title">AI 분석 결과</h3>
                </div>

                {aiFeedback.comparison && (
                  <div className="feedback-item comparison">
                    <Users size={16} aria-hidden="true" />
                    <span>{aiFeedback.comparison}</span>
                  </div>
                )}

                {aiFeedback.recommendation && (
                  <div className="feedback-item recommendation">
                    <Brain size={16} aria-hidden="true" />
                    <span>{aiFeedback.recommendation}</span>
                  </div>
                )}

                {aiFeedback.motivationalMessage && (
                  <div className="feedback-item motivational">
                    {aiFeedback.motivationalMessage}
                  </div>
                )}

                {aiFeedback.warningMessage && (
                  <div className="feedback-item warning">
                    {aiFeedback.warningMessage}
                  </div>
                )}
              </aside>
            )}

            <div className="form-group">
              <label htmlFor="notes-textarea">메모 (선택사항)</label>
              <textarea
                id="notes-textarea"
                value={sessionData.notes}
                onChange={(e) => setSessionData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="무엇을 배웠나요? 어떤 어려움이 있었나요?"
                rows={3}
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => setIsLogging(false)}
                className="btn-secondary"
                aria-label="학습 기록 취소"
              >
                취소
              </button>
              <button
                type="submit"
                className="btn-primary"
                aria-label="학습 기록 저장"
              >
                저장하기
              </button>
            </div>
          </form>
        </section>
      )}

      {showReflectionPrompt && (
        <div
          className="reflection-prompt-overlay"
          role="dialog"
          aria-labelledby="reflection-prompt-title"
          aria-describedby="reflection-prompt-desc"
          aria-modal="true"
        >
          <div className="reflection-prompt">
            <div className="prompt-icon" aria-hidden="true">
              <Brain size={48} />
            </div>
            <h2 id="reflection-prompt-title">학습 완료!</h2>
            <p id="reflection-prompt-desc">방금 학습한 내용에 대해 성찰해보시겠어요?</p>
            <div className="session-summary">
              <strong>학습 주제:</strong> {lastSessionTopic}
            </div>
            <div className="prompt-actions">
              <button
                className="btn-secondary"
                onClick={handleSkipReflection}
                aria-label="성찰 나중에 하기"
              >
                나중에
              </button>
              <button
                className="btn-primary"
                onClick={handleStartReflection}
                aria-label="성찰 시작하기"
              >
                <Brain size={20} aria-hidden="true" />
                성찰 시작
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="recent-sessions" aria-labelledby="recent-sessions-title">
        <h2 id="recent-sessions-title">최근 학습 세션</h2>
        {subjectsList.length === 0 && (
          <div className="no-subjects-warning">
            <p>⚠️ 등록된 과목이 없습니다. <strong>설정</strong>에서 과목을 먼저 추가해주세요.</p>
          </div>
        )}
        {recentSessions.length === 0 ? (
          <div className="empty-state">
            <BookOpen size={48} aria-hidden="true" />
            <p>아직 학습 세션이 없습니다.</p>
            {subjectsList.length === 0 ? (
              <p>먼저 설정에서 과목을 추가해주세요!</p>
            ) : (
              <p>학습 기록을 시작해보세요!</p>
            )}
          </div>
        ) : (
          <ul className="sessions-list">
            {recentSessions.map(session => {
              const subject = subjects[session.subjectId]
              return (
                <li key={session.id} className="session-card">
                  <div className="session-header">
                    <div className="session-subject">
                      <span className="subject-name">{subject?.name || '알 수 없는 과목'}</span>
                      <span className="exam-type">{subject?.examType}</span>
                    </div>
                    <span className="session-duration">{session.duration}시간</span>
                  </div>
                  <div className="session-meta">
                    <div className="session-date">{session.date}</div>
                    {session.studyType && (
                      <span className="study-type-badge">
                        {studyTypes.find(t => t.id === session.studyType)?.name || session.studyType}
                      </span>
                    )}
                  </div>
                  {(session.concentration || session.understanding || session.fatigue) && (
                    <div className="session-ratings">
                      {session.concentration && <span className="rating">집중: {session.concentration}/5</span>}
                      {session.understanding && <span className="rating">이해: {session.understanding}/5</span>}
                      {session.fatigue && <span className="rating">피로: {session.fatigue}/5</span>}
                    </div>
                  )}
                  {session.notes && (
                    <div className="session-notes">{session.notes}</div>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </main>
  )
}

export default StudyLog
