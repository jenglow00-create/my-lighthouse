import { useState } from 'react'
import { Plus, Target, Calendar, Clock, X, Edit3 } from 'lucide-react'

function SubjectManager({ studyData, setStudyData }) {
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [editingSubject, setEditingSubject] = useState(null)
  const [subjectForm, setSubjectForm] = useState({
    name: '',
    examType: 'TOEIC',
    targetHours: 100,
    examDate: '',
    targetScore: 800,
    description: ''
  })

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

  const handleSubmit = (e) => {
    e.preventDefault()

    const subjectId = editingSubject || `subject_${Date.now()}`
    const newSubject = {
      ...subjectForm,
      id: subjectId,
      createdAt: editingSubject ? studyData.subjects[editingSubject]?.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalHours: editingSubject ? studyData.subjects[editingSubject]?.totalHours || 0 : 0
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

  const resetForm = () => {
    setSubjectForm({
      name: '',
      examType: 'TOEIC',
      targetHours: 100,
      examDate: '',
      targetScore: 800,
      description: ''
    })
    setIsAddingSubject(false)
    setEditingSubject(null)
  }

  const handleEdit = (subjectId) => {
    const subject = studyData.subjects[subjectId]
    setSubjectForm({
      name: subject.name,
      examType: subject.examType,
      targetHours: subject.targetHours,
      examDate: subject.examDate,
      targetScore: subject.targetScore,
      description: subject.description || ''
    })
    setEditingSubject(subjectId)
    setIsAddingSubject(true)
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
                <label>시험 유형</label>
                <select
                  value={subjectForm.examType}
                  onChange={(e) => setSubjectForm(prev => ({ ...prev, examType: e.target.value }))}
                >
                  {examTypes.map(exam => (
                    <option key={exam.id} value={exam.id}>{exam.name}</option>
                  ))}
                </select>
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

            return (
              <div key={subjectId} className="subject-card">
                <div className="subject-header">
                  <div className="subject-info">
                    <h3>{subject.name}</h3>
                    <span className="exam-type">{subject.examType}</span>
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
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default SubjectManager