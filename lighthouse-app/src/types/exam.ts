// 시험 관련 타입 정의

/** 시험 하위 카테고리 (소주제) */
export interface SubCategory {
  id: string
  name: string
  description: string
  defaultTarget: number | string  // 기본 목표 점수 (숫자 또는 문자열)
  maxScore: number | string       // 최대 점수
}

/** 시험 카테고리 (대주제) */
export interface ExamCategory {
  id: string
  name: string
  icon: string
  description: string
  subcategories: SubCategory[]
}

/** 시험 유형 (확장된 정보 포함) */
export interface ExamType extends SubCategory {
  categoryId: string              // 상위 카테고리 ID
  categoryName: string            // 상위 카테고리 이름
  categoryIcon?: string           // 상위 카테고리 아이콘
}

/** 시험 유형 ID (문자열 리터럴 유니온) */
export type ExamTypeId =
  // 어학
  | 'TOEIC' | 'TOEFL' | 'IELTS' | 'TEPS' | 'OPIc' | 'JLPT' | 'HSK'
  // 자격증
  | 'Korean History 1' | 'Korean History 2' | 'Computer 1' | 'Computer 2'
  | 'ITQ' | 'MOS' | 'Accounting' | 'CPA'
  // 공기업
  | 'NCS' | 'Major' | 'Essay' | 'PSAT'
  // 공무원
  | 'Civil 9' | 'Civil 7' | 'Local Civil' | 'Police' | 'Fire'
  // 대학/대학원
  | 'SAT' | 'ACT' | 'GRE' | 'GMAT' | 'LEET' | 'MEET'
  // 기타
  | 'Custom'

/** 시험 카테고리 ID */
export type ExamCategoryId =
  | 'language'      // 어학
  | 'certification' // 자격증
  | 'public'        // 공기업
  | 'civil'         // 공무원
  | 'university'    // 대학/대학원
  | 'other'         // 기타

/** 구버전 시험 유형 (호환성) */
export type LegacyExamType =
  | 'TOEIC'
  | 'TOEFL'
  | 'IELTS'
  | 'Korean History'
  | 'Civil Service'
  | 'SAT'
  | 'GRE'
  | 'Other'
