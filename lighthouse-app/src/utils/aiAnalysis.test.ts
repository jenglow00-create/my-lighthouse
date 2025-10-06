import { describe, it, expect } from 'vitest'
import {
  analyzeWeeklyPattern,
  analyzeConcentration,
  analyzeProgress,
  analyzeReflection,
  generateInstantFeedback,
  generateRealTimeFeedback
} from './aiAnalysis'
import { mockSessions, mockReflections, mockSubjects } from '@/test/mockData'
import type { StudySession } from '@/types/study'

describe('aiAnalysis', () => {
  describe('analyzeWeeklyPattern', () => {
    it('should return zero stats for empty sessions', () => {
      // Arrange
      const sessions: StudySession[] = []

      // Act
      const result = analyzeWeeklyPattern(sessions)

      // Assert
      expect(result.totalHours).toBe(0)
      expect(result.sessionCount).toBe(0)
      expect(result.feedback.message).toContain('아직 학습 데이터가 없습니다')
      expect(result.feedback.percentile).toBe(0)
      expect(result.feedback.evidence.metric).toBe('주간 학습 시간')
    })

    it('should analyze low hours (하위 20%)', () => {
      // Arrange
      const sessions = mockSessions.lowHours

      // Act
      const result = analyzeWeeklyPattern(sessions)

      // Assert
      expect(result.totalHours).toBe(2.5)
      expect(result.sessionCount).toBe(2)
      expect(result.feedback.percentile).toBeLessThanOrEqual(20)
      expect(result.feedback.evidence.value).toBe(2.5)
      expect(result.feedback.evidence.unit).toBe('시간')
      expect(result.feedback.recommendations).toBeDefined()
      expect(result.feedback.recommendations.length).toBeGreaterThan(0)
    })

    it('should analyze average hours (평균 수준)', () => {
      // Arrange
      const sessions = mockSessions.averageHours

      // Act
      const result = analyzeWeeklyPattern(sessions)

      // Assert
      expect(result.totalHours).toBeCloseTo(15, 1)
      expect(result.sessionCount).toBe(7)
      expect(result.feedback.percentile).toBeGreaterThanOrEqual(30)
      expect(result.feedback.percentile).toBeLessThanOrEqual(70)
      expect(result.feedback.evidence.benchmark).toContain('시간 구간')
      expect(result.feedback.evidence.source).toBeDefined()
    })

    it('should analyze high hours (상위 5%)', () => {
      // Arrange
      const sessions = mockSessions.highHours

      // Act
      const result = analyzeWeeklyPattern(sessions)

      // Assert
      expect(result.totalHours).toBeCloseTo(25, 1)
      expect(result.sessionCount).toBe(7)
      expect(result.feedback.percentile).toBeGreaterThanOrEqual(80)
      expect(result.feedback.label).toBeDefined()
    })

    it('should calculate daily sessions correctly', () => {
      // Arrange
      const sessions = [
        ...mockSessions.lowHours, // 2 sessions on 2 different days
        {
          ...mockSessions.lowHours[0],
          id: 3,
          date: '2025-10-01' // Same day as first session
        }
      ] as StudySession[]

      // Act
      const result = analyzeWeeklyPattern(sessions)

      // Assert
      expect(result.sessionCount).toBe(3)
      expect(result.dailySessions).toBeCloseTo(1.5, 1) // 3 sessions / 2 unique days
    })

    it('should provide feedback with evidence', () => {
      // Arrange
      const sessions = mockSessions.averageHours

      // Act
      const result = analyzeWeeklyPattern(sessions)

      // Assert
      expect(result.feedback).toHaveProperty('message')
      expect(result.feedback).toHaveProperty('percentile')
      expect(result.feedback).toHaveProperty('label')
      expect(result.feedback).toHaveProperty('evidence')
      expect(result.feedback).toHaveProperty('recommendations')
      expect(result.feedback.evidence).toHaveProperty('metric')
      expect(result.feedback.evidence).toHaveProperty('value')
      expect(result.feedback.evidence).toHaveProperty('unit')
      expect(result.feedback.evidence).toHaveProperty('benchmark')
      expect(result.feedback.evidence).toHaveProperty('source')
    })
  })

  describe('analyzeConcentration', () => {
    it('should return stable trend for empty sessions', () => {
      // Arrange
      const sessions: StudySession[] = []

      // Act
      const result = analyzeConcentration(sessions)

      // Assert
      expect(result.average).toBe(0)
      expect(result.trend).toBe('stable')
      expect(result.feedback.message).toContain('집중도 데이터가 부족')
    })

    it('should analyze high concentration', () => {
      // Arrange
      const sessions = mockSessions.highConcentration

      // Act
      const result = analyzeConcentration(sessions)

      // Assert
      expect(result.average).toBe(5)
      expect(result.feedback.percentile).toBeGreaterThan(70)
      expect(result.feedback.evidence.value).toBe(5)
    })

    it('should analyze low concentration', () => {
      // Arrange
      const sessions = mockSessions.lowConcentration

      // Act
      const result = analyzeConcentration(sessions)

      // Assert
      expect(result.average).toBe(2)
      expect(result.feedback.percentile).toBeLessThan(50)
      expect(result.feedback.recommendations).toBeDefined()
    })

    it('should detect improving trend', () => {
      // Arrange
      const sessions = [
        ...Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          subjectId: 'math',
          date: `2025-10-${String(i + 1).padStart(2, '0')}`,
          timestamp: `2025-10-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
          duration: 2,
          studyType: 'concept' as const,
          concentration: 5, // Recent: high
          understanding: 4,
          fatigue: 2,
          notes: ''
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: i + 6,
          subjectId: 'math',
          date: `2025-10-${String(i + 6).padStart(2, '0')}`,
          timestamp: `2025-10-${String(i + 6).padStart(2, '0')}T10:00:00Z`,
          duration: 2,
          studyType: 'concept' as const,
          concentration: 3, // Previous: low
          understanding: 3,
          fatigue: 3,
          notes: ''
        }))
      ]

      // Act
      const result = analyzeConcentration(sessions)

      // Assert
      expect(result.trend).toBe('improving')
      expect(result.feedback.recommendations.some(r => r.includes('좋아지고'))).toBe(true)
    })

    it('should detect declining trend', () => {
      // Arrange
      const sessions = [
        ...Array.from({ length: 5 }, (_, i) => ({
          id: i + 1,
          subjectId: 'math',
          date: `2025-10-${String(i + 1).padStart(2, '0')}`,
          timestamp: `2025-10-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
          duration: 2,
          studyType: 'concept' as const,
          concentration: 2, // Recent: low
          understanding: 3,
          fatigue: 4,
          notes: ''
        })),
        ...Array.from({ length: 5 }, (_, i) => ({
          id: i + 6,
          subjectId: 'math',
          date: `2025-10-${String(i + 6).padStart(2, '0')}`,
          timestamp: `2025-10-${String(i + 6).padStart(2, '0')}T10:00:00Z`,
          duration: 2,
          studyType: 'concept' as const,
          concentration: 5, // Previous: high
          understanding: 4,
          fatigue: 2,
          notes: ''
        }))
      ]

      // Act
      const result = analyzeConcentration(sessions)

      // Assert
      expect(result.trend).toBe('declining')
      expect(result.feedback.recommendations.some(r => r.includes('하락'))).toBe(true)
    })
  })

  describe('analyzeProgress', () => {
    it('should calculate daily required progress', () => {
      // Arrange
      const progressPercent = 50
      const daysUntilExam = 10

      // Act
      const result = analyzeProgress(progressPercent, daysUntilExam)

      // Assert
      expect(result.dailyRequiredProgress).toBe(5) // (100-50)/10
      expect(result.progressPercent).toBe(50)
      expect(result.daysUntilExam).toBe(10)
    })

    it('should set low urgency for high progress', () => {
      // Arrange
      const progressPercent = 90
      const daysUntilExam = 30

      // Act
      const result = analyzeProgress(progressPercent, daysUntilExam)

      // Assert
      expect(result.urgency).toBe('low')
      expect(result.message).toContain('거의 다 왔습니다')
    })

    it('should set high urgency for low progress', () => {
      // Arrange
      const progressPercent = 20
      const daysUntilExam = 10

      // Act
      const result = analyzeProgress(progressPercent, daysUntilExam)

      // Assert
      expect(result.urgency).toBe('high')
      expect(result.message).toContain('긴급')
    })

    it('should set medium urgency for mid progress', () => {
      // Arrange
      const progressPercent = 60
      const daysUntilExam = 20

      // Act
      const result = analyzeProgress(progressPercent, daysUntilExam)

      // Assert
      expect(result.urgency).toBe('medium')
    })

    it('should handle zero days until exam', () => {
      // Arrange
      const progressPercent = 80
      const daysUntilExam = 0

      // Act
      const result = analyzeProgress(progressPercent, daysUntilExam)

      // Assert
      expect(result.dailyRequiredProgress).toBe(0)
    })
  })

  describe('analyzeReflection', () => {
    it('should handle empty reflections array', () => {
      // Arrange
      const reflection = mockReflections.averageRating[0]
      const allReflections: any[] = []

      // Act
      const result = analyzeReflection(reflection, allReflections)

      // Assert
      expect(result.ranking).toBe('평가 불가')
      expect(result.comparison).toBe('비교 데이터 없음')
      expect(result.percentile).toBe(0)
    })

    it('should rank rating 5 as perfect understanding', () => {
      // Arrange
      const reflection = mockReflections.highRating.find(r => r.learningRating === 5)!
      const allReflections = mockReflections.averageRating

      // Act
      const result = analyzeReflection(reflection, allReflections)

      // Assert
      expect(result.ranking).toBe('완벽한 이해')
      expect(result.comparison).toContain('상위')
      expect(result.advice).toContain('완벽하게')
    })

    it('should rank rating 1 as insufficient', () => {
      // Arrange
      const reflection = mockReflections.lowRating.find(r => r.learningRating === 1)!
      const allReflections = mockReflections.averageRating

      // Act
      const result = analyzeReflection(reflection, allReflections)

      // Assert
      expect(result.ranking).toBe('미흡')
      expect(result.comparison).toContain('하위')
      expect(result.advice).toContain('처음부터')
    })

    it('should calculate percentile correctly', () => {
      // Arrange
      const reflection = { ...mockReflections.averageRating[0], learningRating: 3 }
      const allReflections = [
        ...mockReflections.lowRating.slice(0, 5), // 5 ratings of 1-2
        ...mockReflections.averageRating.slice(0, 5) // 5 ratings of 3
      ]

      // Act
      const result = analyzeReflection(reflection, allReflections)

      // Assert
      // 50% have rating 3 or higher (5 out of 10)
      expect(result.percentile).toBe(50)
    })
  })

  describe('generateInstantFeedback', () => {
    it('should generate feedback from session data', () => {
      // Arrange
      const sessionData = {
        duration: 2,
        concentration: 4,
        understanding: 4,
        fatigue: 2
      }
      const allSessions = mockSessions.averageHours

      // Act
      const result = generateInstantFeedback(sessionData, {}, allSessions)

      // Assert
      expect(result).toHaveProperty('comparison')
      expect(result).toHaveProperty('recommendation')
      expect(result).toHaveProperty('motivationalMessage')
      expect(result).toHaveProperty('warningMessage')
    })

    it('should include warning for high fatigue', () => {
      // Arrange
      const sessionData = {
        concentration: 2,
        understanding: 2,
        fatigue: 5
      }
      const allSessions = [
        ...Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          subjectId: 'math',
          date: `2025-10-${String(i + 1).padStart(2, '0')}`,
          timestamp: `2025-10-${String(i + 1).padStart(2, '0')}T10:00:00Z`,
          duration: 2,
          studyType: 'concept' as const,
          concentration: 2,
          understanding: 2,
          fatigue: 5,
          notes: ''
        }))
      ]

      // Act
      const result = generateInstantFeedback(sessionData, {}, allSessions)

      // Assert
      expect(result.warningMessage).toBeTruthy()
      expect(result.warningMessage).toContain('⚠️')
    })

    it('should include motivational message for good performance', () => {
      // Arrange
      const sessionData = {
        concentration: 5,
        understanding: 5,
        fatigue: 1
      }
      const allSessions = mockSessions.highHours

      // Act
      const result = generateInstantFeedback(sessionData, {}, allSessions)

      // Assert
      expect(result.motivationalMessage).toBeTruthy()
    })
  })

  describe('generateRealTimeFeedback', () => {
    it('should provide feedback for high concentration', () => {
      // Act
      const result = generateRealTimeFeedback('concentration', 5)

      // Assert
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toContain('🔥')
    })

    it('should provide feedback for low concentration', () => {
      // Act
      const result = generateRealTimeFeedback('concentration', 1.5)

      // Assert
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toContain('💡')
    })

    it('should provide feedback for high understanding', () => {
      // Act
      const result = generateRealTimeFeedback('understanding', 5)

      // Assert
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toContain('🧠')
    })

    it('should provide feedback for high fatigue', () => {
      // Act
      const result = generateRealTimeFeedback('fatigue', 5)

      // Assert
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toContain('😴')
    })

    it('should provide feedback for long duration', () => {
      // Act
      const result = generateRealTimeFeedback('duration', 4)

      // Assert
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]).toContain('⏰')
    })

    it('should return empty array for neutral values', () => {
      // Act
      const result = generateRealTimeFeedback('concentration', 3)

      // Assert
      expect(result).toEqual([])
    })
  })
})
