import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Target, Menu, Settings } from 'lucide-react'

// 이미지 imports
import oceanBg from '../assets/images/backgrounds/평화로운 바닷가 풍경.png'
import lighthouse from '../assets/images/backgrounds/붉은 등대와 빛의 섬.png'
import clouds from '../assets/images/backgrounds/부드러운 구름들의 디지털 일러스트.png'
import waves from '../assets/images/backgrounds/부드러운 파도 일러스트 4종.png'
import { boatImages } from '../constants/boatOptions'
import logo from '../assets/images/logos/등대 로고.png'

function OceanView({ studyData }) {
  const navigate = useNavigate()
  const [waveOffset, setWaveOffset] = useState(0)
  const [cloudOffset, setCloudOffset] = useState(0)

  const subjects = useMemo(() => studyData.subjects || {}, [studyData.subjects])
  const subjectsList = useMemo(() => Object.entries(subjects), [subjects])

  // 보트 이미지 선택 (설정에서 가져오거나 기본값)
  const selectedBoatType = studyData.globalSettings?.selectedBoat || 'boat1'
  const currentBoatImage = boatImages[selectedBoatType]

  // 애니메이션 설정
  const waveAnimationEnabled = studyData.globalSettings?.waveAnimation !== false
  const cloudAnimationEnabled = studyData.globalSettings?.cloudAnimation !== false

  useEffect(() => {
    const waveInterval = setInterval(() => {
      setWaveOffset(prev => (prev + 1) % 360)
    }, 50)

    const cloudInterval = setInterval(() => {
      setCloudOffset(prev => (prev + 0.1) % 100)
    }, 100)

    return () => {
      clearInterval(waveInterval)
      clearInterval(cloudInterval)
    }
  }, [])

  // 간단한 전체 진행률 계산
  const calculateOverallProgress = () => {
    if (subjectsList.length === 0) return 0

    let totalHours = 0
    let targetHours = 0

    subjectsList.forEach(([subjectId, subject]) => {
      totalHours += subject.totalHours || 0
      targetHours += subject.targetHours || 0
    })

    return targetHours > 0 ? Math.min((totalHours / targetHours) * 100, 100) : 0
  }

  const progress = calculateOverallProgress()
  const boatPosition = 5 + (progress * 0.75) // 5%에서 80%까지 이동
  const lighthouseGlow = progress > 80 ? 'lighthouse-glow' : ''
  const boatBob = Math.sin(waveOffset * Math.PI / 180) * 8 // 배의 상하 움직임

  return (
    <div className="ocean-view-container">
      {/* 헤더 UI */}
      <div className="ocean-header">
        <div className="ocean-title">
          <img src={logo} alt="등대 로고" className="header-logo" />
          <h1>등대</h1>
        </div>
        <div className="ocean-menu">
          <button
            className="menu-btn"
            onClick={() => navigate('/dashboard')}
            title="대시보드로 이동"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* 메인 바다 화면 */}
      <div className="ocean-main">
        {/* 배경 이미지 */}
        <div className="ocean-background">
          <img src={oceanBg} alt="바다 배경" className="ocean-bg-image" />
        </div>

        {/* 구름 레이어 (크기 축소 및 최상단 배치) */}
        <div className="clouds-layer-small">
          <img
            src={clouds}
            alt="구름"
            className="clouds-image-small clouds-1-small"
            style={{
              transform: cloudAnimationEnabled
                ? `translateX(${cloudOffset}px)`
                : 'translateX(0px)'
            }}
          />
          <img
            src={clouds}
            alt="구름"
            className="clouds-image-small clouds-2-small"
            style={{
              transform: cloudAnimationEnabled
                ? `translateX(${cloudOffset * 0.7}px)`
                : 'translateX(0px)'
            }}
          />
        </div>

        {/* 등대 */}
        <div className={`lighthouse-container ${lighthouseGlow}`}>
          <img src={lighthouse} alt="등대" className="lighthouse-image lighthouse-flipped" />
          {progress > 80 && (
            <div className="lighthouse-beam-effect"></div>
          )}
        </div>

        {/* 배 (선택된 이미지 사용) */}
        <div
          className="boat-container"
          style={{
            left: `${boatPosition}%`,
            transform: waveAnimationEnabled
              ? `translateY(${boatBob}px) rotate(${Math.sin(waveOffset * Math.PI / 180) * 2}deg)`
              : 'translateY(0px) rotate(0deg)'
          }}
        >
          <img src={currentBoatImage} alt="배" className="boat-image boat-flipped" />
        </div>
      </div>

      {/* 상단 진행률 정보 */}
      <div className="progress-overlay-top">
        <div className="progress-card-compact">
          <div className="progress-header">
            <h3>목표 도달율</h3>
            <span className="percentage-value-compact">{Math.round(progress)}%</span>
          </div>
          {subjectsList.length > 0 ? (
            <div className="progress-summary">
              <span>{subjectsList.length}개 과목 학습 중</span>
              <span>등대까지 {Math.round(100 - progress)}% 남음</span>
            </div>
          ) : (
            <div className="no-subjects-compact">
              <span>학습할 과목을 추가해보세요!</span>
              <button
                className="btn-tiny"
                onClick={() => navigate('/settings')}
              >
                과목 추가
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 네비게이션 힌트 */}
      {progress < 10 && (
        <div className="welcome-hint">
          <div className="hint-bubble">
            <p>🌊 학습 여정을 시작해보세요!</p>
            <p>배가 등대를 향해 나아갑니다.</p>
            <small>💡 설정에서 배 스타일을 변경할 수 있어요</small>
          </div>
        </div>
      )}
    </div>
  )
}

export default OceanView