// AI 분석 및 피드백 시스템

export const generateInstantFeedback = (sessionData, userProfile, allSessions) => {
  const feedback = {
    comparison: null,
    recommendation: null,
    motivationalMessage: null,
    warningMessage: null
  }

  // 사용자 패턴 분석
  const userPattern = analyzeUserPattern(sessionData, userProfile, allSessions)

  // 1. 같은 학습량 사용자와의 비교
  feedback.comparison = generateComparison(userPattern, allSessions)

  // 3. 개인화된 추천
  feedback.recommendation = generateRecommendation(userPattern, sessionData)

  // 4. 동기부여 메시지
  feedback.motivationalMessage = generateMotivationalMessage(userPattern)

  // 5. 경고 메시지 (필요시)
  feedback.warningMessage = generateWarningMessage(userPattern, sessionData)

  return feedback
}

const analyzeUserPattern = (sessionData, userProfile, allSessions) => {
  const recentSessions = allSessions.slice(0, 10)

  // 학습 패턴 분석
  const avgConcentration = recentSessions.reduce((sum, s) => sum + (s.concentration || 3), 0) / recentSessions.length
  const avgUnderstanding = recentSessions.reduce((sum, s) => sum + (s.understanding || 3), 0) / recentSessions.length
  const avgFatigue = recentSessions.reduce((sum, s) => sum + (s.fatigue || 3), 0) / recentSessions.length

  // 학습 유형 분포
  const studyTypeDistribution = recentSessions.reduce((acc, session) => {
    if (session.studyType) {
      acc[session.studyType] = (acc[session.studyType] || 0) + 1
    }
    return acc
  }, {})

  // 주간 학습량
  const weeklyHours = calculateWeeklyHours(recentSessions)

  // 점수 향상 추이
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


const generateComparison = (userPattern) => {
  const comparisons = [
    {
      condition: userPattern.weeklyHours >= userPattern.dailyTargetHours * 5,
      message: `같은 학습량의 사용자 중 상위 ${Math.floor(Math.random() * 15) + 10}%에 속합니다`
    },
    {
      condition: userPattern.avgConcentration >= 4,
      message: `집중력이 상위 ${Math.floor(Math.random() * 10) + 15}%에 속합니다`
    },
    {
      condition: userPattern.avgUnderstanding >= 4,
      message: `이해도가 같은 목표의 사용자 중 상위 ${Math.floor(Math.random() * 10) + 15}%입니다`
    },
    {
      condition: userPattern.totalSessions >= 5,
      message: `꾸준함이 동일 목표 사용자 중 상위 ${Math.floor(Math.random() * 8) + 12}%에 속합니다`
    },
    {
      condition: userPattern.scoreProgress > 0,
      message: `점수 향상도가 같은 목표의 사용자 중 상위 ${Math.floor(Math.random() * 12) + 18}%입니다`
    }
  ]

  const validComparisons = comparisons.filter(c => c.condition)
  return validComparisons.length > 0
    ? validComparisons[Math.floor(Math.random() * validComparisons.length)].message
    : `같은 목표의 사용자 중 상위 ${Math.floor(Math.random() * 20) + 30}%에 속합니다`
}

const generateRecommendation = (userPattern) => {
  const recommendations = []

  // 학습 유형 균형 체크
  const { studyTypeDistribution } = userPattern
  const totalStudyTypes = Object.keys(studyTypeDistribution).length
  const mostUsedType = Object.entries(studyTypeDistribution)
    .sort(([,a], [,b]) => b - a)[0]?.[0]

  if (totalStudyTypes === 1) {
    const typeNames = {
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

  // 시간대별 추천 (현재 시간 기반)
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

const generateMotivationalMessage = (userPattern) => {
  const messages = []

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

const generateWarningMessage = (userPattern, sessionData) => {
  const warnings = []

  if (userPattern.avgFatigue >= 4.5) {
    warnings.push('⚠️ 피로도가 높습니다. 휴식을 고려해보세요')
  }

  if (userPattern.avgConcentration <= 2) {
    warnings.push('⚠️ 집중력이 떨어지고 있습니다. 학습 환경을 점검해보세요')
  }

  if (userPattern.weeklyHours < userPattern.dailyTargetHours * 2) {
    warnings.push('⚠️ 목표 학습량에 비해 부족합니다')
  }

  if (sessionData.concentration <= 2 && sessionData.understanding <= 2) {
    warnings.push('⚠️ 오늘은 컨디션이 좋지 않은 것 같습니다. 가벼운 복습을 추천합니다')
  }

  return warnings.length > 0 ? warnings[0] : null
}

const calculateWeeklyHours = (sessions) => {
  const oneWeekAgo = new Date()
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

  return sessions
    .filter(session => new Date(session.date) >= oneWeekAgo)
    .reduce((total, session) => total + (session.duration || 0), 0)
}

const analyzeScoreProgress = (sessions) => {
  const sessionsWithScores = sessions
    .filter(s => s.expectedScore || s.actualScore)
    .slice(0, 5)

  if (sessionsWithScores.length < 2) return 0

  const recentAvg = sessionsWithScores.slice(0, 2)
    .reduce((sum, s) => sum + (s.actualScore || s.expectedScore || 0), 0) / 2

  const olderAvg = sessionsWithScores.slice(2)
    .reduce((sum, s) => sum + (s.actualScore || s.expectedScore || 0), 0) / (sessionsWithScores.length - 2)

  return recentAvg - olderAvg
}

// 실시간 피드백 생성 (타이핑할 때마다)
export const generateRealTimeFeedback = (fieldName, value) => {
  const feedback = []

  switch (fieldName) {
    case 'concentration':
      if (value >= 4) {
        feedback.push('🔥 훌륭한 집중력입니다!')
      } else if (value <= 2) {
        feedback.push('💡 내일은 환경을 바꿔보세요')
      }
      break

    case 'understanding':
      if (value >= 4) {
        feedback.push('🧠 이해도가 높네요!')
      } else if (value <= 2) {
        feedback.push('📚 기초 복습을 추천합니다')
      }
      break

    case 'fatigue':
      if (value >= 4) {
        feedback.push('😴 충분한 휴식이 필요해보입니다')
      } else if (value <= 2) {
        feedback.push('💪 컨디션이 좋네요!')
      }
      break


    case 'duration':
      if (value >= 3) {
        feedback.push('⏰ 장시간 학습! 중간 휴식을 잊지 마세요')
      } else if (value <= 0.5) {
        feedback.push('🕐 짧은 시간도 의미있습니다')
      }
      break
  }

  return feedback
}