import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { StudySession } from '@/types/study'
import {
  createSession as dbCreateSession,
  updateSession as dbUpdateSession,
  deleteSession as dbDeleteSession,
  getSessionsByDateRange,
  getSessionsBySubject as dbGetSessionsBySubject
} from '@/db/operations'

interface SessionState {
  // State
  sessions: StudySession[]
  isLoading: boolean
  error: string | null

  // Computed (Getters)
  getSessionsByDate: (date: string) => StudySession[]
  getSessionsBySubject: (subjectId: string) => StudySession[]
  getTotalHours: () => number
  getTotalHoursBySubject: (subjectId: string) => number

  // Actions
  loadSessions: (startDate?: string, endDate?: string) => Promise<void>
  addSession: (session: Omit<StudySession, 'id' | 'timestamp'>) => Promise<number>
  editSession: (id: number, updates: Partial<StudySession>) => Promise<void>
  removeSession: (id: number) => Promise<void>
  clearError: () => void
}

export const useSessionStore = create<SessionState>()(
  devtools(
    immer((set, get) => ({
      // Initial State
      sessions: [],
      isLoading: false,
      error: null,

      // Computed
      getSessionsByDate: (date: string) => {
        return get().sessions.filter(s => s.date === date)
      },

      getSessionsBySubject: (subjectId: string) => {
        return get().sessions.filter(s => s.subjectId === subjectId)
      },

      getTotalHours: () => {
        return get().sessions.reduce((sum, s) => sum + s.duration, 0)
      },

      getTotalHoursBySubject: (subjectId: string) => {
        return get()
          .sessions
          .filter(s => s.subjectId === subjectId)
          .reduce((sum, s) => sum + s.duration, 0)
      },

      // Actions
      loadSessions: async (startDate, endDate) => {
        set({ isLoading: true, error: null })

        try {
          let sessions: StudySession[]

          if (startDate && endDate) {
            sessions = await getSessionsByDateRange(startDate, endDate)
          } else {
            // 최근 100개 세션 로드
            const allSessions = await dbGetSessionsBySubject('')
            sessions = allSessions.slice(0, 100)
          }

          set({ sessions, isLoading: false })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false
          })
        }
      },

      addSession: async (sessionData) => {
        set({ isLoading: true, error: null })

        try {
          const id = await dbCreateSession(sessionData)

          // 낙관적 업데이트
          set((state) => {
            state.sessions.push({
              ...sessionData,
              id,
              timestamp: new Date().toISOString()
            })
          })

          set({ isLoading: false })
          return id
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false
          })
          throw error
        }
      },

      editSession: async (id, updates) => {
        set({ isLoading: true, error: null })

        try {
          await dbUpdateSession(id, updates)

          // 낙관적 업데이트
          set((state) => {
            const index = state.sessions.findIndex(s => s.id === id)
            if (index !== -1) {
              state.sessions[index] = {
                ...state.sessions[index],
                ...updates
              }
            }
          })

          set({ isLoading: false })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false
          })
          throw error
        }
      },

      removeSession: async (id) => {
        set({ isLoading: true, error: null })

        try {
          await dbDeleteSession(id)

          // 낙관적 업데이트
          set((state) => {
            state.sessions = state.sessions.filter(s => s.id !== id)
          })

          set({ isLoading: false })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false
          })
          throw error
        }
      },

      clearError: () => {
        set({ error: null })
      }
    })),
    { name: 'SessionStore' }
  )
)
