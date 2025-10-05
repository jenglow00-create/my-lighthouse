// 성찰 관련 타입 정의

/** 학습도 평가 점수 (1-5) */
export type LearningRating = 1 | 2 | 3 | 4 | 5

/** 성찰 단계 */
export type ReflectionStage =
  | 'topics'      // 1단계: 주제 입력
  | 'selected'    // 2단계: 주제 선택
  | 'recall'      // 3단계: 내용 회상
  | 'verify'      // 4단계: 교재 확인
  | 'evaluate'    // 5단계: 학습도 평가
  | 'plan'        // 6단계: 내일 계획

/** 성찰 기록 */
export interface Reflection {
  id: number
  date: string                    // YYYY-MM-DD
  timestamp: string               // ISO 8601
  allTopics: string[]            // 입력한 모든 주제들
  selectedTopic: string          // 랜덤 선택된 주제
  recallContent: string          // 회상한 내용
  verificationResult: string     // 교재 확인 결과
  learningRating: LearningRating // 학습도 평가 (1-5)
  needsMoreStudy: string         // 더 공부할 내용
  tomorrowPlan: string           // 내일 학습 계획
  isAutoTriggered: boolean       // 자동 트리거 여부
}

/** 성찰 통계 */
export interface ReflectionStats {
  totalCount: number
  averageRating: number
  ratingDistribution: {
    [key in LearningRating]: number  // 각 점수별 개수
  }
  recentReflections: Reflection[]    // 최근 N개
  topicsReviewed: string[]           // 복습한 주제 목록
}

/** 성찰 필터 옵션 */
export interface ReflectionFilter {
  startDate?: string              // YYYY-MM-DD
  endDate?: string                // YYYY-MM-DD
  minRating?: LearningRating
  maxRating?: LearningRating
  searchTopic?: string            // 주제 검색어
  autoTriggeredOnly?: boolean     // 자동 트리거만 표시
}
