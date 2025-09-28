import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Brain, CheckCircle, ArrowRight, RotateCcw, FileText, Plus, X } from 'lucide-react'

function Metacognition({ studyData, setStudyData }) {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentStep, setCurrentStep] = useState('topics') // 'topics', 'selected', 'recall', 'verify', 'evaluate', 'plan'
  const [studyTopics, setStudyTopics] = useState(['']) // 여러 주제들
  const [selectedTopic, setSelectedTopic] = useState('')
  const [recallContent, setRecallContent] = useState('') // 학습 내용 회상
  const [verificationResult, setVerificationResult] = useState('') // 교재 확인 결과
  const [learningRating, setLearningRating] = useState(null) // 학습도 평가
  const [needsMoreStudy, setNeedsMoreStudy] = useState('') // 더 필요한 내용
  const [tomorrowPlan, setTomorrowPlan] = useState('') // 내일 할 일
  const [isAutoTriggered, setIsAutoTriggered] = useState(false)

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
  const removeTopic = (index) => {
    if (studyTopics.length > 1) {
      const newTopics = studyTopics.filter((_, i) => i !== index)
      setStudyTopics(newTopics)
    }
  }

  // 주제 수정 함수
  const updateTopic = (index, value) => {
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
    const newReflection = {
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
  const reflectionEnabled = studyData.globalSettings?.reflectionEnabled !== false

  if (!reflectionEnabled) {
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
    <div className="metacognition">
      <div className="page-header">
        <h1>
          <Brain size={24} />
          자기성찰
        </h1>
        <p>
          {isAutoTriggered ? '학습 완료! 성찰을 진행해보세요' : '자기주도 복습과 검증을 통한 성찰'}
        </p>
      </div>

      <div className="reflection-workflow">
        <div className="workflow-progress">
          <div className={`step ${currentStep === 'topics' ? 'active' : currentStep !== 'topics' ? 'completed' : ''}`}>1. 주제들</div>
          <div className={`step ${currentStep === 'selected' ? 'active' : ['recall', 'verify', 'evaluate', 'plan'].includes(currentStep) ? 'completed' : ''}`}>2. 선택</div>
          <div className={`step ${currentStep === 'recall' ? 'active' : ['verify', 'evaluate', 'plan'].includes(currentStep) ? 'completed' : ''}`}>3. 회상</div>
          <div className={`step ${currentStep === 'verify' ? 'active' : ['evaluate', 'plan'].includes(currentStep) ? 'completed' : ''}`}>4. 검증</div>
          <div className={`step ${currentStep === 'evaluate' ? 'active' : currentStep === 'plan' ? 'completed' : ''}`}>5. 평가</div>
          <div className={`step ${currentStep === 'plan' ? 'active' : ''}`}>6. 계획</div>
        </div>

        {currentStep === 'topics' && (
          <div className="reflection-step">
            <h3>📝 오늘 공부한 주제들 입력</h3>
            <p>오늘 학습한 모든 주제들을 입력해주세요 (예: 회계 대손상각비, 수익, 리스)</p>
            <div className="topics-list">
              {studyTopics.map((topic, index) => (
                <div key={index} className="topic-input-row">
                  <input
                    type="text"
                    value={topic}
                    onChange={(e) => updateTopic(index, e.target.value)}
                    placeholder={`주제 ${index + 1}`}
                    className="topic-input"
                  />
                  {studyTopics.length > 1 && (
                    <button
                      className="btn-remove"
                      onClick={() => removeTopic(index)}
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="topic-actions">
              <button className="btn-secondary" onClick={addTopic}>
                <Plus size={16} /> 주제 추가
              </button>
              <button
                className="btn-primary"
                onClick={handleTopicsNext}
                disabled={studyTopics.filter(t => t.trim()).length === 0}
              >
                다음 단계 <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'selected' && (
          <div className="reflection-step">
            <h3>🎯 선택된 주제</h3>
            <p>다음 주제에 대해 성찰해보겠습니다:</p>
            <div className="selected-topic">
              <div className="topic-display">{selectedTopic}</div>
              <button
                className="btn-secondary regenerate-btn"
                onClick={selectRandomTopic}
              >
                <RotateCcw size={16} /> 다른 주제 선택
              </button>
            </div>
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep('topics')}>이전</button>
              <button className="btn-primary" onClick={handleSelectedNext}>
                이 주제로 진행 <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'recall' && (
          <div className="reflection-step">
            <h3>🧠 학습 내용 회상</h3>
            <div className="current-topic">
              <strong>주제:</strong> {selectedTopic}
            </div>
            <p>이 주제에 대해 학습한 내용을 기억나는 대로 자세히 작성해보세요</p>
            <div className="form-group">
              <textarea
                value={recallContent}
                onChange={(e) => setRecallContent(e.target.value)}
                placeholder="이 주제에 대해 배운 내용, 개념, 공식, 예시 등을 최대한 자세히 적어보세요..."
                rows="8"
                className="reflection-textarea"
              />
            </div>
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep('selected')}>이전</button>
              <button
                className="btn-primary"
                onClick={handleRecallNext}
                disabled={!recallContent.trim()}
              >
                회상 완료 <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'verify' && (
          <div className="reflection-step">
            <h3>📚 교재로 검증하기</h3>
            <p>교재나 자료를 직접 확인하여 위에서 작성한 내용이 정확한지 검증해보세요</p>
            <div className="recall-review">
              <strong>작성한 내용:</strong>
              <div className="recall-content-preview">{recallContent}</div>
            </div>
            <div className="form-group">
              <label>교재 확인 결과</label>
              <textarea
                value={verificationResult}
                onChange={(e) => setVerificationResult(e.target.value)}
                placeholder="교재와 비교해서 틀린 부분, 빠진 부분, 추가로 알게 된 내용 등을 적어주세요..."
                rows="6"
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
                검증 완료 <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'evaluate' && (
          <div className="reflection-step">
            <h3>⭐ 학습도 자기 평가</h3>
            <p>이 주제에 대한 현재 나의 학습 정도를 평가해보세요</p>
            <div className="selfcheck-options">
              {learningRatingOptions.map(({ value, label, color }) => (
                <button
                  key={value}
                  className={`selfcheck-option ${learningRating === value ? 'selected' : ''}`}
                  onClick={() => setLearningRating(value)}
                  style={{ '--accent-color': color }}
                >
                  <span className="rating-number">{value}</span>
                  <span className="rating-label">{label}</span>
                </button>
              ))}
            </div>
            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep('verify')}>이전</button>
              <button
                className="btn-primary"
                onClick={handleEvaluateNext}
                disabled={learningRating === null}
              >
                평가 완료 <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'plan' && (
          <div className="reflection-step">
            <h3>📋 학습 계획 수립</h3>
            <p>앞으로의 학습 계획을 세워보세요</p>

            <div className="form-group">
              <label>공부가 더 필요한 내용</label>
              <textarea
                value={needsMoreStudy}
                onChange={(e) => setNeedsMoreStudy(e.target.value)}
                placeholder="이 주제에서 더 깊이 공부해야 할 부분을 적어보세요..."
                rows="3"
                className="reflection-textarea"
              />
            </div>

            <div className="form-group">
              <label>내일 공부할 내용</label>
              <textarea
                value={tomorrowPlan}
                onChange={(e) => setTomorrowPlan(e.target.value)}
                placeholder="내일 공부할 구체적인 계획을 적어보세요..."
                rows="3"
                className="reflection-textarea"
              />
            </div>

            <div className="step-actions">
              <button className="btn-secondary" onClick={() => setCurrentStep('evaluate')}>이전</button>
              <button className="btn-primary" onClick={handleFinalSubmit}>
                성찰 완료 <CheckCircle size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {recentReflections.length > 0 && currentStep === 'topics' && (
        <div className="recent-reflections">
          <div className="section-header">
            <h3>최근 성찰</h3>
            <button className="btn-secondary" onClick={() => navigate('/metacognition/history')}>
              <FileText size={16} /> 전체 보기
            </button>
          </div>
          <div className="reflections-preview">
            {recentReflections.slice(0, 3).map(reflection => (
              <div key={reflection.id} className="reflection-preview-card">
                <div className="preview-header">
                  <span className="preview-topic">{reflection.selectedTopic || reflection.topic}</span>
                  <span className="preview-date">{reflection.date}</span>
                </div>
                <div className="preview-reflection">
                  {reflection.recallContent?.substring(0, 100) || reflection.reflection?.substring(0, 100)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Metacognition