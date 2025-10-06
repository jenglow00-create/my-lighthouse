import type { StudySession } from '@/types/study'
import type { Reflection } from '@/types/reflection'

export const mockSessions = {
  // 주 2.5시간 (하위 20%)
  lowHours: [
    {
      id: 1,
      subjectId: 'math',
      date: '2025-10-01',
      timestamp: '2025-10-01T10:00:00Z',
      duration: 1,
      studyType: 'concept',
      concentration: 3,
      understanding: 3,
      fatigue: 2,
      notes: ''
    },
    {
      id: 2,
      subjectId: 'math',
      date: '2025-10-02',
      timestamp: '2025-10-02T10:00:00Z',
      duration: 1.5,
      studyType: 'practice',
      concentration: 3,
      understanding: 3,
      fatigue: 2,
      notes: ''
    }
  ] as StudySession[],

  // 주 15시간 (평균 수준)
  averageHours: Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    subjectId: 'math',
    date: `2025-10-0${i + 1}`,
    timestamp: `2025-10-0${i + 1}T10:00:00Z`,
    duration: 2.14, // 15시간 / 7일
    studyType: 'concept',
    concentration: 3,
    understanding: 3,
    fatigue: 3,
    notes: ''
  })) as StudySession[],

  // 주 25시간 (상위 5%)
  highHours: Array.from({ length: 7 }, (_, i) => ({
    id: i + 1,
    subjectId: 'math',
    date: `2025-10-0${i + 1}`,
    timestamp: `2025-10-0${i + 1}T10:00:00Z`,
    duration: 3.57, // 25시간 / 7일
    studyType: 'concept',
    concentration: 4,
    understanding: 4,
    fatigue: 3,
    notes: ''
  })) as StudySession[],

  // 높은 집중도
  highConcentration: Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    subjectId: 'math',
    date: `2025-10-0${i + 1}`,
    timestamp: `2025-10-0${i + 1}T10:00:00Z`,
    duration: 2,
    studyType: 'concept',
    concentration: 5,
    understanding: 4,
    fatigue: 2,
    notes: ''
  })) as StudySession[],

  // 낮은 집중도
  lowConcentration: Array.from({ length: 5 }, (_, i) => ({
    id: i + 1,
    subjectId: 'math',
    date: `2025-10-0${i + 1}`,
    timestamp: `2025-10-0${i + 1}T10:00:00Z`,
    duration: 2,
    studyType: 'concept',
    concentration: 2,
    understanding: 2,
    fatigue: 4,
    notes: ''
  })) as StudySession[]
}

export const mockReflections = {
  lowRating: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    date: `2025-10-0${(i % 9) + 1}`,
    timestamp: `2025-10-0${(i % 9) + 1}T10:00:00Z`,
    allTopics: ['topic1', 'topic2'],
    selectedTopic: 'topic1',
    recallContent: 'test recall',
    verificationResult: 'test verification',
    learningRating: 1 + (i % 2), // 1 or 2
    needsMoreStudy: 'test needs',
    tomorrowPlan: 'test plan',
    isAutoTriggered: false
  })) as Reflection[],

  averageRating: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    date: `2025-10-0${(i % 9) + 1}`,
    timestamp: `2025-10-0${(i % 9) + 1}T10:00:00Z`,
    allTopics: ['topic1', 'topic2'],
    selectedTopic: 'topic1',
    recallContent: 'test recall',
    verificationResult: 'test verification',
    learningRating: 3,
    needsMoreStudy: 'test needs',
    tomorrowPlan: 'test plan',
    isAutoTriggered: false
  })) as Reflection[],

  highRating: Array.from({ length: 10 }, (_, i) => ({
    id: i + 1,
    date: `2025-10-0${(i % 9) + 1}`,
    timestamp: `2025-10-0${(i % 9) + 1}T10:00:00Z`,
    allTopics: ['topic1', 'topic2'],
    selectedTopic: 'topic1',
    recallContent: 'test recall',
    verificationResult: 'test verification',
    learningRating: 4 + (i % 2), // 4 or 5
    needsMoreStudy: 'test needs',
    tomorrowPlan: 'test plan',
    isAutoTriggered: false
  })) as Reflection[]
}

export const mockSubjects = {
  math: {
    id: 'math',
    name: '수학',
    examType: 'SUNEUNG',
    examCategory: 'PUBLIC_EXAM',
    targetHours: 100,
    examDate: '2025-11-14',
    targetScore: 100,
    description: '수능 수학',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    totalHours: 50
  },
  english: {
    id: 'english',
    name: '영어',
    examType: 'TOEIC',
    examCategory: 'LANGUAGE',
    targetHours: 80,
    examDate: '2025-12-01',
    targetScore: 900,
    description: 'TOEIC',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    totalHours: 40
  }
}
