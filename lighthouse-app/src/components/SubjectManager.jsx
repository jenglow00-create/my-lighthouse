import { useState } from 'react'
import { Plus, Target, Calendar, Clock, X, Edit3, TrendingUp, Award } from 'lucide-react'
import { EXAM_CATEGORIES, getExamTypeById, migrateLegacyExamType } from '../constants/examTypes'

function SubjectManager({ studyData, setStudyData }) {
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [showScoreForm, setShowScoreForm] = useState(null) // subjectId
  const [selectedCategory, setSelectedCategory] = useState('language') // 선택된 대주제
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    examType: 'TOEIC',
    examCategory: 'language',
    targetHours: 100,
    examDate: '',
    targetScore: 800,
    description: ''
  })
  const [scoreForm, setScoreForm] = useState({
    expectedScore: '',
    actualScore: '',
    testDate: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    const subjectId = editingSubject || `subject_${Date.now()}`
    const newSubject = {
      ...subjectForm,
      id: subjectId,
      createdAt: editingSubject ? studyData.subjects[editingSubject]?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalHours: editingSubject ? studyData.subjects[editingSubject]?.totalHours || 0 : 0,
      // 선택된 시험 유형의 기본값 적용
      targetScore: subjectForm.targetScore || getExamTypeById(subjectForm.examType)?.defaultTarget || 100
    }

    setStudyData(prev => ({
      ...prev,
      subjects: {
        ...prev.subjects,
        [subjectId]: newSubject
      }
    }))

    resetForm()
  }

  const handleScoreSubmit = (e) => {
    e.preventDefault()
    if (!showScoreForm) return

    const newScore = {
      id: Date.now(),
      expectedScore: parseInt(scoreForm.expectedScore) || null,
      actualScore: parseInt(scoreForm.actualScore) || null,
      testDate: scoreForm.testDate,
      createdAt: new Date().toISOString()
    }

    setStudyData(prev => ({
      ...prev,
      subjects: {
        ...prev.subjects,
        [showScoreForm]: {
          ...prev.subjects[showScoreForm],
          scores: [...(prev.subjects[showScoreForm]?.scores || []), newScore]
        }
      }
    }))

    resetScoreForm()
  }

  const resetScoreForm = () => {
    setScoreForm({
      expectedScore: '',
      actualScore: '',
      testDate: new Date().toISOString().split('T')[0]
    })
    setShowScoreForm(null)
  }

  const resetForm = () => {
    setSubjectForm({
      name: '',
      examType: 'TOEIC',
      examCategory: 'language',
      targetHours: 100,
      examDate: '',
      targetScore: 800,
      description: ''
    })
    setSelectedCategory('language')
    setIsAddingSubject(false)
    setEditingSubject(null)
  }

  const handleEdit = (subjectId) => {
    const subject = studyData.subjects[subjectId]
    // 구버전 시험 유형 마이그레이션
    const migratedExamType = migrateLegacyExamType(subject.examType)
    const examTypeInfo = getExamTypeById(migratedExamType)

    setSubjectForm({
      name: subject.name,
      examType: migratedExamType,
      examCategory: examTypeInfo?.categoryId || subject.examCategory || 'other',
      targetHours: subject.targetHours,
      examDate: subject.examDate,
      targetScore: subject.targetScore,
      description: subject.description || ''
    })
    setSelectedCategory(examTypeInfo?.categoryId || subject.examCategory || 'other')
    setEditingSubject(subjectId)
    setIsAddingSubject(true)
  }

  // 카테고리 변경시 해당 카테고리의 첫 번째 시험 유형으로 자동 선택
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    const category = EXAM_CATEGORIES.find(cat => cat.id === categoryId)
    if (category && category.subcategories.length > 0) {
      const firstExamType = category.subcategories[0]
      setSubjectForm(prev => ({
        ...prev,
        examCategory: categoryId,
        examType: firstExamType.id,
        targetScore: firstExamType.defaultTarget
      }))
    }
  }

  // 시험 유형 변경시 기본 점수 자동 설정
  const handleExamTypeChange = (examTypeId) => {
    const examType = getExamTypeById(examTypeId)
    setSubjectForm(prev => ({
      ...prev,
      examType: examTypeId,
      targetScore: examType?.defaultTarget || prev.targetScore
    }))
  }

  const handleDelete = (subjectId) => {
    if (window.confirm('정말로 이 과목을 삭제하시겠습니까? 관련된 모든 학습 기록도 함께 삭제됩니다.')) {
      setStudyData(prev => {
        const newSubjects = { ...prev.subjects }
        delete newSubjects[subjectId]

        return {
          ...prev,
          subjects: newSubjects,
          sessions: prev.sessions.filter(session => session.subjectId !== subjectId)
        }
      })
    }
  }

  const calculateProgress = (subject) => {
    const progress = (subject.totalHours / subject.targetHours) * 100
    return Math.min(progress, 100)
  }

  const calculateDaysUntilExam = (examDate) => {
    if (!examDate) return null
    const today = new Date()
    const exam = new Date(examDate)
    const diffTime = exam - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const calculateDailyTarget = (subject) => {
    const daysLeft = calculateDaysUntilExam(subject.examDate)
    if (!daysLeft || daysLeft <= 0) return 0

    const hoursLeft = subject.targetHours - subject.totalHours
    return Math.max(hoursLeft / daysLeft, 0)
  }

  const calculateWeeklyTarget = (subject) => {
    return calculateDailyTarget(subject) * 7
  }

  const getLatestScore = (subject) => {
    const scores = subject.scores || []
    if (scores.length === 0) return null
    return scores.sort((a, b) => new Date(b.testDate) - new Date(a.testDate))[0]
  }

  const calculateScoreTrend = (subject) => {
    const scores = (subject.scores || []).filter(s => s.actualScore).sort((a, b) => new Date(a.testDate) - new Date(b.testDate))
    if (scores.length < 2) return 0

    const latest = scores[scores.length - 1].actualScore
    const previous = scores[scores.length - 2].actualScore
    return latest - previous
  }

  const subjects = Object.entries(studyData.subjects || {})

  return (
    <div className="subject-manager">
      <div className="subjects-header">
        <h2>학습 과목 관리</h2>
        <button
          onClick={() => setIsAddingSubject(true)}
          className="btn-primary"
        >
          <Plus size={20} />
          과목 추가
        </button>
      </div>

      {isAddingSubject && (
        <div className="subject-form-modal">
          <div className="subject-form-container">
            <form onSubmit={handleSubmit} className="subject-form">
              <div className="form-header">
                <h3>{editingSubject ? '과목 수정' : '새 과목 추가'}</h3>
                <button type="button" onClick={resetForm} className="close-btn">
                  <X size={20} />
                </button>
              </div>

              <div className="form-group">
                <label>과목명</label>
                <input
                  type="text"
                  value={subjectForm.name}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="예: TOEIC 900점 달성"
                  required
                />
              </div>

              <div className="form-group">
                <label>시험 분류 (대주제)</label>
                <div className="category-selector">
                  {EXAM_CATEGORIES.map(category => (
                    <button
                      key={category.id}
                      type="button"
                      className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
                      onClick={() => handleCategoryChange(category.id)}
                    >
                      <span className="category-icon">{category.icon}</span>
                      <span className="category-name">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>시험 유형 (소주제)</label>
                <select
                  value={subjectForm.examType}
                  onChange={(e) => handleExamTypeChange(e.target.value)}
                >
                  {EXAM_CATEGORIES.find(cat => cat.id === selectedCategory)?.subcategories.map(exam => (
                    <option key={exam.id} value={exam.id}>
                      {exam.name} {exam.description && `- ${exam.description}`}
                    </option>
                  ))}
                </select>
                <small className="form-hint">
                  선택한 시험: {getExamTypeById(subjectForm.examType)?.name || '없음'}
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Target size={16} />
                    목표 학습시간 (시간)
                  </label>
                  <input
                    type="number"
                    value={subjectForm.targetHours}
                    onChange={(e) => setSubjectForm(prev => ({ ...prev, targetHours: parseInt(e.target.value) || 0 }))}
                    min="1"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Calendar size={16} />
                    시험일
                  </label>
                  <input
                    type="date"
                    value={subjectForm.examDate}
                    onChange={(e) => setSubjectForm(prev => ({ ...prev, examDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>목표 점수</label>
                <input
                  type="number"
                  value={subjectForm.targetScore}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, targetScore: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div className="form-group">
                <label>설명 (선택사항)</label>
                <textarea
                  value={subjectForm.description}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="이 과목에 대한 추가 설명을 입력하세요"
                  rows="2"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="btn-secondary">
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  {editingSubject ? '수정' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScoreForm && (
        <div className="subject-form-modal">
          <div className="subject-form-container">
            <form onSubmit={handleScoreSubmit} className="subject-form">
              <div className="form-header">
                <h3>점수 기록 추가</h3>
                <button type="button" onClick={resetScoreForm} className="close-btn">
                  <X size={20} />
                </button>
              </div>

              <div className="form-group">
                <label>
                  <Calendar size={16} />
                  시험/모의고사 날짜
                </label>
                <input
                  type="date"
                  value={scoreForm.testDate}
                  onChange={(e) => setScoreForm(prev => ({ ...prev, testDate: e.target.value }))}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>
                    <Target size={16} />
                    예상 점수
                  </label>
                  <input
                    type="number"
                    value={scoreForm.expectedScore}
                    onChange={(e) => setScoreForm(prev => ({ ...prev, expectedScore: e.target.value }))}
                    placeholder="예상 점수"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>
                    <Award size={16} />
                    실제 점수
                  </label>
                  <input
                    type="number"
                    value={scoreForm.actualScore}
                    onChange={(e) => setScoreForm(prev => ({ ...prev, actualScore: e.target.value }))}
                    placeholder="실제 점수"
                    min="0"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetScoreForm} className="btn-secondary">
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  점수 추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="subjects-grid">
        {subjects.length === 0 ? (
          <div className="empty-state">
            <Target size={48} />
            <p>아직 등록된 과목이 없습니다.</p>
            <p>첫 번째 과목을 추가해보세요!</p>
          </div>
        ) : (
          subjects.map(([subjectId, subject]) => {
            const progress = calculateProgress(subject)
            const daysLeft = calculateDaysUntilExam(subject.examDate)
            const dailyTarget = calculateDailyTarget(subject)
            const weeklyTarget = calculateWeeklyTarget(subject)
            const latestScore = getLatestScore(subject)
            const scoreTrend = calculateScoreTrend(subject)

            // 시험 유형 정보 가져오기
            const migratedExamType = migrateLegacyExamType(subject.examType)
            const examTypeInfo = getExamTypeById(migratedExamType)

            return (
              <div key={subjectId} className="subject-card">
                <div className="subject-header">
                  <div className="subject-info">
                    <h3>{subject.name}</h3>
                    <span className="exam-type">
                      {examTypeInfo ? `${examTypeInfo.categoryIcon} ${examTypeInfo.name}` : subject.examType}
                    </span>
                  </div>
                  <div className="subject-actions">
                    <button onClick={() => handleEdit(subjectId)} className="edit-btn">
                      <Edit3 size={16} />
                    </button>
                    <button onClick={() => handleDelete(subjectId)} className="delete-btn">
                      <X size={16} />
                    </button>
                  </div>
                </div>

                <div className="subject-progress">
                  <div className="progress-info">
                    <span>{subject.totalHours} / {subject.targetHours}시간</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                {subject.examDate && (
                  <div className="exam-info">
                    <div className="exam-date">
                      <Calendar size={16} />
                      <span>시험일: {subject.examDate}</span>
                    </div>
                    {daysLeft !== null && (
                      <div className="days-left">
                        <Clock size={16} />
                        <span>
                          {daysLeft > 0 ? `D-${daysLeft}` : daysLeft === 0 ? 'D-Day!' : '시험 종료'}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {daysLeft > 0 && (
                  <div className="target-breakdown">
                    <div className="target-item">
                      <span className="target-label">일일 목표:</span>
                      <span className="target-value">{dailyTarget.toFixed(1)}시간</span>
                    </div>
                    <div className="target-item">
                      <span className="target-label">주간 목표:</span>
                      <span className="target-value">{weeklyTarget.toFixed(1)}시간</span>
                    </div>
                  </div>
                )}

                {subject.description && (
                  <div className="subject-description">
                    {subject.description}
                  </div>
                )}

                <div className="score-tracking-section">
                  <div className="score-header">
                    <h4>
                      <TrendingUp size={16} />
                      점수 기록
                    </h4>
                    <button
                      onClick={() => setShowScoreForm(subjectId)}
                      className="btn-small"
                    >
                      <Plus size={14} />
                      점수 추가
                    </button>
                  </div>

                  {latestScore ? (
                    <div className="latest-score">
                      <div className="score-info">
                        {latestScore.actualScore && (
                          <div className="score-item actual">
                            <Award size={14} />
                            <span>최근: {latestScore.actualScore}점</span>
                            {scoreTrend !== 0 && (
                              <span className={`trend ${scoreTrend > 0 ? 'positive' : 'negative'}`}>
                                {scoreTrend > 0 ? '+' : ''}{scoreTrend}
                              </span>
                            )}
                          </div>
                        )}
                        {latestScore.expectedScore && (
                          <div className="score-item expected">
                            <Target size={14} />
                            <span>예상: {latestScore.expectedScore}점</span>
                          </div>
                        )}
                      </div>
                      <div className="score-date">{latestScore.testDate}</div>
                    </div>
                  ) : (
                    <div className="no-scores">
                      <p>아직 점수 기록이 없습니다.</p>
                    </div>
                  )}

                  {(subject.scores || []).length > 1 && (
                    <div className="score-summary">
                      <span>총 {(subject.scores || []).length}회 기록</span>
                      <span>목표: {subject.targetScore}점</span>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default SubjectManager