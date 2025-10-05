// 합격률 예측을 위한 데이터 수집 시스템
import type { StudySession, Reflection, AuthUser, UserData } from '@/types'

/** 학습 일관성 데이터 */
interface LearningConsistency {
  uniqueStudyDays: number
  maxConsecutiveDays: number
  averageSessionsPerDay: number
}

/** 평균 메트릭 */
interface AverageMetrics {
  concentration: number
  understanding: number
  fatigue: number
}

/** 주간 패턴 */
interface WeeklyPattern {
  dayOfWeekHours: number[]  // 일요일(0) ~ 토요일(6)
  weekendVsWeekday: {
    weekend: number
    weekday: number
  }
}

/** 학습 패턴 데이터 */
interface LearningPatternData {
  userId: string  // 익명 해시
  timestamp: string
  totalStudyHours: number
  studyTypeDistribution: Record<string, number>
  learningConsistency: LearningConsistency
  averageMetrics: AverageMetrics
  weeklyPattern: WeeklyPattern
  totalSessions: number
  studyPeriodDays: number
}

/** 점수 기록 */
interface ScoreRecord {
  score: number
  date: string
}

/** 점수 향상 데이터 */
interface ScoreImprovement {
  absolute: number
  percentage: number
  averagePerTest: number
}

/** 진행 속도 */
interface ProgressVelocity {
  dailyVelocity: number
  estimatedDaysToTarget: number
}

/** 과목별 점수 진행 */
interface SubjectScoreProgress {
  subjectName: string
  examType: string
  targetScore: number | string
  currentScore: number
  scoreHistory: ScoreRecord[]
  scoreImprovement: ScoreImprovement
  scoreStability: number
  daysToExam: number | null
  progressVelocity: ProgressVelocity
}

/** 점수 진행 데이터 */
interface ScoreProgressData {
  userId: string
  timestamp: string
  subjects: Record<string, SubjectScoreProgress>
}

/** 개인 과목 정보 */
interface PersonalSubjectInfo {
  examType: string
  targetScore: number | string
  targetHours: number
}

/** 개인 특성 데이터 */
interface PersonalCharacteristicsData {
  userId: string
  timestamp: string
  occupation: string
  dailyStudyHours: number
  reflectionParticipation: number
  reflectionFrequency: number
  accountAge: number
  subjects: PersonalSubjectInfo[]
}

/** 예측 특성 */
interface PredictionFeatures {
  totalHours: number
  avgConcentration: number
  avgUnderstanding: number
  avgFatigue: number
  studyConsistency: number
  sessionFrequency: number
  dailyStudyCapacity: number
  accountAge: number
  reflectionEngagement: number
  scoreImprovement: number
  scoreStability: number
  progressVelocity: number
  daysToExam: number
}

/** 종합 예측 데이터 */
interface PredictionData {
  userId: string
  timestamp: string
  learningPattern: LearningPatternData
  scoreProgress: ScoreProgressData
  personalCharacteristics: PersonalCharacteristicsData
  features: PredictionFeatures
}

/** 전체 수집 데이터 */
interface CollectedData {
  learningPatterns: LearningPatternData[]
  scoreProgress: ScoreProgressData[]
  personalCharacteristics: PersonalCharacteristicsData[]
  predictions: PredictionData[]
}

export class SuccessRateDataCollector {
  // private dataPoints: Record<string, unknown> = {}  // 현재 미사용

  /** 사용자 ID 익명화 */
  private anonymizeUserId(userId: number): string {
    // 간단한 해시 함수 (실제로는 더 강력한 해시 필요)
    return `user_${userId.toString(36)}`
  }

  /** 학습 패턴 데이터 수집 */
  collectLearningPatternData(studyData: UserData, userId: number): LearningPatternData {
    const sessions = studyData.sessions || []

    const totalStudyHours = sessions.reduce((sum, session) => sum + (session.duration || 0), 0)

    const studyTypeDistribution = sessions.reduce<Record<string, number>>((acc, session) => {
      if (session.studyType) {
        acc[session.studyType] = (acc[session.studyType] || 0) + (session.duration || 0)
      }
      return acc
    }, {})

    const learningConsistency = this.calculateLearningConsistency(sessions)
    const avgMetrics = this.calculateAverageMetrics(sessions)
    const weeklyPattern = this.analyzeWeeklyPattern(sessions)

    const learningPatternData: LearningPatternData = {
      userId: this.anonymizeUserId(userId),
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

  /** 점수 진행 데이터 수집 */
  collectScoreProgressData(studyData: UserData, userId: number): ScoreProgressData {
    const subjects = studyData.subjects || {}
    const scoreProgressData: Record<string, SubjectScoreProgress> = {}

    Object.entries(subjects).forEach(([subjectId, subject]) => {
      const scores = subject.scores || []
      if (scores.length === 0) return

      const sortedScores = [...scores].sort((a, b) =>
        new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
      )
      const actualScores = sortedScores.filter(s => s.actualScore !== null)

      if (actualScores.length > 0) {
        scoreProgressData[subjectId] = {
          subjectName: subject.name,
          examType: subject.examType,
          targetScore: subject.targetScore,
          currentScore: actualScores[actualScores.length - 1].actualScore!,
          scoreHistory: actualScores.map(s => ({
            score: s.actualScore!,
            date: s.testDate
          })),
          scoreImprovement: this.calculateScoreImprovement(actualScores),
          scoreStability: this.calculateScoreStability(actualScores),
          daysToExam: this.calculateDaysToExam(subject.examDate),
          progressVelocity: this.calculateProgressVelocity(actualScores, subject.targetScore)
        }
      }
    })

    const progressData: ScoreProgressData = {
      userId: this.anonymizeUserId(userId),
      timestamp: new Date().toISOString(),
      subjects: scoreProgressData
    }

    this.saveScoreProgressData(progressData)
    return progressData
  }

  /** 개인 특성 데이터 수집 */
  collectPersonalCharacteristicsData(studyData: UserData, currentUser: AuthUser): PersonalCharacteristicsData {
    const reflections = studyData.reflections || []

    const personalData: PersonalCharacteristicsData = {
      userId: this.anonymizeUserId(currentUser.id),
      timestamp: new Date().toISOString(),
      occupation: 'unknown',  // UserProfile에서 가져와야 함
      dailyStudyHours: 0,     // UserProfile에서 가져와야 함
      reflectionParticipation: reflections.length,
      reflectionFrequency: this.calculateReflectionFrequency(reflections),
      accountAge: this.calculateAccountAge(currentUser.createdAt),
      subjects: Object.values(studyData.subjects || {}).map(subject => ({
        examType: subject.examType,
        targetScore: subject.targetScore,
        targetHours: subject.targetHours
      }))
    }

    this.savePersonalCharacteristicsData(personalData)
    return personalData
  }

  /** 종합 성공률 예측 데이터 생성 */
  generateSuccessRatePredictionData(studyData: UserData, currentUser: AuthUser): PredictionData {
    const learningPattern = this.collectLearningPatternData(studyData, currentUser.id)
    const scoreProgress = this.collectScoreProgressData(studyData, currentUser.id)
    const personalCharacteristics = this.collectPersonalCharacteristicsData(studyData, currentUser)

    const predictionData: PredictionData = {
      userId: this.anonymizeUserId(currentUser.id),
      timestamp: new Date().toISOString(),
      learningPattern,
      scoreProgress,
      personalCharacteristics,
      features: this.extractFeatures(learningPattern, scoreProgress, personalCharacteristics)
    }

    this.savePredictionData(predictionData)
    return predictionData
  }

  // 헬퍼 함수들

  private calculateLearningConsistency(sessions: StudySession[]): LearningConsistency {
    if (sessions.length === 0) {
      return { uniqueStudyDays: 0, maxConsecutiveDays: 0, averageSessionsPerDay: 0 }
    }

    const dates = [...new Set(sessions.map(s => s.date))].sort()
    if (dates.length < 2) {
      return { uniqueStudyDays: dates.length, maxConsecutiveDays: 1, averageSessionsPerDay: sessions.length }
    }

    let maxConsecutiveDays = 0
    let currentStreak = 1

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1])
      const currDate = new Date(dates[i])
      const dayDiff = (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)

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

  private calculateAverageMetrics(sessions: StudySession[]): AverageMetrics {
    if (sessions.length === 0) {
      return { concentration: 0, understanding: 0, fatigue: 0 }
    }

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

  private analyzeWeeklyPattern(sessions: StudySession[]): WeeklyPattern {
    const dayOfWeekHours = [0, 0, 0, 0, 0, 0, 0]

    sessions.forEach(session => {
      const dayOfWeek = new Date(session.date).getDay()
      dayOfWeekHours[dayOfWeek] += session.duration || 0
    })

    return {
      dayOfWeekHours,
      weekendVsWeekday: {
        weekend: dayOfWeekHours[0] + dayOfWeekHours[6],
        weekday: dayOfWeekHours.slice(1, 6).reduce((sum, hours) => sum + hours, 0)
      }
    }
  }

  private calculateStudyPeriodDays(sessions: StudySession[]): number {
    if (sessions.length === 0) return 0

    const dates = sessions.map(s => new Date(s.date))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))

    return Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
  }

  private calculateScoreImprovement(scores: Array<{ actualScore: number | null }>): ScoreImprovement {
    if (scores.length < 2) {
      return { absolute: 0, percentage: 0, averagePerTest: 0 }
    }

    const first = scores[0].actualScore || 0
    const last = scores[scores.length - 1].actualScore || 0

    return {
      absolute: last - first,
      percentage: first !== 0 ? ((last - first) / first) * 100 : 0,
      averagePerTest: (last - first) / (scores.length - 1)
    }
  }

  private calculateScoreStability(scores: Array<{ actualScore: number | null }>): number {
    if (scores.length < 2) return 0

    const scoreValues = scores.map(s => s.actualScore || 0)
    const mean = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length
    const variance = scoreValues.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scoreValues.length

    return Math.sqrt(variance)
  }

  private calculateDaysToExam(examDate: string): number | null {
    if (!examDate) return null

    const today = new Date()
    const exam = new Date(examDate)
    return Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  private calculateProgressVelocity(
    scores: Array<{ actualScore: number | null; testDate: string }>,
    targetScore: number | string
  ): ProgressVelocity {
    if (scores.length < 2) {
      return { dailyVelocity: 0, estimatedDaysToTarget: 0 }
    }

    const firstScore = scores[0].actualScore || 0
    const lastScore = scores[scores.length - 1].actualScore || 0
    const firstDate = new Date(scores[0].testDate)
    const lastDate = new Date(scores[scores.length - 1].testDate)

    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    const scoreImprovement = lastScore - firstScore

    if (daysDiff === 0) {
      return { dailyVelocity: 0, estimatedDaysToTarget: 0 }
    }

    const dailyVelocity = scoreImprovement / daysDiff
    const numericTarget = typeof targetScore === 'number' ? targetScore : 0
    const remainingScore = numericTarget - lastScore

    return {
      dailyVelocity,
      estimatedDaysToTarget: remainingScore > 0 && dailyVelocity > 0 ? remainingScore / dailyVelocity : 0
    }
  }

  private calculateReflectionFrequency(reflections: Reflection[]): number {
    if (reflections.length === 0) return 0

    const dates = reflections.map(r => new Date(r.date))
    const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
    const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
    const daysDiff = (maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24) + 1

    return reflections.length / daysDiff
  }

  private calculateAccountAge(createdAt: string): number {
    const created = new Date(createdAt)
    const now = new Date()
    return (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
  }

  private extractFeatures(
    learningPattern: LearningPatternData,
    scoreProgress: ScoreProgressData,
    personalCharacteristics: PersonalCharacteristicsData
  ): PredictionFeatures {
    const features: PredictionFeatures = {
      totalHours: learningPattern.totalStudyHours,
      avgConcentration: learningPattern.averageMetrics.concentration,
      avgUnderstanding: learningPattern.averageMetrics.understanding,
      avgFatigue: learningPattern.averageMetrics.fatigue,
      studyConsistency: learningPattern.learningConsistency.maxConsecutiveDays,
      sessionFrequency: learningPattern.totalSessions / learningPattern.studyPeriodDays,
      dailyStudyCapacity: personalCharacteristics.dailyStudyHours,
      accountAge: personalCharacteristics.accountAge,
      reflectionEngagement: personalCharacteristics.reflectionFrequency,
      scoreImprovement: 0,
      scoreStability: 0,
      progressVelocity: 0,
      daysToExam: 0
    }

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

  private saveLearningPatternData(data: LearningPatternData): void {
    const existingData = JSON.parse(localStorage.getItem('lighthouse-learning-pattern-data') || '[]') as LearningPatternData[]
    existingData.push(data)
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100)
    }
    localStorage.setItem('lighthouse-learning-pattern-data', JSON.stringify(existingData))
  }

  private saveScoreProgressData(data: ScoreProgressData): void {
    const existingData = JSON.parse(localStorage.getItem('lighthouse-score-progress-data') || '[]') as ScoreProgressData[]
    existingData.push(data)
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100)
    }
    localStorage.setItem('lighthouse-score-progress-data', JSON.stringify(existingData))
  }

  private savePersonalCharacteristicsData(data: PersonalCharacteristicsData): void {
    const existingData = JSON.parse(localStorage.getItem('lighthouse-personal-characteristics-data') || '[]') as PersonalCharacteristicsData[]
    existingData.push(data)
    if (existingData.length > 100) {
      existingData.splice(0, existingData.length - 100)
    }
    localStorage.setItem('lighthouse-personal-characteristics-data', JSON.stringify(existingData))
  }

  private savePredictionData(data: PredictionData): void {
    const existingData = JSON.parse(localStorage.getItem('lighthouse-prediction-data') || '[]') as PredictionData[]
    existingData.push(data)
    if (existingData.length > 50) {
      existingData.splice(0, existingData.length - 50)
    }
    localStorage.setItem('lighthouse-prediction-data', JSON.stringify(existingData))
  }

  /** 데이터 내보내기 */
  exportAllCollectedData(): CollectedData {
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
export function collectDataPeriodically(studyData: UserData, currentUser: AuthUser | null): PredictionData | undefined {
  if (!currentUser) return undefined
  return successRateDataCollector.generateSuccessRatePredictionData(studyData, currentUser)
}
