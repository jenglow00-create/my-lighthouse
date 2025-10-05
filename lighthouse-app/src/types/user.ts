// 사용자 관련 타입 정의

/** 인증된 사용자 */
export interface AuthUser {
  id: number
  username: string
  email: string
  password: string              // 실제 프로덕션에서는 해시 필요
  createdAt: string             // ISO 8601
}

/** 사용자 프로필 (개인 정보) */
export interface UserProfile {
  name?: string
  age?: number
  targetExam?: string           // 목표 시험
  targetDate?: string           // YYYY-MM-DD
  dailyGoalHours?: number       // 일일 목표 학습 시간
  weeklyGoalHours?: number      // 주간 목표 학습 시간
  bio?: string                  // 자기소개
}

/** 사용자 설정 */
export interface UserSettings {
  theme?: 'light' | 'dark'      // 테마
  notifications?: {
    studyReminder: boolean      // 학습 알림
    reflectionReminder: boolean // 성찰 알림
    goalReminder: boolean       // 목표 달성 알림
  }
  autoReflection?: {
    enabled: boolean            // 자동 성찰 활성화
    afterHours: number          // N시간 학습 후 성찰 유도
  }
  language?: 'ko' | 'en'        // 언어
}

/** 사용자 데이터 (전체) */
export interface UserData {
  currentUser?: AuthUser | null
  personalInfo?: UserProfile
  settings?: UserSettings
  subjects: { [subjectId: string]: import('./study').Subject }
  sessions: import('./study').StudySession[]
  reflections?: import('./reflection').Reflection[]
  goals?: Goal[]
  globalSettings?: {
    progressUnit: 'daily' | 'weekly' | 'monthly'
    defaultTargetHours: number
  }
}

/** 목표 */
export interface Goal {
  id: number
  title: string
  description?: string
  type: 'daily' | 'weekly' | 'monthly' | 'exam'
  targetValue: number           // 목표값
  currentValue: number          // 현재값
  unit: string                  // 단위 (시간, 점수 등)
  deadline?: string             // YYYY-MM-DD
  completed: boolean
  createdAt: string             // ISO 8601
  updatedAt: string             // ISO 8601
}

/** 로그인 폼 데이터 */
export interface LoginFormData {
  username: string
  password: string
}

/** 회원가입 폼 데이터 */
export interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
}
