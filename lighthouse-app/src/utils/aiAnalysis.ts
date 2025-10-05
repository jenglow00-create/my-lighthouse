// AI 분석 및 피드백 시스템 (Evidence 기반)
import type { StudySession, Reflection } from '@/types'
import {
  WEEKLY_HOURS_BENCHMARK,
  CONCENTRATION_BENCHMARK,
  UNDERSTANDING_BENCHMARK,
  FATIGUE_BENCHMARK,
  DAILY_HOURS_BENCHMARK,
  findBenchmarkLevel,
  getPercentileMessage
} from '@/constants/benchmarks'

// ============================================================================
// 타입 정의
// ============================================================================

/** 근거 데이터 */
export interface Evidence {
  metric: string
  value: number
  unit: string
  benchmark: string
  source: string
}

/** 피드백 구조 */
export interface Feedback {
  message: string
  percentile: number
  label: string
  evidence: Evidence
  recommendations: string[]
}

/** 주간 분석 결과 */
export interface WeeklyAnalysis {
  totalHours: number
  avgConcentration: number
  avgUnderstanding: number
  avgFatigue: number
  sessionCount: number
  dailySessions: number
  feedback: Feedback
}

/** 집중도 분석 결과 */
export interface ConcentrationAnalysis {
  average: number
  trend: 'improving' | 'stable' | 'declining'
  feedback: Feedback
}

/** 진도 분석 결과 */
export interface ProgressAnalysis {
  progressPercent: number
  daysUntilExam: number
  dailyRequiredProgress: number
  urgency: 'low' | 'medium' | 'high'
  message: string
  advice: string
}

/** AI 피드백 (기존 호환성) */
export interface AIFeedback {
  comparison: string | null
  recommendation: string | null
  motivationalMessage: string | null
  warningMessage: string | null
}

// ============================================================================
// 주요 분석 함수
// ============================================================================

/**
 * 주간 학습 패턴 분석
 *
 * @param sessions - 주간 학습 세션 배열
 * @returns 주간 분석 결과
 */
export function analyzeWeeklyPattern(sessions: StudySession[]): WeeklyAnalysis {
  // 1. 기본 통계 계산
  if (sessions.length === 0) {
    return {
      totalHours: 0,
      avgConcentration: 0,
      avgUnderstanding: 0,
      avgFatigue: 0,
      sessionCount: 0,
      dailySessions: 0,
      feedback: {
        message: '아직 학습 데이터가 없습니다. 첫 학습을 시작해보세요!',
        percentile: 0,
        label: '데이터 없음',
        evidence: {
          metric: '주간 학습 시간',
          value: 0,
          unit: '시간',
          benchmark: '데이터 없음',
          source: '사용자 데이터'
        },
        recommendations: ['첫 학습 세션을 기록하고 학습 패턴을 만들어가세요.']
      }
    }
  }

  const totalHours = sessions.reduce((sum, s) => sum + (s.duration || 0), 0)
  const avgConcentration =
    sessions.reduce((sum, s) => sum + (s.concentration || 3), 0) / sessions.length
  const avgUnderstanding =
    sessions.reduce((sum, s) => sum + (s.understanding || 3), 0) / sessions.length
  const avgFatigue = sessions.reduce((sum, s) => sum + (s.fatigue || 3), 0) / sessions.length
  const sessionCount = sessions.length

  // 일일 평균 세션 수
  const uniqueDates = new Set(sessions.map(s => s.date))
  const dailySessions = sessionCount / uniqueDates.size

  // 2. 벤치마크 비교
  const hoursLevel = findBenchmarkLevel(WEEKLY_HOURS_BENCHMARK, totalHours)

  // 3. 피드백 생성
  const feedback: Feedback = {
    message: hoursLevel.message,
    percentile: hoursLevel.percentile,
    label: hoursLevel.label,
    evidence: {
      metric: '주간 학습 시간',
      value: parseFloat(totalHours.toFixed(1)),
      unit: '시간',
      benchmark: `${hoursLevel.min}~${hoursLevel.max === Infinity ? '25+' : hoursLevel.max}시간 구간`,
      source: WEEKLY_HOURS_BENCHMARK.source
    },
    recommendations: generateWeeklyRecommendations({
      totalHours,
      avgConcentration,
      avgUnderstanding,
      avgFatigue,
      sessionCount,
      dailySessions
    })
  }

  return {
    totalHours,
    avgConcentration,
    avgUnderstanding,
    avgFatigue,
    sessionCount,
    dailySessions,
    feedback
  }
}

/**
 * 집중도 분석
 *
 * @param sessions - 학습 세션 배열
 * @returns 집중도 분석 결과
 */
export function analyzeConcentration(sessions: StudySession[]): ConcentrationAnalysis {
  if (sessions.length === 0) {
    return {
      average: 0,
      trend: 'stable',
      feedback: {
        message: '집중도 데이터가 부족합니다.',
        percentile: 0,
        label: '데이터 없음',
        evidence: {
          metric: '평균 집중도',
          value: 0,
          unit: '점',
          benchmark: '데이터 없음',
          source: '사용자 데이터'
        },
        recommendations: ['학습 세션을 기록하고 집중도를 평가해보세요.']
      }
    }
  }

  const average =
    sessions.reduce((sum, s) => sum + (s.concentration || 3), 0) / sessions.length

  // 추세 분석 (최근 5개 vs 이전 5개)
  let trend: 'improving' | 'stable' | 'declining' = 'stable'
  if (sessions.length >= 10) {
    const recent = sessions.slice(0, 5)
    const previous = sessions.slice(5, 10)
    const recentAvg = recent.reduce((sum, s) => sum + s.concentration, 0) / 5
    const previousAvg = previous.reduce((sum, s) => sum + s.concentration, 0) / 5
    const diff = recentAvg - previousAvg

    if (diff > 0.3) trend = 'improving'
    else if (diff < -0.3) trend = 'declining'
  }

  const level = findBenchmarkLevel(CONCENTRATION_BENCHMARK, average)

  const feedback: Feedback = {
    message: level.message,
    percentile: level.percentile,
    label: level.label,
    evidence: {
      metric: '평균 집중도',
      value: parseFloat(average.toFixed(1)),
      unit: '점',
      benchmark: `${level.min}~${level.max}점 구간`,
      source: CONCENTRATION_BENCHMARK.source
    },
    recommendations: generateConcentrationRecommendations(average, trend)
  }

  return { average, trend, feedback }
}

/**
 * 진도율 기반 분석
 *
 * @param progressPercent - 현재 진도율 (0-100)
 * @param daysUntilExam - 시험까지 남은 일수
 * @returns 진도 분석 결과
 */
export function analyzeProgress(
  progressPercent: number,
  daysUntilExam: number
): ProgressAnalysis {
  const dailyRequiredProgress =
    daysUntilExam > 0 ? (100 - progressPercent) / daysUntilExam : 0

  let urgency: 'low' | 'medium' | 'high' = 'low'
  let message = ''
  let advice = ''

  if (progressPercent >= 90) {
    urgency = 'low'
    message = '거의 다 왔습니다! 마무리 단계입니다.'
    advice = '지금까지 배운 내용을 복습하고 실전 문제를 풀어보세요.'
  } else if (progressPercent >= 70) {
    urgency = 'low'
    message = '순조롭게 진행하고 있습니다.'
    advice = `하루 ${dailyRequiredProgress.toFixed(1)}%씩 진행하면 목표 달성 가능합니다.`
  } else if (progressPercent >= 50) {
    urgency = 'medium'
    message = '절반을 넘었습니다. 페이스를 유지하세요.'
    advice = `남은 ${daysUntilExam}일 동안 집중이 필요합니다.`
  } else if (progressPercent >= 30) {
    urgency = 'high'
    message = '시간이 촉박합니다. 속도를 높여야 합니다.'
    advice = `하루 ${dailyRequiredProgress.toFixed(1)}% 이상 진행이 필요합니다.`
  } else {
    urgency = 'high'
    message = '매우 긴급합니다. 학습 계획 재조정이 필요합니다.'
    advice = '중요한 주제에 집중하고, 학습 시간을 대폭 늘려야 합니다.'
  }

  return {
    progressPercent,
    daysUntilExam,
    dailyRequiredProgress,
    urgency,
    message,
    advice
  }
}

/**
 * 성찰 분석
 *
 * @param reflection - 현재 성찰
 * @param allReflections - 전체 성찰 배열
 * @returns 성찰 분석 결과
 */
export function analyzeReflection(
  reflection: Reflection,
  allReflections: Reflection[]
): {
  ranking: string
  comparison: string
  advice: string
  percentile: number
} {
  const rating = reflection.learningRating

  // 전체 성찰 중 현재 등급 이상 비율 계산
  if (allReflections.length === 0) {
    return {
      ranking: '평가 불가',
      comparison: '비교 데이터 없음',
      advice: '더 많은 성찰을 기록해보세요.',
      percentile: 0
    }
  }

  const sameOrHigher = allReflections.filter(r => r.learningRating >= rating).length
  const percentile = Math.round((sameOrHigher / allReflections.length) * 100)

  let ranking = ''
  let comparison = ''
  let advice = ''

  if (rating === 5) {
    ranking = '완벽한 이해'
    comparison = `전체 성찰 중 상위 ${100 - percentile}%`
    advice = '완벽하게 이해했습니다. 이 주제는 다른 사람에게 설명할 수 있을 정도입니다.'
  } else if (rating === 4) {
    ranking = '우수한 이해'
    comparison = `전체 성찰 중 상위 ${100 - percentile}%`
    advice = '잘 이해했습니다. 조금만 더 연습하면 완벽해질 것입니다.'
  } else if (rating === 3) {
    ranking = '보통'
    comparison = `전체 성찰 중 ${percentile}%`
    advice = '기본은 이해했지만 더 깊은 학습이 필요합니다.'
  } else if (rating === 2) {
    ranking = '부족'
    comparison = `하위 ${percentile}%`
    advice = '이 주제에 더 많은 시간을 투자해야 합니다. 기본 개념부터 다시 학습하세요.'
  } else {
    ranking = '미흡'
    comparison = `하위 ${percentile}%`
    advice = '이 주제는 처음부터 다시 학습이 필요합니다. 쉬운 자료부터 시작하세요.'
  }

  return { ranking, comparison, advice, percentile }
}

// ============================================================================
// 추천 생성 함수
// ============================================================================

/**
 * 주간 패턴 기반 추천 생성
 */
function generateWeeklyRecommendations(data: {
  totalHours: number
  avgConcentration: number
  avgUnderstanding: number
  avgFatigue: number
  sessionCount: number
  dailySessions: number
}): string[] {
  const recommendations: string[] = []

  // 학습 시간 기반 추천
  if (data.totalHours < 10) {
    recommendations.push('하루 1.5시간씩 주 7일 학습하면 목표 달성에 도움이 됩니다.')
  } else if (data.totalHours > 25) {
    recommendations.push('과도한 학습은 번아웃을 유발할 수 있습니다. 적절한 휴식을 취하세요.')
  }

  // 집중도 기반 추천
  if (data.avgConcentration < 3.0) {
    recommendations.push('학습 환경을 점검해보세요. 조용한 공간, 적절한 조명이 집중도를 높입니다.')
    recommendations.push('포모도로 기법(25분 집중 + 5분 휴식)을 시도해보세요.')
  } else if (data.avgConcentration >= 4.0) {
    recommendations.push('높은 집중력을 유지하고 있습니다. 어려운 문제에 도전해보세요.')
  }

  // 이해도 기반 추천
  if (data.avgUnderstanding < 3.0) {
    recommendations.push('이해도를 높이기 위해 개념 학습 시간을 늘려보세요.')
  } else if (data.avgUnderstanding >= 4.0) {
    recommendations.push('높은 이해도를 보이고 있습니다. 심화 학습으로 넘어가세요.')
  }

  // 피로도 기반 추천
  if (data.avgFatigue >= 4.0) {
    recommendations.push('피로도가 높습니다. 학습량을 20% 줄이고 충분한 휴식을 취하세요.')
  }

  // 세션 분산 추천
  if (data.dailySessions < 2) {
    recommendations.push('학습을 2-3회로 나누면 기억 정착에 효과적입니다.')
  } else if (data.dailySessions >= 4) {
    recommendations.push('체계적으로 학습을 분산하고 있습니다. 각 세션의 질을 유지하세요.')
  }

  // 균형 추천
  if (data.totalHours >= 15 && data.avgConcentration >= 4.0 && data.avgFatigue < 3.0) {
    recommendations.push('훌륭한 학습 패턴입니다! 이 페이스를 유지하세요.')
  }

  return recommendations.length > 0
    ? recommendations
    : ['현재 학습 패턴을 꾸준히 유지하세요.']
}

/**
 * 집중도 기반 추천 생성
 */
function generateConcentrationRecommendations(
  average: number,
  trend: 'improving' | 'stable' | 'declining'
): string[] {
  const recommendations: string[] = []

  if (average < 2.5) {
    recommendations.push('집중도가 낮습니다. 학습 환경을 개선하거나 시간대를 바꿔보세요.')
    recommendations.push('방해 요소를 제거하고 휴대폰을 멀리 두세요.')
  } else if (average < 3.5) {
    recommendations.push('집중도를 높이기 위해 짧은 학습 세션(25-30분)을 시도해보세요.')
  } else if (average >= 4.0) {
    recommendations.push('높은 집중력을 유지하고 있습니다. 이 상태를 활용하세요.')
  }

  if (trend === 'declining') {
    recommendations.push('최근 집중도가 하락하고 있습니다. 휴식이 필요할 수 있습니다.')
  } else if (trend === 'improving') {
    recommendations.push('집중도가 점점 좋아지고 있습니다. 잘하고 있어요!')
  }

  return recommendations
}

// ============================================================================
// 기존 호환성 함수 (StudyLog.tsx 등에서 사용)
// ============================================================================

/**
 * 즉시 피드백 생성 (기존 호환성)
 */
export function generateInstantFeedback(
  sessionData: Partial<StudySession>,
  _userProfile: any,
  allSessions: StudySession[]
): AIFeedback {
  const recentSessions = allSessions.slice(0, 10)
  const weeklyAnalysis = analyzeWeeklyPattern(recentSessions)

  return {
    comparison: `${weeklyAnalysis.feedback.label} - ${getPercentileMessage(weeklyAnalysis.feedback.percentile)}`,
    recommendation:
      weeklyAnalysis.feedback.recommendations[
        Math.floor(Math.random() * weeklyAnalysis.feedback.recommendations.length)
      ] || null,
    motivationalMessage: generateMotivationalMessage(weeklyAnalysis),
    warningMessage: generateWarningMessage(weeklyAnalysis, sessionData)
  }
}

/**
 * 동기부여 메시지 생성
 */
function generateMotivationalMessage(analysis: WeeklyAnalysis): string {
  const messages: string[] = []

  if (analysis.feedback.percentile >= 70) {
    messages.push('🔥 훌륭한 학습량을 유지하고 있습니다!')
  }

  if (analysis.avgConcentration >= 4.0) {
    messages.push('⭐ 뛰어난 집중력을 보여주고 있습니다!')
  }

  if (analysis.avgUnderstanding >= 4.0) {
    messages.push('🧠 이해도가 점점 높아지고 있습니다!')
  }

  if (analysis.sessionCount >= 10) {
    messages.push('💪 훌륭한 학습 습관이 형성되고 있습니다!')
  }

  if (analysis.avgFatigue <= 2.5) {
    messages.push('💚 건강한 학습 습관을 유지하고 있습니다!')
  }

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

/**
 * 경고 메시지 생성
 */
function generateWarningMessage(
  analysis: WeeklyAnalysis,
  sessionData: Partial<StudySession>
): string | null {
  const warnings: string[] = []

  if (analysis.avgFatigue >= 4.5) {
    warnings.push('⚠️ 피로도가 매우 높습니다. 반드시 휴식이 필요합니다.')
  }

  if (analysis.avgConcentration <= 2.0) {
    warnings.push('⚠️ 집중도가 낮습니다. 학습 환경을 점검해보세요.')
  }

  if (analysis.avgUnderstanding <= 2.0) {
    warnings.push('⚠️ 이해도가 낮습니다. 기초 개념 복습이 필요합니다.')
  }

  if (analysis.totalHours < 5) {
    warnings.push('⚠️ 학습 시간이 부족합니다. 목표 달성을 위해 더 많은 시간이 필요합니다.')
  }

  if ((sessionData.concentration ?? 3) <= 2 && (sessionData.understanding ?? 3) <= 2) {
    warnings.push('⚠️ 오늘은 컨디션이 좋지 않은 것 같습니다. 가벼운 복습을 추천합니다.')
  }

  return warnings.length > 0 ? warnings[0] : null
}

/**
 * 실시간 피드백 생성
 */
export function generateRealTimeFeedback(fieldName: string, value: number | string): string[] {
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
        if (level.percentile <= 15) {
          feedback.push('😴 충분한 휴식이 필요해보입니다')
        } else if (level.percentile >= 80) {
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
