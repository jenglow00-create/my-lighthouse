// AI 분석 및 피드백 시스템
import type { StudySession } from '@/types'

/** 사용자 학습 패턴 분석 결과 */
interface UserPattern {
  avgConcentration: number
  avgUnderstanding: number
  avgFatigue: number
  studyTypeDistribution: Record<string, number>
  weeklyHours: number
  scoreProgress: number
  totalSessions: number
  occupation: string
  dailyTargetHours: number
}

/** AI 피드백 */
export interface AIFeedback {
  comparison: string | null
  recommendation: string | null
  motivationalMessage: string | null
  warningMessage: string | null
}

/** 사용자 프로필 (AI 분석용) */
interface AIUserProfile {
  occupation?: string
  dailyStudyHours?: number
  [key: string]: any  // 기타 필드 허용
}

// 주간 학습 시간 벤치마크
const WEEKLY_HOURS_BENCHMARK = [
  { max: 5, percentile: 20, message: '학습 시간 부족' },
  { max: 10, percentile: 40, message: '평균 수준' },
  { max: 15, percentile: 70, message: '평균 이상' },
  { max: 20, percentile: 90, message: '상위 10%' },
  { max: Infinity, percentile: 95, message: '상위 5%' }
] as const

// 집중도 벤치마크
const CONCENTRATION_BENCHMARK = [
  { max: 2.0, percentile: 30, message: '집중력 개선 필요' },
  { max: 3.0, percentile: 50, message: '평균 집중력' },
  { max: 4.0, percentile: 75, message: '높은 집중력' },
  { max: Infinity, percentile: 90, message: '상위 10%' }
] as const

// 이해도 벤치마크
const UNDERSTANDING_BENCHMARK = [
  { max: 2.0, percentile: 25, message: '기초 복습 필요' },
  { max: 3.0, percentile: 50, message: '평균 이해도' },
  { max: 4.0, percentile: 75, message: '높은 이해도' },
  { max: Infinity, percentile: 90, message: '상위 10%' }
] as const

/** 즉시 피드백 생성 */
export function generateInstantFeedback(
  sessionData: Partial<StudySession>,
  userProfile: AIUserProfile,
  allSessions: StudySession[]
): AIFeedback {
  const feedback: AIFeedback = {
    comparison: null,
    recommendation: null,
    motivationalMessage: null,
    warningMessage: null
  }

  const userPattern = analyzeUserPattern(sessionData, userProfile, allSessions)

  feedback.comparison = generateComparison(userPattern)
  feedback.recommendation = generateRecommendation(userPattern, sessionData)
  feedback.motivationalMessage = generateMotivationalMessage(userPattern)
  feedback.warningMessage = generateWarningMessage(userPattern, sessionData)

  return feedback
}

/** 사용자 학습 패턴 분석 */
function analyzeUserPattern(
  _sessionData: Partial<StudySession>,
  userProfile: AIUserProfile,
  allSessions: StudySession[]
): UserPattern {
  const recentSessions = allSessions.slice(0, 10)

  const avgConcentration = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + (s.concentration || 3), 0) / recentSessions.length
    : 3

  const avgUnderstanding = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + (s.understanding || 3), 0) / recentSessions.length
    : 3

  const avgFatigue = recentSessions.length > 0
    ? recentSessions.reduce((sum, s) => sum + (s.fatigue || 3), 0) / recentSessions.length
    : 3

  const studyTypeDistribution = recentSessions.reduce<Record<string, number>>((acc, session) => {
    if (session.studyType) {
      acc[session.studyType] = (acc[session.studyType] || 0) + 1
    }
    return acc
  }, {})

  const weeklyHours = calculateWeeklyHours(recentSessions)
  const scoreProgress = analyzeScoreProgress(recentSessions)

  return {
    avgConcentration,
    avgUnderstanding,
    avgFatigue,
    studyTypeDistribution,
    weeklyHours,
    scoreProgress,
    totalSessions: recentSessions.length,
    occupation: userProfile?.occupation || 'student',
    dailyTargetHours: userProfile?.dailyStudyHours || 4
  }
}

/** 비교 메시지 생성 (규칙 기반) */
function generateComparison(userPattern: UserPattern): string {
  const comparisons: Array<{ condition: boolean; message: string }> = []

  // 주간 학습 시간 벤치마크
  if (userPattern.weeklyHours >= userPattern.dailyTargetHours * 5) {
    const benchmark = WEEKLY_HOURS_BENCHMARK.find(b => userPattern.weeklyHours <= b.max)!
    comparisons.push({
      condition: true,
      message: `같은 학습량의 사용자 중 ${benchmark.message} (상위 ${100 - benchmark.percentile}%)`
    })
  }

  // 집중도 벤치마크
  const concentrationBenchmark = CONCENTRATION_BENCHMARK.find(b => userPattern.avgConcentration <= b.max)!
  if (userPattern.avgConcentration >= 4) {
    comparisons.push({
      condition: true,
      message: `집중력이 ${concentrationBenchmark.message} (상위 ${100 - concentrationBenchmark.percentile}%)`
    })
  }

  // 이해도 벤치마크
  const understandingBenchmark = UNDERSTANDING_BENCHMARK.find(b => userPattern.avgUnderstanding <= b.max)!
  if (userPattern.avgUnderstanding >= 4) {
    comparisons.push({
      condition: true,
      message: `이해도가 ${understandingBenchmark.message} (상위 ${100 - understandingBenchmark.percentile}%)`
    })
  }

  // 꾸준함
  if (userPattern.totalSessions >= 5) {
    comparisons.push({
      condition: true,
      message: `꾸준함이 동일 목표 사용자 중 상위 20%에 속합니다`
    })
  }

  // 점수 향상
  if (userPattern.scoreProgress > 0) {
    comparisons.push({
      condition: true,
      message: `점수 향상도가 같은 목표의 사용자 중 상위 25%입니다`
    })
  }

  const validComparisons = comparisons.filter(c => c.condition)
  if (validComparisons.length > 0) {
    return validComparisons[Math.floor(Math.random() * validComparisons.length)].message
  }

  return `같은 목표의 사용자 중 평균 수준입니다`
}

/** 추천 메시지 생성 */
function generateRecommendation(userPattern: UserPattern, _sessionData: Partial<StudySession>): string {
  const recommendations: string[] = []

  // 학습 유형 균형 체크
  const { studyTypeDistribution } = userPattern
  const totalStudyTypes = Object.keys(studyTypeDistribution).length
  const mostUsedType = Object.entries(studyTypeDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  if (totalStudyTypes === 1 && mostUsedType) {
    const typeNames: Record<string, string> = {
      concept: '문제풀이',
      practice: '개념학습',
      memorize: '복습',
      review: '암기'
    }
    recommendations.push(`추천: 내일은 ${typeNames[mostUsedType]} 비중을 늘려보세요`)
  }

  // 집중도 기반 추천
  if (userPattern.avgConcentration < 3) {
    recommendations.push('추천: 15분 단위로 학습을 나누어보세요')
  } else if (userPattern.avgConcentration >= 4) {
    recommendations.push('추천: 현재 집중력을 활용해 어려운 부분에 도전해보세요')
  }

  // 피로도 기반 추천
  if (userPattern.avgFatigue >= 4) {
    recommendations.push('추천: 내일은 학습량을 20% 줄이고 복습 위주로 진행하세요')
  }

  // 점수 추이 기반 추천
  if (userPattern.scoreProgress < 0) {
    recommendations.push('추천: 기초 개념 복습을 늘려보세요')
  } else if (userPattern.scoreProgress > 0) {
    recommendations.push('추천: 실전 문제풀이 비중을 늘려보세요')
  }

  // 시간대별 추천
  const hour = new Date().getHours()
  if (hour >= 22 || hour <= 6) {
    recommendations.push('추천: 밤 늦은 학습보다는 내일 아침 일찍 시작해보세요')
  } else if (hour >= 6 && hour <= 10) {
    recommendations.push('추천: 아침 시간을 활용한 개념 학습이 효과적입니다')
  }

  return recommendations.length > 0
    ? recommendations[Math.floor(Math.random() * recommendations.length)]
    : '추천: 꾸준한 학습 패턴을 유지하세요'
}

/** 동기부여 메시지 생성 */
function generateMotivationalMessage(userPattern: UserPattern): string {
  const messages: string[] = []

  if (userPattern.totalSessions >= 10) {
    messages.push('🔥 훌륭한 학습 습관이 형성되고 있습니다!')
  }

  if (userPattern.avgConcentration >= 4) {
    messages.push('⭐ 뛰어난 집중력을 보여주고 있습니다!')
  }

  if (userPattern.avgUnderstanding >= 4) {
    messages.push('🧠 이해도가 점점 높아지고 있습니다!')
  }

  if (userPattern.scoreProgress > 0) {
    messages.push('📈 점수가 꾸준히 상승하고 있습니다!')
  }

  if (userPattern.weeklyHours >= userPattern.dailyTargetHours * 5) {
    messages.push('💪 목표 학습량을 잘 달성하고 있습니다!')
  }

  const defaultMessages = [
    '✨ 매일 조금씩 발전하고 있습니다!',
    '🎯 목표를 향해 착실히 나아가고 있습니다!',
    '🌟 꾸준함이 큰 성과를 만들어냅니다!'
  ]

  return messages.length > 0
    ? messages[Math.floor(Math.random() * messages.length)]
    : defaultMessages[Math.floor(Math.random() * defaultMessages.length)]
}

/** 경고 메시지 생성 */
function generateWarningMessage(userPattern: UserPattern, sessionData: Partial<StudySession>): string | null {
  const warnings: string[] = []

  if (userPattern.avgFatigue >= 4.5) {
    warnings.push('⚠️ 피로도가 높습니다. 휴식을 고려해보세요')
  }

  if (userPattern.avgConcentration <= 2) {
    warnings.push('⚠️ 집중력이 떨어지고 있습니다. 학습 환경을 점검해보세요')
  }

  if (userPattern.weeklyHours < userPattern.dailyTargetHours * 2) {
    warnings.push('⚠️ 목표 학습량에 비해 부족합니다')
  }

  if ((sessionData.concentration ?? 3) <= 2 && (sessionData.understanding ?? 3) <= 2) {
    warnings.push('⚠️ 오늘은 컨디션이 좋지 않은 것 같습니다. 가벼운 복습을 추천합니다')
  }

  return warnings.length > 0 ? warnings[0] : null
}

/** 주간 학습 시간 계산 */
function calculateWeeklyHours(sessions: StudySession[]): number {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return sessions
    .filter(session => new Date(session.date) >= oneWeekAgo)
    .reduce((total, session) => total + (session.duration || 0), 0)
}

/** 점수 향상 분석 */
function analyzeScoreProgress(_sessions: StudySession[]): number {
  // Note: StudySession에는 expectedScore, actualScore가 없음
  // Subject의 scores 배열을 사용해야 하지만, 여기서는 간단히 0 반환
  return 0
}

/** 실시간 피드백 생성 */
export function generateRealTimeFeedback(
  fieldName: string,
  value: number | string
): string[] {
  const feedback: string[] = []

  switch (fieldName) {
    case 'concentration':
      if (typeof value === 'number') {
        if (value >= 4) {
          feedback.push('🔥 훌륭한 집중력입니다!')
        } else if (value <= 2) {
          feedback.push('💡 내일은 환경을 바꿔보세요')
        }
      }
      break

    case 'understanding':
      if (typeof value === 'number') {
        if (value >= 4) {
          feedback.push('🧠 이해도가 높네요!')
        } else if (value <= 2) {
          feedback.push('📚 기초 복습을 추천합니다')
        }
      }
      break

    case 'fatigue':
      if (typeof value === 'number') {
        if (value >= 4) {
          feedback.push('😴 충분한 휴식이 필요해보입니다')
        } else if (value <= 2) {
          feedback.push('💪 컨디션이 좋네요!')
        }
      }
      break

    case 'duration':
      if (typeof value === 'number') {
        if (value >= 3) {
          feedback.push('⏰ 장시간 학습! 중간 휴식을 잊지 마세요')
        } else if (value <= 0.5) {
          feedback.push('🕐 짧은 시간도 의미있습니다')
        }
      }
      break
  }

  return feedback
}
