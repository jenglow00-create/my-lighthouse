import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target } from 'lucide-react'

function OceanView({ studyData }) {
  const navigate = useNavigate()
  const [waveOffset, setWaveOffset] = useState(0)

  const subjects = useMemo(() => studyData.subjects || {}, [studyData.subjects])
  const subjectsList = useMemo(() => Object.entries(subjects), [subjects])

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveOffset(prev => (prev + 1) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  // 간단한 전체 진행률 계산
  const calculateOverallProgress = () => {
    if (subjectsList.length === 0) return 0

    let totalHours = 0
    let targetHours = 0

    subjectsList.forEach(([_, subject]) => {
      totalHours += subject.totalHours || 0
      targetHours += subject.targetHours || 0
    })

    return targetHours > 0 ? Math.min((totalHours / targetHours) * 100, 100) : 0
  }

  const progress = calculateOverallProgress()
  const boatPosition = 10 + (progress * 0.7)
  const lighthouseGlow = progress > 80 ? 'lighthouse-glow' : ''

  return (
    <div className="ocean-view">
      <div className="sky">
        <div className="clouds">
          <div className="cloud cloud-1"></div>
          <div className="cloud cloud-2"></div>
          <div className="cloud cloud-3"></div>
        </div>
      </div>

      <div className="ocean">
        <div
          className="waves"
          style={{ transform: `translateX(${Math.sin(waveOffset * Math.PI / 180) * 10}px)` }}
        >
          <div className="wave wave-1"></div>
          <div className="wave wave-2"></div>
          <div className="wave wave-3"></div>
        </div>

        <div
          className="boat"
          style={{
            left: `${boatPosition}%`,
            transform: `translateY(${Math.sin(waveOffset * Math.PI / 180) * 3}px)`
          }}
        >
          ⛵
        </div>

        <div className={`lighthouse ${lighthouseGlow}`}>
          <div className="lighthouse-beam"></div>
          <div className="lighthouse-body">🏮</div>
        </div>
      </div>

      <div className="simple-progress-info">
        <div className="simple-progress-container">
          <h2>학습 여정 진행률</h2>
          <div className="simple-progress-display">
            <span className="simple-progress-percentage">{Math.round(progress)}%</span>
          </div>
          <div className="simple-actions">
            <button className="btn-secondary" onClick={() => navigate('/goals')}>
              <Target size={20} />
              목표 설정
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OceanView