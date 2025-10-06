import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, CheckCircle, ArrowRight, RotateCcw, FileText, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import { analyzeReflection } from '@/utils/aiAnalysis'
import type { UserData } from '@/types'
import type { Reflection, LearningRating } from '@/types/reflection'

interface MetacognitionProps {
  studyData: UserData
  setStudyData: React.Dispatch<React.SetStateAction<UserData>>
}

function Metacognition({ studyData, setStudyData }: MetacognitionProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState<string>('topics')
  const [studyTopics, setStudyTopics] = useState<string[]>([''])
  const [selectedTopic, setSelectedTopic] = useState<string>('')
  const [recallContent, setRecallContent] = useState<string>('')
  const [verificationResult, setVerificationResult] = useState<string>('')
  const [learningRating, setLearningRating] = useState<LearningRating | null>(null)
  const [needsMoreStudy, setNeedsMoreStudy] = useState<string>('')
  const [tomorrowPlan, setTomorrowPlan] = useState<string>('')
  const [isAutoTriggered, setIsAutoTriggered] = useState<boolean>(false)
  const [showEvidence, setShowEvidence] = useState<boolean>(false)

  // 사용자가 설정에서 온 경우 감지
  useEffect(() => {
    if (location.state?.autoTrigger) {
      setIsAutoTriggered(true)
      // 자동 트리거 시에도 topics 단계부터 시작
    }
  }, [location.state])

  // 주제 추가 함수
  const addTopic = () => {
    setStudyTopics([...studyTopics, ''])
  }

  // 주제 삭제 함수
  const removeTopic = (index: number) => {
    if (studyTopics.length > 1) {
      const newTopics = studyTopics.filter((_, i) => i !== index)
      setStudyTopics(newTopics)
    }
  }

  // 주제 수정 함수
  const updateTopic = (index: number, value: string) => {
    const newTopics = [...studyTopics]
    newTopics[index] = value
    setStudyTopics(newTopics)
  }

  // 랜덤 주제 선택
  const selectRandomTopic = () => {
    const validTopics = studyTopics.filter(topic => topic.trim() !== '')
    if (validTopics.length > 0) {
      const randomIndex = Math.floor(Math.random() * validTopics.length)
      setSelectedTopic(validTopics[randomIndex])
      setCurrentStep('selected')
    }
  }

  // 단계별 진행 함수들
  const handleTopicsNext = () => {
    const validTopics = studyTopics.filter(topic => topic.trim() !== '')
    if (validTopics.length === 0) return
    selectRandomTopic()
  }

  const handleSelectedNext = () => {
    setCurrentStep('recall')
  }

  const handleRecallNext = () => {
    if (!recallContent.trim()) return
    setCurrentStep('verify')
  }

  const handleVerifyNext = () => {
    if (!verificationResult.trim()) return
    setCurrentStep('evaluate')
  }

  const handleEvaluateNext = () => {
    if (learningRating === null) return
    setCurrentStep('plan')
  }

  const handleFinalSubmit = () => {
    if (learningRating === null) return // Guard against null

    const newReflection: Reflection = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      allTopics: studyTopics.filter(topic => topic.trim() !== ''),
      selectedTopic: selectedTopic,
      recallContent: recallContent,
      verificationResult: verificationResult,
      learningRating: learningRating,
      needsMoreStudy: needsMoreStudy,
      tomorrowPlan: tomorrowPlan,
      isAutoTriggered
    }

    setStudyData(prev => ({
      ...prev,
      reflections: [...(prev.reflections || []), newReflection]
    }))

    // 초기화
    resetReflection()

    if (isAutoTriggered) {
      navigate('/study')
    }
  }

  const resetReflection = () => {
    setCurrentStep('topics')
    setStudyTopics([''])
    setSelectedTopic('')
    setRecallContent('')
    setVerificationResult('')
    setLearningRating(null)
    setNeedsMoreStudy('')
    setTomorrowPlan('')
    setIsAutoTriggered(false)
  }

  const recentReflections = (studyData.reflections || []).slice(0, 5)

  const learningRatingOptions = [
    { value: 1, label: '전혀 모르겠음', color: '#ef4444' },
    { value: 2, label: '조금 알 것 같음', color: '#f97316' },
    { value: 3, label: '어느 정도 알겠음', color: '#eab308' },
    { value: 4, label: '잘 알겠음', color: '#22c55e' },
    { value: 5, label: '완전히 이해함', color: '#16a34a' }
  ]

  // 성찰 설정 확인
  // const reflectionEnabled = studyData.settings?.autoReflection?.enabled !== false

  if (false) { // Always show reflection for now
    return (
      <div className="metacognition">
        <div className="page-header">
          <h1>
            <Brain size={24} />
            자기성찰
          </h1>
          <p>성찰 기능이 비활성화되어 있습니다</p>
        </div>
        <div className="reflection-disabled">
          <Brain size={64} />
          <h3>성찰 기능이 비활성화됨</h3>
          <p>설정에서 성찰 기능을 활성화할 수 있습니다.</p>
          <button className="btn-primary" onClick={() => navigate('/settings')}>
            설정으로 이동
          </button>
        </div>

        {recentReflections.length > 0 && (
          <div className="reflection-history">
            <h3>과거 성찰 기록</h3>
            <button className="btn-secondary" onClick={() => navigate('/metacognition/history')}>
              <FileText size={20} />
              전체 히스토리 보기
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <main className="metacognition" aria-labelledby="metacognition-title">
      <header className="page-header">
        <h1 id="metacognition-title">
          <Brain size={24} aria-hidden="true" />
          자기성찰
        </h1>
        <p>
          {isAutoTriggered ? '학습 완료! 성찰을 진행해보세요' : '자기주도 복습과 검증을 통한 성찰'}
        </p>
      </header>

      <section className="reflection-workflow">
        <nav className="workflow-progress" aria-label="성찰 진행 단계">
          <div className={`step ${currentStep === 'topics' ? 'active' : currentStep !== 'topics' ? 'completed' : ''}`} aria-current={currentStep === 'topics' ? 'step' : undefined}>1. 주제들</div>
          <div className={`step ${currentStep === 'selected' ? 'active' : ['recall', 'verify', 'evaluate', 'plan'].includes(currentStep) ? 'completed' : ''}`} aria-current={currentStep === 'selected' ? 'step' : undefined}>2. 선택</div>
          <div className={`step ${currentStep === 'recall' ? 'active' : ['verify', 'evaluate', 'plan'].includes(currentStep) ? 'completed' : ''}`} aria-current={currentStep === 'recall' ? 'step' : undefined}>3. 회상</div>
          <div className={`step ${currentStep === 'verify' ? 'active' : ['evaluate', 'plan'].includes(currentStep) ? 'completed' : ''}`} aria-current={currentStep === 'verify' ? 'step' : undefined}>4. 검증</div>
          <div className={`step ${currentStep === 'evaluate' ? 'active' : currentStep === 'plan' ? 'completed' : ''}`} aria-current={currentStep === 'evaluate' ? 'step' : undefined}>5. 평가</div>
          <div className={`step ${currentStep === 'plan' ? 'active' : ''}`} aria-current={currentStep === 'plan' ? 'step' : undefined}>6. 계획</div>
        </nav>

        {currentStep === 'topics' && (
          <section className="reflection-step" aria-labelledby="topics-step-title">
            <h3 id="topics-step-title">📝 오늘 공부한 주제들 입력</h3>
            <p>오늘 학습한 모든 주제들을 입력해주세요 (예: 회계 대손상각비, 수익, 리스)</p>
            <div className="topics-list">
              {studyTopics.map((topic, index) => (
                <div key={index} className="topic-input-row">
                  <label htmlFor={`topic-${index}`} className="sr-only">주제 {index + 1}</label>
                  <input
                    id={`topic-${index}`}
                    type="text"
                    value={topic}
                    onChange={(e) => updateTopic(index, e.target.value)}
                    placeholder={`주제 ${index + 1}`}
                    className="topic-input"
                    aria-label={`주제 ${index + 1}`}
                  />
                  {studyTopics.length > 1 && (
                    <button
                      className="btn-remove"
                      onClick={() => removeTopic(index)}
                      aria-label={`주제 ${index + 1} 삭제`}
                    >
                      <X size={16} aria-hidden="true" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="topic-actions">
              <button className="btn-secondary" onClick={addTopic}>
                <Plus size={16} aria-hidden="true" /> 주제 추가
              </button>
              <button
                className="btn-primary"
                onClick={handleTopicsNext}
                disabled={studyTopics.filter(t => t.trim()).length === 0}
              >
                다음 단계 <ArrowRight size={20} aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {currentStep === 'selected' && (
          <section className="reflection-step" aria-labelledby="selected-step-title">
            <h3 id="selected-step-title">🎯 선택된 주제</h3>
            <p>다음 주제에 대해 성찰해보겠습니다:</p>
            <div className="selected-topic">
              <div className="topic-display" aria-label={`선택된 주제: ${selectedTopic}`}>{selectedTopic}</div>
              <button
                className="btn-secondary regenerate-btn"
                onClick={selectRandomTopic}
                aria-label="다른 주제 무작위로 선택하기"
              >
                <RotateCcw size={16} aria-hidden="true" /> 다른 주제 선택
              </button>
            </div>
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep('topics')}>이전</button>
              <button className="btn-primary" onClick={handleSelectedNext}>
                이 주제로 진행 <ArrowRight size={20} aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {currentStep === 'recall' && (
          <section className="reflection-step" aria-labelledby="recall-step-title">
            <h3 id="recall-step-title">🧠 학습 내용 회상</h3>
            <div className="current-topic">
              <strong>주제:</strong> {selectedTopic}
            </div>
            <p>이 주제에 대해 학습한 내용을 기억나는 대로 자세히 작성해보세요</p>
            <div className="form-group">
              <label htmlFor="recall-content" className="sr-only">학습 내용 회상</label>
              <textarea
                id="recall-content"
                value={recallContent}
                onChange={(e) => setRecallContent(e.target.value)}
                placeholder="이 주제에 대해 배운 내용, 개념, 공식, 예시 등을 최대한 자세히 적어보세요..."
                rows={8}
                className="reflection-textarea"
                aria-label="학습 내용 회상하여 작성"
              />
            </div>
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep('selected')}>이전</button>
              <button
                className="btn-primary"
                onClick={handleRecallNext}
                disabled={!recallContent.trim()}
              >
                회상 완료 <ArrowRight size={20} aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {currentStep === 'verify' && (
          <section className="reflection-step" aria-labelledby="verify-step-title">
            <h3 id="verify-step-title">📚 교재로 검증하기</h3>
            <p>교재나 자료를 직접 확인하여 위에서 작성한 내용이 정확한지 검증해보세요</p>
            <div className="recall-review">
              <strong>작성한 내용:</strong>
              <div className="recall-content-preview">{recallContent}</div>
            </div>
            <div className="form-group">
              <label htmlFor="verification-result">교재 확인 결과</label>
              <textarea
                id="verification-result"
                value={verificationResult}
                onChange={(e) => setVerificationResult(e.target.value)}
                placeholder="교재와 비교해서 틀린 부분, 빠진 부분, 추가로 알게 된 내용 등을 적어주세요..."
                rows={6}
                className="reflection-textarea"
              />
            </div>
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep('recall')}>이전</button>
              <button
                className="btn-primary"
                onClick={handleVerifyNext}
                disabled={!verificationResult.trim()}
              >
                검증 완료 <ArrowRight size={20} aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {currentStep === 'evaluate' && (
          <section className="reflection-step" aria-labelledby="evaluate-step-title">
            <h3 id="evaluate-step-title">⭐ 학습도 자기 평가</h3>
            <p>이 주제에 대한 현재 나의 학습 정도를 평가해보세요</p>
            <div className="selfcheck-options" role="group" aria-label="학습도 평가 선택">
              {learningRatingOptions.map(({ value, label, color }) => (
                <button
                  key={value}
                  className={`selfcheck-option ${learningRating === value ? 'selected' : ''}`}
                  onClick={() => setLearningRating(value as LearningRating)}
                  style={{ '--accent-color': color } as React.CSSProperties}
                  aria-pressed={learningRating === value}
                  aria-label={`${value}점: ${label}`}
                >
                  <span className="rating-number" aria-hidden="true">{value}</span>
                  <span className="rating-label" aria-hidden="true">{label}</span>
                </button>
              ))}
            </div>

            {learningRating !== null && studyData.reflections && studyData.reflections.length > 0 && (
              <div className="evidence-section">
                <button
                  className="evidence-toggle"
                  onClick={() => setShowEvidence(!showEvidence)}
                  aria-expanded={showEvidence}
                  aria-controls="evidence-box"
                >
                  📊 근거 보기
                  {showEvidence ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
                </button>

                {showEvidence && (() => {
                  const analysis = analyzeReflection(
                    {
                      id: Date.now(),
                      date: new Date().toISOString().split('T')[0],
                      timestamp: new Date().toISOString(),
                      allTopics: studyTopics.filter(t => t.trim() !== ''),
                      selectedTopic,
                      recallContent,
                      verificationResult,
                      learningRating: learningRating!,
                      needsMoreStudy,
                      tomorrowPlan,
                      isAutoTriggered
                    },
                    studyData.reflections || []
                  )

                  return (
                    <div id="evidence-box" className="evidence-box" role="region" aria-label="평가 근거 상세 정보">
                      <div className="evidence-item">
                        <strong>📊 측정값:</strong> {learningRating}점 ({analysis.ranking})
                      </div>
                      <div className="evidence-item">
                        <strong>📊 비교 기준:</strong> {analysis.comparison}
                      </div>
                      <div className="evidence-item">
                        <strong>📚 방법론:</strong> 전체 성찰 데이터 ({studyData.reflections.length}개) 기준 백분위 분석
                      </div>
                      <div className="evidence-item">
                        <strong>📚 출처:</strong> 학습자 자가평가 분석 시스템 (2024)
                      </div>
                      {analysis.advice && (
                        <div className="evidence-item recommendation">
                          <strong>💡 권장사항:</strong> {analysis.advice}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep('verify')}>이전</button>
              <button
                className="btn-primary"
                onClick={handleEvaluateNext}
                disabled={learningRating === null}
              >
                평가 완료 <ArrowRight size={20} aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {currentStep === 'plan' && (
          <section className="reflection-step" aria-labelledby="plan-step-title">
            <h3 id="plan-step-title">📋 학습 계획 수립</h3>
            <p>앞으로의 학습 계획을 세워보세요</p>

            <div className="form-group">
              <label htmlFor="needs-more-study">공부가 더 필요한 내용</label>
              <textarea
                id="needs-more-study"
                value={needsMoreStudy}
                onChange={(e) => setNeedsMoreStudy(e.target.value)}
                placeholder="이 주제에서 더 깊이 공부해야 할 부분을 적어보세요..."
                rows={3}
                className="reflection-textarea"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tomorrow-plan">내일 공부할 내용</label>
              <textarea
                id="tomorrow-plan"
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder="내일 공부할 구체적인 계획을 적어보세요..."
                rows={3}
                className="reflection-textarea"
              />
            </div>

            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep('evaluate')}>이전</button>
              <button className="btn-primary" onClick={handleFinalSubmit}>
                성찰 완료 <CheckCircle size={20} aria-hidden="true" />
              </button>
            </div>
          </section>
        )}
      </section>

      {recentReflections.length > 0 && currentStep === 'topics' && (
        <section className="recent-reflections" aria-labelledby="recent-reflections-title">
          <div className="section-header">
            <h3 id="recent-reflections-title">최근 성찰</h3>
            <button className="btn-secondary" onClick={() => navigate('/metacognition/history')}>
              <FileText size={16} aria-hidden="true" /> 전체 보기
            </button>
          </div>
          <div className="reflections-preview">
            {recentReflections.slice(0, 3).map(reflection => {
              const ratingOption = learningRatingOptions.find(opt => opt.value === reflection.learningRating)
              return (
                <div key={reflection.id} className="reflection-preview-card">
                  <div className="preview-header">
                    <span className="preview-topic">{reflection.selectedTopic}</span>
                    <span className="preview-date">{reflection.date}</span>
                  </div>

                  <div className="preview-details">
                    <div className="preview-row">
                      <span className="preview-label">📚 공부한 주제:</span>
                      <span className="preview-value">{reflection.allTopics?.join(', ') || reflection.selectedTopic}</span>
                    </div>

                    <div className="preview-row">
                      <span className="preview-label">⭐ 학습도:</span>
                      <span
                        className="preview-value preview-rating"
                        style={{ color: ratingOption?.color || '#666' }}
                      >
                        {reflection.learningRating ? `${reflection.learningRating}/5 - ${ratingOption?.label}` : '평가 없음'}
                      </span>
                    </div>

                    {reflection.tomorrowPlan && (
                      <div className="preview-row">
                        <span className="preview-label">📅 내일 계획:</span>
                        <span className="preview-value preview-truncate">
                          {reflection.tomorrowPlan.length > 50
                            ? reflection.tomorrowPlan.substring(0, 50) + '...'
                            : reflection.tomorrowPlan
                          }
                        </span>
                      </div>
                    )}

                    {reflection.needsMoreStudy && (
                      <div className="preview-row">
                        <span className="preview-label">🔍 더 공부할 것:</span>
                        <span className="preview-value preview-truncate">
                          {reflection.needsMoreStudy.length > 50
                            ? reflection.needsMoreStudy.substring(0, 50) + '...'
                            : reflection.needsMoreStudy
                          }
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </main>
  )
}

export default Metacognition