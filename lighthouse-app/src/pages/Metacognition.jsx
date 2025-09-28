import { useState } from 'react'
import { Brain, CheckCircle, XCircle, HelpCircle } from 'lucide-react'

function Metacognition({ studyData, setStudyData }) {
  const [reflection, setReflection] = useState({
    whatLearned: '',
    howWellUnderstood: 3,
    struggledWith: '',
    needsMoreWork: '',
    nextSteps: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    const newReflection = {
      id: Date.now(),
      ...reflection,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString()
    }

    setStudyData(prev => ({
      ...prev,
      reflections: [...(prev.reflections || []), newReflection]
    }))

    setReflection({
      whatLearned: '',
      howWellUnderstood: 3,
      struggledWith: '',
      needsMoreWork: '',
      nextSteps: ''
    })
  }

  const recentReflections = (studyData.reflections || []).slice(0, 3)

  const understandingLevels = [
    { value: 1, label: '혼란스러움', icon: XCircle, color: '#ef4444' },
    { value: 2, label: '불분명함', icon: HelpCircle, color: '#f97316' },
    { value: 3, label: '어느 정도 이해', icon: HelpCircle, color: '#eab308' },
    { value: 4, label: '잘 이해', icon: CheckCircle, color: '#22c55e' },
    { value: 5, label: '매우 잘 이해', icon: CheckCircle, color: '#16a34a' }
  ]

  return (
    <div className="metacognition">
      <div className="page-header">
        <h1>
          <Brain size={24} />
          자기성찰
        </h1>
        <p>학습 과정에 대해 생각해보세요</p>
      </div>

      <form onSubmit={handleSubmit} className="reflection-form">
        <h3>오늘의 학습 성찰</h3>

        <div className="form-group">
          <label>오늘 무엇을 배웠나요?</label>
          <textarea
            value={reflection.whatLearned}
            onChange={(e) => setReflection(prev => ({ ...prev, whatLearned: e.target.value }))}
            placeholder="오늘 얻은 핵심 개념, 기술, 지식에 대해 설명해주세요..."
            rows="3"
            required
          />
        </div>

        <div className="form-group">
          <label>얼마나 잘 이해했나요?</label>
          <div className="understanding-scale">
            {understandingLevels.map(({ value, label, icon: Icon, color }) => (
              <button
                key={value}
                type="button"
                className={`understanding-option ${reflection.howWellUnderstood === value ? 'selected' : ''}`}
                onClick={() => setReflection(prev => ({ ...prev, howWellUnderstood: value }))}
                style={{ '--accent-color': color }}
              >
                <Icon size={20} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>무엇 때문에 어려움을 겪었나요?</label>
          <textarea
            value={reflection.struggledWith}
            onChange={(e) => setReflection(prev => ({ ...prev, struggledWith: e.target.value }))}
            placeholder="어려웠던 개념이나 문제는 무엇인가요?"
            rows="2"
          />
        </div>

        <div className="form-group">
          <label>무엇을 더 공부해야 하나요?</label>
          <textarea
            value={reflection.needsMoreWork}
            onChange={(e) => setReflection(prev => ({ ...prev, needsMoreWork: e.target.value }))}
            placeholder="더 복습하거나 연습해야 할 주제는 무엇인가요?"
            rows="2"
          />
        </div>

        <div className="form-group">
          <label>다음에 무엇을 할 계획인가요?</label>
          <textarea
            value={reflection.nextSteps}
            onChange={(e) => setReflection(prev => ({ ...prev, nextSteps: e.target.value }))}
            placeholder="오늘의 학습을 바탕으로 다음 학습 계획을 세워보세요..."
            rows="2"
          />
        </div>

        <button type="submit" className="btn-primary full-width">
          성찰 저장하기
        </button>
      </form>

      {recentReflections.length > 0 && (
        <div className="recent-reflections">
          <h3>최근 성찰</h3>
          <div className="reflections-list">
            {recentReflections.map(reflection => (
              <div key={reflection.id} className="reflection-card">
                <div className="reflection-header">
                  <span className="reflection-date">{reflection.date}</span>
                  <div className="understanding-badge">
                    {understandingLevels.find(l => l.value === reflection.howWellUnderstood)?.label}
                  </div>
                </div>
                <div className="reflection-content">
                  <p><strong>배운 것:</strong> {reflection.whatLearned}</p>
                  {reflection.struggledWith && (
                    <p><strong>어려웠던 것:</strong> {reflection.struggledWith}</p>
                  )}
                  {reflection.nextSteps && (
                    <p><strong>다음 단계:</strong> {reflection.nextSteps}</p>
                  )}
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