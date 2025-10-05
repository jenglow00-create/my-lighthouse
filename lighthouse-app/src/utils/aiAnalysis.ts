// AI 분석 및 피드백 시스템 (규칙 기반)
import type { StudySession } from '@/types'
import {
  WEEKLY_HOURS_BENCHMARK,
  CONCENTRATION_BENCHMARK,
  UNDERSTANDING_BENCHMARK,
  FATIGUE_BENCHMARK,
  DAILY_SESSIONS_BENCHMARK,
  DAILY_HOURS_BENCHMARK,
  findBenchmarkLevel,
  getPercentileMessage,
  getOverallAssessment
} from '@/constants/benchmarks'

/** 사용자 학습 패턴 분석 결과 */
interface UserPattern {
  avgConcentration: number
  avgUnderstanding: number
  avgFatigue: number
  studyTypeDistribution: Record<string, number>
  weeklyHours: number
  dailyHours: number
  dailySessions: number
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
  const dailyHours = calculateDailyHours(recentSessions)
  const dailySessions = calculateDailySessions(recentSessions)
  const scoreProgress = analyzeScoreProgress(recentSessions)

  return {
    avgConcentration,
    avgUnderstanding,
    avgFatigue,
    studyTypeDistribution,
    weeklyHours,
    dailyHours,
    dailySessions,
    scoreProgress,
    totalSessions: recentSessions.length,
    occupation: userProfile?.occupation || 'student',
    dailyTargetHours: userProfile?.dailyStudyHours || 4
  }
}

/** 비교 메시지 생성 (벤치마크 기반) */
function generateComparison(userPattern: UserPattern): string {
  const comparisons: string[] = []

  // 주간 학습 시간 벤치마크
  if (userPattern.weeklyHours > 0) {
    const level = findBenchmarkLevel(WEEKLY_HOURS_BENCHMARK, userPattern.weeklyHours)
    comparisons.push(
      `주간 학습량 ${userPattern.weeklyHours.toFixed(1)}시간 - ${getPercentileMessage(level.percentile)}`
    )
  }

  // 집중도 벤치마크
  if (userPattern.avgConcentration > 0) {
    const level = findBenchmarkLevel(CONCENTRATION_BENCHMARK, userPattern.avgConcentration)
    if (level.percentile >= 70) {
      comparisons.push(
        `집중도 ${userPattern.avgConcentration.toFixed(1)}점 - ${getPercentileMessage(level.percentile)}`
      )
    }
  }

  // 이해도 벤치마크
  if (userPattern.avgUnderstanding > 0) {
    const level = findBenchmarkLevel(UNDERSTANDING_BENCHMARK, userPattern.avgUnderstanding)
    if (level.percentile >= 70) {
      comparisons.push(
        `이해도 ${userPattern.avgUnderstanding.toFixed(1)}점 - ${getPercentileMessage(level.percentile)}`
      )
    }
  }

  // 일일 세션 수
  if (userPattern.dailySessions >= 2) {
    const level = findBenchmarkLevel(DAILY_SESSIONS_BENCHMARK, userPattern.dailySessions)
    if (level.percentile >= 50) {
      comparisons.push(
        `하루 ${userPattern.dailySessions}회 학습 - 분산학습 ${level.label}`
      )
    }
  }

  if (comparisons.length > 0) {
    return comparisons[Math.floor(Math.random() * comparisons.length)]
  }

  // 종합 평가 반환
  return getOverallAssessment({
    weeklyHours: userPattern.weeklyHours,
    avgConcentration: userPattern.avgConcentration,
    avgUnderstanding: userPattern.avgUnderstanding,
    avgFatigue: userPattern.avgFatigue,
    dailySessions: userPattern.dailySessions
  })
}

/** 추천 메시지 생성 (벤치마크 기반) */
function generateRecommendation(userPattern: UserPattern, _sessionData: Partial<StudySession>): string {
  const recommendations: string[] = []

  // 집중도 기반 추천
  const concentrationLevel = findBenchmarkLevel(CONCENTRATION_BENCHMARK, userPattern.avgConcentration)
  if (concentrationLevel.percentile < 50) {
    recommendations.push('추천: 포모도로 기법(25분 집중 + 5분 휴식)을 시도해보세요')
  } else if (concentrationLevel.percentile >= 80) {
    recommendations.push('추천: 현재 높은 집중력을 활용해 어려운 문제에 도전해보세요')
  }

  // 이해도 기반 추천
  const understandingLevel = findBenchmarkLevel(UNDERSTANDING_BENCHMARK, userPattern.avgUnderstanding)
  if (understandingLevel.percentile < 40) {
    recommendations.push('추천: 기초 개념 복습 시간을 늘려보세요')
  } else if (understandingLevel.percentile >= 80) {
    recommendations.push('추천: 심화 문제나 응용 학습으로 확장해보세요')
  }

  // 피로도 기반 추천
  const fatigueLevel = findBenchmarkLevel(FATIGUE_BENCHMARK, userPattern.avgFatigue)
  if (fatigueLevel.percentile <= 30) { // 피로도가 높음 (낮은 백분위)
    recommendations.push('추천: 학습량을 20% 줄이고 충분한 휴식을 취하세요')
  } else if (fatigueLevel.percentile >= 80) {
    recommendations.push('추천: 컨디션이 좋습니다. 집중이 필요한 학습을 배치하세요')
  }

  // 학습 시간 기반 추천
  const weeklyLevel = findBenchmarkLevel(WEEKLY_HOURS_BENCHMARK, userPattern.weeklyHours)
  if (weeklyLevel.percentile < 40) {
    recommendations.push('추천: 주간 학습 시간을 점진적으로 늘려보세요')
  }

  // 세션 분산 추천
  const sessionLevel = findBenchmarkLevel(DAILY_SESSIONS_BENCHMARK, userPattern.dailySessions)
  if (sessionLevel.percentile < 50) {
    recommendations.push('추천: 학습을 2-3회로 나누면 기억 정착에 효과적입니다')
  }

  // 학습 유형 균형 체크
  const { studyTypeDistribution } = userPattern
  const totalStudyTypes = Object.keys(studyTypeDistribution).length
  const mostUsedType = Object.entries(studyTypeDistribution)
    .sort(([, a], [, b]) => b - a)[0]?.[0]

  if (totalStudyTypes === 1 && mostUsedType) {
    const typeNames: Record<string, string> = {
      concept: '문제풀이나 실전 연습',
      practice: '개념 이해 학습',
      memorize: '이해 중심 학습',
      review: '새로운 내용 학습'
    }
    recommendations.push(`추천: 학습 균형을 위해 ${typeNames[mostUsedType]}도 병행하세요`)
  }

  // 시간대별 추천
  const hour = new Date().getHours()
  if (hour >= 22 || hour <= 5) {
    recommendations.push('추천: 늦은 밤 학습보다 내일 아침 일찍 시작하는 것이 효율적입니다')
  } else if (hour >= 6 && hour <= 9) {
    recommendations.push('추천: 아침 시간을 활용한 개념 학습이 기억력 향상에 좋습니다')
  }

  return recommendations.length > 0
    ? recommendations[Math.floor(Math.random() * recommendations.length)]
    : '추천: 현재 학습 패턴을 꾸준히 유지하세요'
}

/** 동기부여 메시지 생성 */
function generateMotivationalMessage(userPattern: UserPattern): string {
  const messages: string[] = []

  // 학습량 기반 동기부여
  const weeklyLevel = findBenchmarkLevel(WEEKLY_HOURS_BENCHMARK, userPattern.weeklyHours)
  if (weeklyLevel.percentile >= 70) {
    messages.push('🔥 훌륭한 학습량을 유지하고 있습니다!')
  }

  // 집중도 기반 동기부여
  const concentrationLevel = findBenchmarkLevel(CONCENTRATION_BENCHMARK, userPattern.avgConcentration)
  if (concentrationLevel.percentile >= 70) {
    messages.push('⭐ 뛰어난 집중력을 보여주고 있습니다!')
  }

  // 이해도 기반 동기부여
  const understandingLevel = findBenchmarkLevel(UNDERSTANDING_BENCHMARK, userPattern.avgUnderstanding)
  if (understandingLevel.percentile >= 70) {
    messages.push('🧠 이해도가 점점 높아지고 있습니다!')
  }

  // 세션 수 기반 동기부여
  if (userPattern.totalSessions >= 10) {
    messages.push('💪 훌륭한 학습 습관이 형성되고 있습니다!')
  }

  // 점수 향상
  if (userPattern.scoreProgress > 0) {
    messages.push('📈 점수가 꾸준히 상승하고 있습니다!')
  }

  // 피로도 관리
  const fatigueLevel = findBenchmarkLevel(FATIGUE_BENCHMARK, userPattern.avgFatigue)
  if (fatigueLevel.percentile >= 80) { // 피로도가 낮음 (높은 백분위)
    messages.push('💚 건강한 학습 습관을 유지하고 있습니다!')
  }

  // 기본 동기부여 메시지
  const defaultMessages = [
    '✨ 매일 조금씩 발전하고 있습니다!',
    '🎯 목표를 향해 착실히 나아가고 있습니다!',
    '🌟 꾸준함이 큰 성과를 만들어냅니다!',
    '🚀 한 걸음씩 목표에 다가가고 있습니다!'
  ]

  return messages.length > 0
    ? messages[Math.floor(Math.random() * messages.length)]
    : defaultMessages[Math.floor(Math.random() * defaultMessages.length)]
}

/** 경고 메시지 생성 */
function generateWarningMessage(userPattern: UserPattern, sessionData: Partial<StudySession>): string | null {
  const warnings: string[] = []

  // 피로도 경고
  const fatigueLevel = findBenchmarkLevel(FATIGUE_BENCHMARK, userPattern.avgFatigue)
  if (fatigueLevel.percentile <= 15) { // 매우 높은 피로도
    warnings.push(`⚠️ ${fatigueLevel.message}`)
  }

  // 집중도 경고
  const concentrationLevel = findBenchmarkLevel(CONCENTRATION_BENCHMARK, userPattern.avgConcentration)
  if (concentrationLevel.percentile <= 30) {
    warnings.push(`⚠️ ${concentrationLevel.message}`)
  }

  // 이해도 경고
  const understandingLevel = findBenchmarkLevel(UNDERSTANDING_BENCHMARK, userPattern.avgUnderstanding)
  if (understandingLevel.percentile <= 30) {
    warnings.push(`⚠️ ${understandingLevel.message}`)
  }

  // 학습량 경고
  const weeklyLevel = findBenchmarkLevel(WEEKLY_HOURS_BENCHMARK, userPattern.weeklyHours)
  if (weeklyLevel.percentile <= 20) {
    warnings.push(`⚠️ ${weeklyLevel.message}`)
  }

  // 현재 세션 상태 경고
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

/** 일일 평균 학습 시간 계산 */
function calculateDailyHours(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0

  const uniqueDates = new Set(sessions.map(s => s.date))
  const totalHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)

  return totalHours / uniqueDates.size
}

/** 일일 평균 세션 수 계산 */
function calculateDailySessions(sessions: StudySession[]): number {
  if (sessions.length === 0) return 0

  const uniqueDates = new Set(sessions.map(s => s.date))
  return sessions.length / uniqueDates.size
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
        const level = findBenchmarkLevel(CONCENTRATION_BENCHMARK, value)
        if (level.percentile >= 80) {
          feedback.push('🔥 훌륭한 집중력입니다!')
        } else if (level.percentile <= 30) {
          feedback.push('💡 환경을 바꿔보거나 휴식 후 재시도하세요')
        }
      }
      break

    case 'understanding':
      if (typeof value === 'number') {
        const level = findBenchmarkLevel(UNDERSTANDING_BENCHMARK, value)
        if (level.percentile >= 80) {
          feedback.push('🧠 내용을 잘 이해하고 있습니다!')
        } else if (level.percentile <= 30) {
          feedback.push('📚 기초 개념 복습을 추천합니다')
        }
      }
      break

    case 'fatigue':
      if (typeof value === 'number') {
        const level = findBenchmarkLevel(FATIGUE_BENCHMARK, value)
        if (level.percentile <= 15) { // 높은 피로도
          feedback.push('😴 충분한 휴식이 필요해보입니다')
        } else if (level.percentile >= 80) { // 낮은 피로도
          feedback.push('💪 컨디션이 좋네요!')
        }
      }
      break

    case 'duration':
      if (typeof value === 'number') {
        const level = findBenchmarkLevel(DAILY_HOURS_BENCHMARK, value)
        if (value >= 3) {
          feedback.push('⏰ 장시간 학습! 중간 휴식을 잊지 마세요')
        } else if (level.percentile >= 50) {
          feedback.push('✅ 적절한 학습 시간입니다')
        }
      }
      break
  }

  return feedback
}
