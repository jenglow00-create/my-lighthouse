// localStorage → IndexedDB 마이그레이션 로직
import { db } from './schema'
import type { StudySession, Reflection, Subject, Rating, StudyType } from '@/types'

/** 레거시 데이터 구조 */
interface LegacyData {
  sessions?: any[]
  reflections?: any[]
  subjects?: Record<string, any>
  personalInfo?: any
  settings?: any
  goals?: any[]
}

/** 마이그레이션 결과 */
export interface MigrationResult {
  success: boolean
  migratedCount: number
  errors: string[]
  backupKey?: string
  details: {
    sessions: number
    reflections: number
    subjects: number
  }
}

/** 마이그레이션 진행 상태 콜백 */
export type MigrationProgressCallback = (progress: {
  total: number
  current: number
  phase: string
}) => void

/**
 * localStorage에서 IndexedDB로 데이터 마이그레이션
 *
 * @param onProgress - 진행 상태 콜백 (선택)
 * @returns 마이그레이션 결과
 */
export async function migrateFromLocalStorage(
  onProgress?: MigrationProgressCallback
): Promise<MigrationResult> {
  const errors: string[] = []
  const details = { sessions: 0, reflections: 0, subjects: 0 }

  try {
    // 1. 기존 데이터 읽기
    const rawData = localStorage.getItem('lighthouse-study-data')
    if (!rawData) {
      console.log('📭 마이그레이션할 데이터가 없습니다.')
      return { success: true, migratedCount: 0, errors: [], details }
    }

    let legacyData: LegacyData
    try {
      legacyData = JSON.parse(rawData)
    } catch (error) {
      throw new Error('localStorage 데이터 파싱 실패: ' + (error as Error).message)
    }

    // 2. 백업 생성
    const backupKey = `lighthouse-study-data_backup_${Date.now()}`
    localStorage.setItem(backupKey, rawData)
    console.log(`💾 백업 생성: ${backupKey}`)

    // 3. 총 항목 수 계산
    const totalItems =
      (legacyData.sessions?.length || 0) +
      (legacyData.reflections?.length || 0) +
      (Object.keys(legacyData.subjects || {}).length || 0)

    let currentItem = 0

    // 4. Sessions 마이그레이션
    if (legacyData.sessions && legacyData.sessions.length > 0) {
      onProgress?.({ total: totalItems, current: currentItem, phase: 'Sessions 마이그레이션 중...' })

      const validSessions = legacyData.sessions
        .filter((session, index) => {
          const isValid = validateSession(session)
          if (!isValid) {
            errors.push(`Session ${index}: 검증 실패`)
          }
          return isValid
        })
        .map(normalizeSession)

      try {
        await db.sessions.bulkAdd(validSessions)
        details.sessions = validSessions.length
        currentItem += validSessions.length
        console.log(`✅ Sessions 마이그레이션 완료: ${validSessions.length}개`)
      } catch (error) {
        errors.push('Sessions 삽입 실패: ' + (error as Error).message)
      }
    }

    // 5. Reflections 마이그레이션
    if (legacyData.reflections && legacyData.reflections.length > 0) {
      onProgress?.({ total: totalItems, current: currentItem, phase: 'Reflections 마이그레이션 중...' })

      const validReflections = legacyData.reflections
        .filter((reflection, index) => {
          const isValid = validateReflection(reflection)
          if (!isValid) {
            errors.push(`Reflection ${index}: 검증 실패`)
          }
          return isValid
        })
        .map(normalizeReflection)

      try {
        await db.reflections.bulkAdd(validReflections)
        details.reflections = validReflections.length
        currentItem += validReflections.length
        console.log(`✅ Reflections 마이그레이션 완료: ${validReflections.length}개`)
      } catch (error) {
        errors.push('Reflections 삽입 실패: ' + (error as Error).message)
      }
    }

    // 6. Subjects 마이그레이션
    if (legacyData.subjects && Object.keys(legacyData.subjects).length > 0) {
      onProgress?.({ total: totalItems, current: currentItem, phase: 'Subjects 마이그레이션 중...' })

      const subjectsArray = Object.entries(legacyData.subjects)
        .filter(([id, subject]) => {
          const isValid = validateSubject(subject)
          if (!isValid) {
            errors.push(`Subject ${id}: 검증 실패`)
          }
          return isValid
        })
        .map(([id, subject]) => normalizeSubject(id, subject))

      try {
        await db.subjects.bulkAdd(subjectsArray)
        details.subjects = subjectsArray.length
        currentItem += subjectsArray.length
        console.log(`✅ Subjects 마이그레이션 완료: ${subjectsArray.length}개`)
      } catch (error) {
        errors.push('Subjects 삽입 실패: ' + (error as Error).message)
      }
    }

    // 7. 마이그레이션 완료
    onProgress?.({ total: totalItems, current: totalItems, phase: '마이그레이션 완료!' })

    // 8. 원본 데이터 삭제 (선택적 - 주석 처리)
    // localStorage.removeItem('lighthouse-study-data')

    const migratedCount = details.sessions + details.reflections + details.subjects

    return {
      success: true,
      migratedCount,
      errors,
      backupKey,
      details
    }
  } catch (error) {
    errors.push('마이그레이션 실패: ' + (error as Error).message)
    console.error('❌ 마이그레이션 에러:', error)

    return {
      success: false,
      migratedCount: 0,
      errors,
      details
    }
  }
}

// ============================================================================
// 검증 함수들
// ============================================================================

/** Session 데이터 검증 */
function validateSession(session: any): boolean {
  return (
    session &&
    typeof session.id !== 'undefined' &&
    typeof session.date === 'string' &&
    typeof session.subjectId === 'string' &&
    (typeof session.duration === 'number' || typeof session.duration === 'string') &&
    Number(session.duration) > 0
  )
}

/** Reflection 데이터 검증 */
function validateReflection(reflection: any): boolean {
  return (
    reflection &&
    typeof reflection.id !== 'undefined' &&
    typeof reflection.date === 'string' &&
    typeof reflection.selectedTopic === 'string' &&
    typeof reflection.learningRating !== 'undefined'
  )
}

/** Subject 데이터 검증 */
function validateSubject(subject: any): boolean {
  return (
    subject &&
    typeof subject.name === 'string' &&
    typeof subject.examType === 'string'
  )
}

// ============================================================================
// 정규화 함수들
// ============================================================================

/** 값을 min-max 범위로 제한 */
function clamp(value: any, min: number, max: number): number {
  const num = Number(value)
  if (isNaN(num)) return min
  return Math.max(min, Math.min(max, num))
}

/** Rating 타입으로 변환 (1-5) */
function toRating(value: any): Rating {
  return clamp(value, 1, 5) as Rating
}

/** Session 데이터 정규화 */
function normalizeSession(session: any): StudySession {
  return {
    id: Number(session.id) || Date.now(),
    date: session.date,
    subjectId: session.subjectId,
    studyType: (session.studyType || 'concept') as StudyType,
    duration: Number(session.duration),
    notes: session.notes || '',
    timestamp: session.timestamp || new Date().toISOString(),
    concentration: toRating(session.concentration || 3),
    understanding: toRating(session.understanding || 3),
    fatigue: toRating(session.fatigue || 3)
  }
}

/** Reflection 데이터 정규화 */
function normalizeReflection(reflection: any): Reflection {
  return {
    id: Number(reflection.id) || Date.now(),
    date: reflection.date,
    timestamp: reflection.timestamp || new Date().toISOString(),
    allTopics: Array.isArray(reflection.allTopics) ? reflection.allTopics : [reflection.selectedTopic],
    selectedTopic: reflection.selectedTopic,
    recallContent: reflection.recallContent || '',
    verificationResult: reflection.verificationResult || '',
    learningRating: toRating(reflection.learningRating),
    needsMoreStudy: reflection.needsMoreStudy || '',
    tomorrowPlan: reflection.tomorrowPlan || '',
    isAutoTriggered: Boolean(reflection.isAutoTriggered)
  }
}

/** Subject 데이터 정규화 */
function normalizeSubject(id: string, subject: any): Subject {
  return {
    id,
    name: subject.name,
    examType: subject.examType,
    examCategory: subject.examCategory || 'other',
    targetHours: Number(subject.targetHours) || 100,
    examDate: subject.examDate || '',
    targetScore: subject.targetScore || 0,
    description: subject.description || '',
    createdAt: subject.createdAt || new Date().toISOString(),
    updatedAt: subject.updatedAt || new Date().toISOString(),
    totalHours: Number(subject.totalHours) || 0,
    scores: Array.isArray(subject.scores) ? subject.scores : []
  }
}

// ============================================================================
// 유틸리티 함수들
// ============================================================================

/**
 * 백업 데이터 복원
 *
 * @param backupKey - 백업 키 (예: lighthouse-study-data_backup_1234567890)
 */
export async function restoreFromBackup(backupKey: string): Promise<boolean> {
  try {
    const backupData = localStorage.getItem(backupKey)
    if (!backupData) {
      throw new Error('백업 데이터를 찾을 수 없습니다.')
    }

    localStorage.setItem('lighthouse-study-data', backupData)
    console.log(`✅ 백업 복원 완료: ${backupKey}`)
    return true
  } catch (error) {
    console.error('❌ 백업 복원 실패:', error)
    return false
  }
}

/**
 * 모든 백업 키 조회
 */
export function getBackupKeys(): string[] {
  const keys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key && key.startsWith('lighthouse-study-data_backup_')) {
      keys.push(key)
    }
  }
  return keys.sort().reverse() // 최신순
}

/**
 * 오래된 백업 삭제 (1주일 이상)
 */
export function cleanupOldBackups(): number {
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const backupKeys = getBackupKeys()
  let deletedCount = 0

  backupKeys.forEach(key => {
    const timestampMatch = key.match(/_backup_(\d+)$/)
    if (timestampMatch) {
      const timestamp = parseInt(timestampMatch[1])
      if (timestamp < oneWeekAgo) {
        localStorage.removeItem(key)
        deletedCount++
        console.log(`🗑️ 오래된 백업 삭제: ${key}`)
      }
    }
  })

  return deletedCount
}
