import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import StudyLog from './StudyLog'
import type { UserData } from '@/types'

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('StudyLog', () => {
  const mockSetStudyData = vi.fn()

  const defaultStudyData: UserData = {
    personalInfo: {
      username: 'testuser',
      email: 'test@example.com'
    },
    subjects: {
      math: {
        id: 'math',
        name: '수학',
        examType: 'SUNEUNG',
        examCategory: 'PUBLIC_EXAM',
        targetHours: 100,
        examDate: '2025-11-14',
        targetScore: 100,
        description: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        totalHours: 0
      }
    },
    sessions: [],
    reflections: [],
    settings: {
      autoReflection: {
        enabled: false,
        minSessionDuration: 30
      }
    }
  }

  beforeEach(() => {
    mockSetStudyData.mockClear()
    mockNavigate.mockClear()
  })

  const renderStudyLog = (studyData = defaultStudyData) => {
    return render(
      <BrowserRouter>
        <StudyLog studyData={studyData} setStudyData={mockSetStudyData} />
      </BrowserRouter>
    )
  }

  describe('기본 렌더링', () => {
    it('should render page title', () => {
      renderStudyLog()
      expect(screen.getByText('학습 기록')).toBeInTheDocument()
    })

    it('should show empty state when no sessions', () => {
      renderStudyLog()
      expect(screen.getByText('아직 학습 세션이 없습니다.')).toBeInTheDocument()
    })

    it('should have main element with ARIA label', () => {
      renderStudyLog()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-labelledby', 'study-log-title')
    })
  })

  describe('세션 목록 표시', () => {
    it('should display recent sessions', () => {
      const studyDataWithSessions = {
        ...defaultStudyData,
        sessions: [
          {
            id: 1,
            subjectId: 'math',
            duration: 2,
            date: '2025-10-01',
            timestamp: '2025-10-01T10:00:00Z',
            studyType: 'concept',
            concentration: 4,
            understanding: 4,
            fatigue: 2,
            notes: '테스트 세션'
          }
        ]
      }

      renderStudyLog(studyDataWithSessions)

      expect(screen.getByText('수학')).toBeInTheDocument()
      expect(screen.getByText('2시간')).toBeInTheDocument()
    })

    it('should display multiple sessions', () => {
      const studyDataWithMultipleSessions = {
        ...defaultStudyData,
        sessions: [
          {
            id: 1,
            subjectId: 'math',
            duration: 2,
            date: '2025-10-01',
            timestamp: '2025-10-01T10:00:00Z',
            studyType: 'concept',
            concentration: 4,
            understanding: 4,
            fatigue: 2,
            notes: ''
          },
          {
            id: 2,
            subjectId: 'math',
            duration: 1.5,
            date: '2025-10-02',
            timestamp: '2025-10-02T10:00:00Z',
            studyType: 'practice',
            concentration: 3,
            understanding: 3,
            fatigue: 3,
            notes: ''
          }
        ]
      }

      renderStudyLog(studyDataWithMultipleSessions)

      expect(screen.getByText('2시간')).toBeInTheDocument()
      expect(screen.getByText('1.5시간')).toBeInTheDocument()
    })
  })

  describe('과목 정보', () => {
    it('should show subject information in sessions', () => {
      const studyDataWithSession = {
        ...defaultStudyData,
        sessions: [
          {
            id: 1,
            subjectId: 'math',
            duration: 2,
            date: '2025-10-01',
            timestamp: '2025-10-01T10:00:00Z',
            studyType: 'concept',
            concentration: 4,
            understanding: 4,
            fatigue: 2,
            notes: ''
          }
        ]
      }

      renderStudyLog(studyDataWithSession)

      expect(screen.getByText('수학')).toBeInTheDocument()
    })

    it('should handle sessions with different subjects', () => {
      const studyDataWithMultipleSubjects = {
        ...defaultStudyData,
        subjects: {
          ...defaultStudyData.subjects,
          english: {
            id: 'english',
            name: '영어',
            examType: 'TOEIC',
            examCategory: 'LANGUAGE',
            targetHours: 80,
            examDate: '2025-12-01',
            targetScore: 900,
            description: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalHours: 0
          }
        },
        sessions: [
          {
            id: 1,
            subjectId: 'math',
            duration: 2,
            date: '2025-10-01',
            timestamp: '2025-10-01T10:00:00Z',
            studyType: 'concept',
            concentration: 4,
            understanding: 4,
            fatigue: 2,
            notes: ''
          },
          {
            id: 2,
            subjectId: 'english',
            duration: 1,
            date: '2025-10-02',
            timestamp: '2025-10-02T10:00:00Z',
            studyType: 'memorize',
            concentration: 3,
            understanding: 3,
            fatigue: 3,
            notes: ''
          }
        ]
      }

      renderStudyLog(studyDataWithMultipleSubjects)

      expect(screen.getByText('수학')).toBeInTheDocument()
      expect(screen.getByText('영어')).toBeInTheDocument()
    })
  })

  describe('컴포넌트 Props', () => {
    it('should receive studyData prop', () => {
      renderStudyLog(defaultStudyData)
      expect(screen.getByRole('main')).toBeInTheDocument()
    })

    it('should receive setStudyData callback', () => {
      renderStudyLog(defaultStudyData)
      expect(mockSetStudyData).toBeDefined()
    })
  })
})
