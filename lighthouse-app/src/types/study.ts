// 학습 관련 타입 정의

/** 학습 유형 */
export enum StudyType {
  CONCEPT = 'concept',      // 개념 이해
  PRACTICE = 'practice',    // 문제 풀이
  MEMORIZE = 'memorize',    // 암기
  REVIEW = 'review'         // 복습
}

/** 평가 점수 (1-5) */
export type Rating = 1 | 2 | 3 | 4 | 5

/** 학습 세션 */
export interface StudySession {
  id: number
  subjectId: string
  duration: number              // 학습 시간 (시간 단위)
  notes: string
  date: string                  // YYYY-MM-DD
  timestamp: string             // ISO 8601
  studyType: StudyType
  concentration: Rating         // 집중도 1-5
  understanding: Rating         // 이해도 1-5
  fatigue: Rating              // 피로도 1-5
}

/** 과목/시험 */
export interface Subject {
  id: string
  name: string
  examType: string              // examTypes.js의 subcategory id
  examCategory: string          // examTypes.js의 category id
  targetHours: number
  examDate: string              // YYYY-MM-DD
  targetScore: number | string  // 숫자 또는 문자 (예: OPIc 'IH')
  description: string
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
  totalHours: number
  scores?: Score[]              // 점수 기록
}

/** 점수 기록 */
export interface Score {
  id: number
  expectedScore: number | null  // 예상 점수
  actualScore: number | null    // 실제 점수
  testDate: string              // YYYY-MM-DD
  createdAt: string             // ISO 8601
}

/** 일일 통계 */
export interface DailyStats {
  date: string                  // YYYY-MM-DD
  totalHours: number
  sessionCount: number
  subjectBreakdown: {
    [subjectId: string]: number // 과목별 학습 시간
  }
  averageConcentration: number
  averageUnderstanding: number
  averageFatigue: number
}

/** 주간 통계 */
export interface WeeklyStats {
  weekStart: string             // YYYY-MM-DD (월요일)
  weekEnd: string               // YYYY-MM-DD (일요일)
  totalHours: number
  dailyAverage: number
  mostStudiedSubject: string    // subject id
  studyTypeBreakdown: {
    [key in StudyType]: number  // 학습 유형별 시간
  }
}

/** 학습 유형 정보 */
export interface StudyTypeInfo {
  id: StudyType
  name: string
  description: string
}
