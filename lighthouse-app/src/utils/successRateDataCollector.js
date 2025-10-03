// 합격률 예측을 위한 데이터 수집 시스템
// 이 파일은 현재 임시로 비활성화된 합격률 예측 기능을 위해
// 필요한 데이터를 수집하고 분석하는 유틸리티입니다.

/**
 * 합격률 예측에 필요한 데이터 포인트들:
 *
 * 1. 학습 패턴 데이터
 *    - 총 학습 시간
 *    - 학습 유형별 분포 (개념, 문제풀이, 암기, 복습)
 *    - 학습 일관성 (연속 학습 일수, 주간 학습 패턴)
 *    - 평균 집중도, 이해도, 피로도
 *
 * 2. 점수 진행 데이터
 *    - 모의고사 점수 증분
 *    - 목표 점수 대비 현재 점수
 *    - 점수 향상 속도
 *    - 점수 변동성 (안정성)
 *
 * 3. 시험 관련 데이터
 *    - 시험 유형 (TOEIC, TOEFL, 공무원 등)
 *    - D-day까지 남은 시간
 *    - 목표 점수 난이도
 *
 * 4. 개인 특성 데이터
 *    - 직업 (학생, 직장인, 전업 수험생)
 *    - 하루 가능 학습 시간
 *    - 성찰 활동 참여도
 *
 * 5. 외부 벤치마크 데이터 (추후 수집)
 *    - 시험별 평균 합격률
 *    - 학습 시간대별 합격률
 *    - 점수대별 합격률
 */

export class SuccessRateDataCollector {
  constructor() {
    this.dataPoints = {}
  }

  /**
   * 사용자의 현재 학습 패턴을 분석하여 데이터 포인트 수집
   */
  collectLearningPatternData(studyData, userId) {
    const sessions = studyData.sessions || []

    // 총 학습 시간 계산
    const totalStudyHours = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)

    // 학습 유형별 분포
    const studyTypeDistribution = sessions.reduce((acc, session) => {
      if (session.studyType) {
        acc[session.studyType] = (acc[session.studyType] || 0) + (session.duration || 0)
      }
      return acc
    }, {})

    // 학습 일관성 계산
    const learningConsistency = this.calculateLearningConsistency(sessions)

    // 평균 학습 상태
    const avgMetrics = this.calculateAverageMetrics(sessions)

    // 주간 학습 패턴
    const weeklyPattern = this.analyzeWeeklyPattern(sessions)

    const learningPatternData = {
      userId,
      timestamp: new Date().toISOString(),
      totalStudyHours,
      studyTypeDistribution,
      learningConsistency,
      averageMetrics: avgMetrics,
      weeklyPattern,
      totalSessions: sessions.length,
      studyPeriodDays: this.calculateStudyPeriodDays(sessions)
    }

    this.saveLearningPatternData(learningPatternData)
    return learningPatternData
  }

  /**
   * 점수 진행 데이터 수집
   */
  collectScoreProgressData(studyData, userId) {
    const subjects = studyData.subjects || {}
    const scoreProgressData = {}

    Object.entries(subjects).forEach(([subjectId, subject]) => {
      const scores = subject.scores || []
      if (scores.length === 0) return

      const sortedScores = scores.sort((a, b) => new Date(a.testDate) - new Date(b.testDate))
      const actualScores = sortedScores.filter(s => s.actualScore)

      if (actualScores.length > 0) {
        scoreProgressData[subjectId] = {
          subjectName: subject.name,
          examType: subject.examType,
          targetScore: subject.targetScore,
          currentScore: actualScores[actualScores.length - 1].actualScore,
          scoreHistory: actualScores.map(s => ({
            score: s.actualScore,
            date: s.testDate
          })),
          scoreImprovement: this.calculateScoreImprovement(actualScores),
          scoreStability: this.calculateScoreStability(actualScores),
          daysToExam: this.calculateDaysToExam(subject.examDate),
          progressVelocity: this.calculateProgressVelocity(actualScores, subject.targetScore)
        }
      }
    })

    const progressData = {
      userId,
      timestamp: new Date().toISOString(),
      subjects: scoreProgressData
    }

    this.saveScoreProgressData(progressData)
    return progressData
  }

  /**
   * 개인 특성 데이터 수집
   */
  collectPersonalCharacteristicsData(studyData, currentUser) {
    const globalSettings = studyData.globalSettings || {}
    const reflections = studyData.reflections || []

    const personalData = {
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
      occupation: globalSettings.occupation || 'unknown',
      dailyStudyHours: globalSettings.dailyStudyHours || 0,
      reflectionParticipation: reflections.length,
      reflectionFrequency: this.calculateReflectionFrequency(reflections),
      accountAge: this.calculateAccountAge(currentUser.createdAt),
      subjects: Object.keys(studyData.subjects || {}).map(id => ({
        examType: studyData.subjects[id].examType,
        targetScore: studyData.subjects[id].targetScore,
        targetHours: studyData.subjects[id].targetHours
      }))
    }

    this.savePersonalCharacteristicsData(personalData)
    return personalData
  }

  /**
   * 종합 성공률 예측 데이터 생성
   */
  generateSuccessRatePredictionData(studyData, currentUser) {
    const learningPattern = this.collectLearningPatternData(studyData, currentUser.id)
    const scoreProgress = this.collectScoreProgressData(studyData, currentUser.id)
    const personalCharacteristics = this.collectPersonalCharacteristicsData(studyData, currentUser)

    const predictionData = {
      userId: currentUser.id,
      timestamp: new Date().toISOString(),
      learningPattern,
      scoreProgress,
      personalCharacteristics,
      // 추후 머신러닝 모델에서 사용할 특성들
      features: this.extractFeatures(learningPattern, scoreProgress, personalCharacteristics)
    }

    this.savePredictionData(predictionData)
    return predictionData
  }

  // 헬퍼 함수들
  calculateLearningConsistency(sessions) {
    if (sessions.length === 0) return 0

    const dates = [...new Set(sessions.map(s => s.date))].sort()
    if (dates.length < 2) return 0

    // 연속 학습 일수 계산
    let maxConsecutiveDays = 0
    let currentStreak = 1

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1])
      const currDate = new Date(dates[i])
      const dayDiff = (currDate - prevDate) / (1000 * 60 * 60 * 24)

      if (dayDiff === 1) {
        currentStreak++
      } else {
        maxConsecutiveDays = Math.max(maxConsecutiveDays, currentStreak)
        currentStreak = 1
      }
    }
    maxConsecutiveDays = Math.max(maxConsecutiveDays, currentStreak)

    return {
      uniqueStudyDays: dates.length,
      maxConsecutiveDays,
      averageSessionsPerDay: sessions.length / dates.length
    }
  }

  calculateAverageMetrics(sessions) {
    if (sessions.length === 0) return { concentration: 0, understanding: 0, fatigue: 0 }

    const totals = sessions.reduce((acc, session) => {
      acc.concentration += session.concentration || 0
      acc.understanding += session.understanding || 0
      acc.fatigue += session.fatigue || 0
      return acc
    }, { concentration: 0, understanding: 0, fatigue: 0 })

    return {
      concentration: totals.concentration / sessions.length,
      understanding: totals.understanding / sessions.length,
      fatigue: totals.fatigue / sessions.length
    }
  }

  analyzeWeeklyPattern(sessions) {
    const dayOfWeekHours = [0, 0, 0, 0, 0, 0, 0] // 일요일부터 토요일

    sessions.forEach(session => {
      const dayOfWeek = new Date(session.date).getDay()
      dayOfWeekHours[dayOfWeek] += session.duration || 0
    })

    return {
      dayOfWeekHours,
      weekendVsWeekday: {
        weekend: dayOfWeekHours[0] + dayOfWeekHours[6], // 일, 토
        weekday: dayOfWeekHours.slice(1, 6).reduce((sum, hours) => sum + hours, 0)
      }
    }
  }

  calculateStudyPeriodDays(sessions) {
    if (sessions.length === 0) return 0

    const dates = sessions.map(s => new Date(s.date))
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))

    return Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1
  }

  calculateScoreImprovement(scores) {
    if (scores.length < 2) return 0

    const first = scores[0].actualScore
    const last = scores[scores.length - 1].actualScore

    return {
      absolute: last - first,
      percentage: ((last - first) / first) * 100,
      averagePerTest: (last - first) / (scores.length - 1)
    }
  }

  calculateScoreStability(scores) {
    if (scores.length < 2) return 0

    const scoreValues = scores.map(s => s.actualScore)
    const mean = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
    const variance = scoreValues.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scoreValues.length

    return Math.sqrt(variance) // 표준편차
  }

  calculateDaysToExam(examDate) {
    if (!examDate) return null

    const today = new Date()
    const exam = new Date(examDate)
    return Math.ceil((exam - today) / (1000 * 60 * 60 * 24))
  }

  calculateProgressVelocity(scores, targetScore) {
    if (scores.length < 2) return 0

    const firstScore = scores[0].actualScore
    const lastScore = scores[scores.length - 1].actualScore
    const firstDate = new Date(scores[0].testDate)
    const lastDate = new Date(scores[scores.length - 1].testDate)

    const daysDiff = (lastDate - firstDate) / (1000 * 60 * 60 * 24)
    const scoreImprovement = lastScore - firstScore

    if (daysDiff === 0) return 0

    const dailyVelocity = scoreImprovement / daysDiff
    const remainingScore = targetScore - lastScore

    return {
      dailyVelocity,
      estimatedDaysToTarget: remainingScore > 0 ? remainingScore / dailyVelocity : 0
    }
  }

  calculateReflectionFrequency(reflections) {
    if (reflections.length === 0) return 0

    const dates = reflections.map(r => new Date(r.date))
    const minDate = new Date(Math.min(...dates))
    const maxDate = new Date(Math.max(...dates))
    const daysDiff = (maxDate - minDate) / (1000 * 60 * 60 * 24) + 1

    return reflections.length / daysDiff // 일평균 성찰 횟수
  }

  calculateAccountAge(createdAt) {
    const created = new Date(createdAt)
    const now = new Date()
    return (now - created) / (1000 * 60 * 60 * 24) // 일 단위
  }

  extractFeatures(learningPattern, scoreProgress, personalCharacteristics) {
    // 머신러닝 모델에서 사용할 수치형 특성들 추출
    const features = {
      // 학습 패턴 특성
      totalHours: learningPattern.totalStudyHours,
      avgConcentration: learningPattern.averageMetrics.concentration,
      avgUnderstanding: learningPattern.averageMetrics.understanding,
      avgFatigue: learningPattern.averageMetrics.fatigue,
      studyConsistency: learningPattern.learningConsistency.maxConsecutiveDays,
      sessionFrequency: learningPattern.totalSessions / learningPattern.studyPeriodDays,

      // 개인 특성
      dailyStudyCapacity: personalCharacteristics.dailyStudyHours,
      accountAge: personalCharacteristics.accountAge,
      reflectionEngagement: personalCharacteristics.reflectionFrequency,

      // 점수 관련 특성 (주 과목 기준)
      scoreImprovement: 0,
      scoreStability: 0,
      progressVelocity: 0,
      daysToExam: 0
    }

    // 주 과목의 점수 데이터 추가
    const subjectKeys = Object.keys(scoreProgress.subjects)
    if (subjectKeys.length > 0) {
      const mainSubject = scoreProgress.subjects[subjectKeys[0]]
      features.scoreImprovement = mainSubject.scoreImprovement?.percentage || 0
      features.scoreStability = mainSubject.scoreStability || 0
      features.progressVelocity = mainSubject.progressVelocity?.dailyVelocity || 0
      features.daysToExam = mainSubject.daysToExam || 0
    }

    return features
  }

  // 데이터 저장 함수들
  saveLearningPatternData(data) {
    const existingData = JSON.parse(localStorage.getItem('lighthouse-learning-pattern-data') || '[]')
    existingData.push(data)
    // 최대 100개 기록만 유지
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100)
    }
    localStorage.setItem('lighthouse-learning-pattern-data', JSON.stringify(existingData))
  }

  saveScoreProgressData(data) {
    const existingData = JSON.parse(localStorage.getItem('lighthouse-score-progress-data') || '[]')
    existingData.push(data)
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100)
    }
    localStorage.setItem('lighthouse-score-progress-data', JSON.stringify(existingData))
  }

  savePersonalCharacteristicsData(data) {
    const existingData = JSON.parse(localStorage.getItem('lighthouse-personal-characteristics-data') || '[]')
    existingData.push(data)
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100)
    }
    localStorage.setItem('lighthouse-personal-characteristics-data', JSON.stringify(existingData))
  }

  savePredictionData(data) {
    const existingData = JSON.parse(localStorage.getItem('lighthouse-prediction-data') || '[]')
    existingData.push(data)
    if (existingData.length > 50) {
      existingData.splice(0, existingData.length - 50)
    }
    localStorage.setItem('lighthouse-prediction-data', JSON.stringify(existingData))
  }

  // 데이터 내보내기 (추후 서버로 전송하거나 분석용)
  exportAllCollectedData() {
    return {
      learningPatterns: JSON.parse(localStorage.getItem('lighthouse-learning-pattern-data') || '[]'),
      scoreProgress: JSON.parse(localStorage.getItem('lighthouse-score-progress-data') || '[]'),
      personalCharacteristics: JSON.parse(localStorage.getItem('lighthouse-personal-characteristics-data') || '[]'),
      predictions: JSON.parse(localStorage.getItem('lighthouse-prediction-data') || '[]')
    }
  }
}

// 전역 인스턴스
export const successRateDataCollector = new SuccessRateDataCollector()

// 주기적 데이터 수집을 위한 헬퍼 함수
export const collectDataPeriodically = (studyData, currentUser) => {
  if (!currentUser) return

  return successRateDataCollector.generateSuccessRatePredictionData(studyData, currentUser)
}