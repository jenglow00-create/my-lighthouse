import { describe, it, expect, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useStudySessions, useRecentSessions, useSubjectTotalHours } from './useStudySessions'
import { db } from '@/db/schema'
import { createSession } from '@/db/operations'

describe('useStudySessions', () => {
  beforeEach(async () => {
    // 각 테스트 전 DB 초기화
    await db.delete()
    await db.open()
  })

  describe('useStudySessions - 기본 조회', () => {
    it('should return empty array initially', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useStudySessions())

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.sessions).toEqual([])
    })

    it('should load all sessions without filters', async () => {
      // Arrange
      await createSession({
        subjectId: 'math',
        date: '2025-10-01',
        duration: 2,
        studyType: 'concept',
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: 'Test 1'
      })

      await createSession({
        subjectId: 'english',
        date: '2025-10-02',
        duration: 1.5,
        studyType: 'practice',
        concentration: 3,
        understanding: 3,
        fatigue: 3,
        notes: 'Test 2'
      })

      // Act
      const { result } = renderHook(() => useStudySessions())

      // Assert
      await waitFor(() => {
        expect(result.current.sessions.length).toBe(2)
      })
      expect(result.current.isLoading).toBe(false)
    })

    it('should filter sessions by date', async () => {
      // Arrange
      await createSession({
        subjectId: 'math',
        date: '2025-10-01',
        duration: 2,
        studyType: 'concept',
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: ''
      })

      await createSession({
        subjectId: 'math',
        date: '2025-10-02',
        duration: 1.5,
        studyType: 'practice',
        concentration: 3,
        understanding: 3,
        fatigue: 3,
        notes: ''
      })

      // Act
      const { result } = renderHook(() => useStudySessions({ date: '2025-10-01' }))

      // Assert
      await waitFor(() => {
        expect(result.current.sessions.length).toBe(1)
      })
      expect(result.current.sessions[0].date).toBe('2025-10-01')
    })

    it('should filter sessions by subjectId', async () => {
      // Arrange
      await createSession({
        subjectId: 'math',
        date: '2025-10-01',
        duration: 2,
        studyType: 'concept',
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: ''
      })

      await createSession({
        subjectId: 'english',
        date: '2025-10-01',
        duration: 1,
        studyType: 'practice',
        concentration: 3,
        understanding: 3,
        fatigue: 3,
        notes: ''
      })

      // Act
      const { result } = renderHook(() => useStudySessions({ subjectId: 'math' }))

      // Assert
      await waitFor(() => {
        expect(result.current.sessions.length).toBe(1)
      })
      expect(result.current.sessions[0].subjectId).toBe('math')
    })

    it('should limit number of sessions', async () => {
      // Arrange
      for (let i = 0; i < 10; i++) {
        await createSession({
          subjectId: 'math',
          date: `2025-10-${String((i % 28) + 1).padStart(2, '0')}`,
          duration: 2,
          studyType: 'concept',
          concentration: 4,
          understanding: 4,
          fatigue: 2,
          notes: ''
        })
        await new Promise(resolve => setTimeout(resolve, 2)) // Prevent ID collision
      }

      // Act
      const { result } = renderHook(() => useStudySessions({ limit: 5 }))

      // Assert
      await waitFor(() => {
        expect(result.current.sessions.length).toBe(5)
      })
    })
  })

  describe('useStudySessions - CRUD 작업', () => {
    it('should create a new session', async () => {
      // Arrange
      const { result } = renderHook(() => useStudySessions())
      const newSession = {
        subjectId: 'math',
        date: '2025-10-05',
        duration: 2,
        studyType: 'concept' as const,
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: 'New session'
      }

      // Act
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const id = await result.current.create(newSession)

      // Assert
      expect(id).toBeTruthy()
      await waitFor(() => {
        expect(result.current.sessions.length).toBe(1)
      })
      expect(result.current.sessions[0].subjectId).toBe('math')
      expect(result.current.sessions[0].notes).toBe('New session')
    })

    it('should update an existing session', async () => {
      // Arrange
      const id = await createSession({
        subjectId: 'math',
        date: '2025-10-01',
        duration: 2,
        studyType: 'concept',
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: 'Original'
      })

      const { result } = renderHook(() => useStudySessions())

      await waitFor(() => {
        expect(result.current.sessions.length).toBe(1)
      })

      // Act
      const success = await result.current.update(Number(id), {
        notes: 'Updated',
        concentration: 5
      })

      // Assert
      expect(success).toBe(true)
      await waitFor(() => {
        const session = result.current.sessions.find(s => s.id === Number(id))
        expect(session?.notes).toBe('Updated')
        expect(session?.concentration).toBe(5)
      })
    })

    it('should delete a session', async () => {
      // Arrange
      const id = await createSession({
        subjectId: 'math',
        date: '2025-10-01',
        duration: 2,
        studyType: 'concept',
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: 'To be deleted'
      })

      const { result } = renderHook(() => useStudySessions())

      await waitFor(() => {
        expect(result.current.sessions.length).toBe(1)
      })

      // Act
      const success = await result.current.remove(Number(id))

      // Assert
      expect(success).toBe(true)
      await waitFor(() => {
        expect(result.current.sessions.length).toBe(0)
      })
    })
  })

  describe('useRecentSessions', () => {
    it('should return empty array initially', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useRecentSessions())

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.sessions).toEqual([])
    })

    it('should return recent sessions in reverse chronological order', async () => {
      // Arrange
      await createSession({
        subjectId: 'math',
        date: '2025-10-01',
        duration: 2,
        studyType: 'concept',
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: 'Oldest'
      })
      await new Promise(resolve => setTimeout(resolve, 2))

      await createSession({
        subjectId: 'math',
        date: '2025-10-02',
        duration: 1.5,
        studyType: 'practice',
        concentration: 3,
        understanding: 3,
        fatigue: 3,
        notes: 'Middle'
      })
      await new Promise(resolve => setTimeout(resolve, 2))

      await createSession({
        subjectId: 'math',
        date: '2025-10-03',
        duration: 1,
        studyType: 'review',
        concentration: 5,
        understanding: 5,
        fatigue: 1,
        notes: 'Newest'
      })

      // Act
      const { result } = renderHook(() => useRecentSessions(3))

      // Assert
      await waitFor(() => {
        expect(result.current.sessions.length).toBe(3)
      })
      expect(result.current.sessions[0].notes).toBe('Newest')
      expect(result.current.sessions[2].notes).toBe('Oldest')
    })

    it('should limit to specified number', async () => {
      // Arrange
      for (let i = 0; i < 10; i++) {
        await createSession({
          subjectId: 'math',
          date: `2025-10-${String((i % 28) + 1).padStart(2, '0')}`,
          duration: 2,
          studyType: 'concept',
          concentration: 4,
          understanding: 4,
          fatigue: 2,
          notes: `Session ${i + 1}`
        })
        await new Promise(resolve => setTimeout(resolve, 2))
      }

      // Act
      const { result } = renderHook(() => useRecentSessions(5))

      // Assert
      await waitFor(() => {
        expect(result.current.sessions.length).toBe(5)
      })
    })
  })

  describe('useSubjectTotalHours', () => {
    it('should return 0 initially', async () => {
      // Arrange & Act
      const { result } = renderHook(() => useSubjectTotalHours('math'))

      // Assert
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })
      expect(result.current.totalHours).toBe(0)
    })

    it('should calculate total hours for a subject', async () => {
      // Arrange
      await createSession({
        subjectId: 'math',
        date: '2025-10-01',
        duration: 2.5,
        studyType: 'concept',
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: ''
      })
      await new Promise(resolve => setTimeout(resolve, 2))

      await createSession({
        subjectId: 'math',
        date: '2025-10-02',
        duration: 1.5,
        studyType: 'practice',
        concentration: 3,
        understanding: 3,
        fatigue: 3,
        notes: ''
      })
      await new Promise(resolve => setTimeout(resolve, 2))

      await createSession({
        subjectId: 'english',
        date: '2025-10-01',
        duration: 3,
        studyType: 'concept',
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: ''
      })

      // Act
      const { result } = renderHook(() => useSubjectTotalHours('math'))

      // Assert
      await waitFor(() => {
        expect(result.current.totalHours).toBe(4) // 2.5 + 1.5
      })
      expect(result.current.isLoading).toBe(false)
    })

    it('should update when new session is added', async () => {
      // Arrange
      await createSession({
        subjectId: 'math',
        date: '2025-10-01',
        duration: 2,
        studyType: 'concept',
        concentration: 4,
        understanding: 4,
        fatigue: 2,
        notes: ''
      })

      const { result } = renderHook(() => useSubjectTotalHours('math'))

      await waitFor(() => {
        expect(result.current.totalHours).toBe(2)
      })

      // Act
      await createSession({
        subjectId: 'math',
        date: '2025-10-02',
        duration: 1.5,
        studyType: 'practice',
        concentration: 3,
        understanding: 3,
        fatigue: 3,
        notes: ''
      })

      // Assert
      await waitFor(() => {
        expect(result.current.totalHours).toBe(3.5) // 2 + 1.5
      })
    })
  })
})
