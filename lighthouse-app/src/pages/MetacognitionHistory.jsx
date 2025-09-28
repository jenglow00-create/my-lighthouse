import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, ArrowLeft, Calendar, Star, Filter, Search } from 'lucide-react'

function MetacognitionHistory({ studyData }) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRating, setFilterRating] = useState('all')
  const [sortBy, setSortBy] = useState('newest')

  const reflections = useMemo(() => studyData.reflections || [], [studyData.reflections])

  const filteredAndSortedReflections = useMemo(() => {
    let filtered = reflections

    // 검색 필터
    if (searchTerm) {
      filtered = filtered.filter(reflection =>
        reflection.topic?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reflection.reflection?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reflection.struggled?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reflection.nextPlan?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 평점 필터
    if (filterRating !== 'all') {
      const rating = parseInt(filterRating)
      filtered = filtered.filter(reflection => reflection.selfRating === rating)
    }

    // 정렬
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)
        case 'oldest':
          return new Date(a.timestamp || a.date) - new Date(b.timestamp || b.date)
        case 'rating-high':
          return (b.selfRating || 0) - (a.selfRating || 0)
        case 'rating-low':
          return (a.selfRating || 0) - (b.selfRating || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [reflections, searchTerm, filterRating, sortBy])

  const selfCheckOptions = [
    { value: 1, label: '전혀 도움 안됨', color: '#ef4444' },
    { value: 2, label: '별로 도움 안됨', color: '#f97316' },
    { value: 3, label: '조금 도움됨', color: '#eab308' },
    { value: 4, label: '많이 도움됨', color: '#22c55e' },
    { value: 5, label: '매우 도움됨', color: '#16a34a' }
  ]

  const getRatingLabel = (rating) => {
    const option = selfCheckOptions.find(opt => opt.value === rating)
    return option ? option.label : '평가 없음'
  }

  const getRatingColor = (rating) => {
    const option = selfCheckOptions.find(opt => opt.value === rating)
    return option ? option.color : '#6b7280'
  }

  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  const getMonthlyStats = () => {
    const monthlyData = {}
    reflections.forEach(reflection => {
      const date = new Date(reflection.date)
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
          count: 0,
          avgRating: 0,
          totalRating: 0
        }
      }
      monthlyData[monthKey].count++
      monthlyData[monthKey].totalRating += reflection.selfRating || 0
      monthlyData[monthKey].avgRating = monthlyData[monthKey].totalRating / monthlyData[monthKey].count
    })
    return Object.values(monthlyData).sort((a, b) => b.month.localeCompare(a.month))
  }

  return (
    <div className="metacognition-history">
      <div className="page-header">
        <div className="header-nav">
          <button className="btn-secondary" onClick={() => navigate('/metacognition')}>
            <ArrowLeft size={20} />
            돌아가기
          </button>
        </div>
        <h1>
          <Brain size={24} />
          성찰 히스토리
        </h1>
        <p>지금까지의 모든 성찰 기록을 확인해보세요</p>
      </div>

      <div className="history-stats">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">{reflections.length}</div>
            <div className="stat-label">총 성찰 수</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {reflections.length > 0
                ? (reflections.reduce((sum, r) => sum + (r.selfRating || 0), 0) / reflections.length).toFixed(1)
                : '0'
              }
            </div>
            <div className="stat-label">평균 만족도</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {(() => {
                const thisMonth = new Date()
                const startOfMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
                return reflections.filter(r => new Date(r.date) >= startOfMonth).length
              })()}
            </div>
            <div className="stat-label">이번 달 성찰</div>
          </div>
        </div>
      </div>

      <div className="history-controls">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="성찰 내용 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-controls">
          <div className="filter-group">
            <label>
              <Filter size={16} />
              평점 필터
            </label>
            <select value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
              <option value="all">모든 평점</option>
              {selfCheckOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.value}점 - {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>정렬</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">최신순</option>
              <option value="oldest">오래된순</option>
              <option value="rating-high">평점 높은순</option>
              <option value="rating-low">평점 낮은순</option>
            </select>
          </div>
        </div>
      </div>

      <div className="reflections-container">
        {filteredAndSortedReflections.length === 0 ? (
          <div className="empty-state">
            <Brain size={64} />
            <h3>
              {searchTerm || filterRating !== 'all'
                ? '검색 결과가 없습니다'
                : '아직 성찰 기록이 없습니다'
              }
            </h3>
            <p>
              {searchTerm || filterRating !== 'all'
                ? '다른 검색어나 필터를 시도해보세요'
                : '첫 번째 성찰을 시작해보세요!'
              }
            </p>
          </div>
        ) : (
          <div className="reflections-list">
            {filteredAndSortedReflections.map(reflection => (
              <div key={reflection.id} className="reflection-history-card">
                <div className="reflection-header">
                  <div className="header-left">
                    <div className="reflection-topic">{reflection.topic}</div>
                    <div className="reflection-date">
                      <Calendar size={14} />
                      {formatDate(reflection.date)}
                    </div>
                  </div>
                  <div className="header-right">
                    <div
                      className="rating-badge"
                      style={{ backgroundColor: getRatingColor(reflection.selfRating) }}
                    >
                      <Star size={14} />
                      {reflection.selfRating || 0}/5
                    </div>
                    {reflection.isAutoTriggered && (
                      <div className="auto-badge">자동</div>
                    )}
                  </div>
                </div>

                <div className="reflection-content">
                  {reflection.prompt && (
                    <div className="reflection-prompt">
                      <strong>질문:</strong> {reflection.prompt}
                    </div>
                  )}

                  <div className="reflection-text">
                    <strong>성찰 내용:</strong>
                    <p>{reflection.reflection}</p>
                  </div>

                  <div className="satisfaction-level">
                    <strong>만족도:</strong>
                    <span style={{ color: getRatingColor(reflection.selfRating) }}>
                      {getRatingLabel(reflection.selfRating)}
                    </span>
                  </div>

                  {(reflection.struggled || reflection.needsMoreStudy || reflection.nextPlan) && (
                    <div className="additional-info">
                      {reflection.struggled && (
                        <div className="info-item">
                          <strong>어려웠던 점:</strong> {reflection.struggled}
                        </div>
                      )}
                      {reflection.needsMoreStudy && (
                        <div className="info-item">
                          <strong>더 공부할 것:</strong> {reflection.needsMoreStudy}
                        </div>
                      )}
                      {reflection.nextPlan && (
                        <div className="info-item">
                          <strong>다음 계획:</strong> {reflection.nextPlan}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {reflections.length > 0 && (
        <div className="monthly-summary">
          <h3>월별 성찰 요약</h3>
          <div className="monthly-stats">
            {getMonthlyStats().map((monthData, index) => (
              <div key={index} className="monthly-stat-card">
                <div className="month-name">{monthData.month}</div>
                <div className="month-stats">
                  <span className="month-count">{monthData.count}개</span>
                  <span className="month-avg">평균 {monthData.avgRating.toFixed(1)}/5</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MetacognitionHistory