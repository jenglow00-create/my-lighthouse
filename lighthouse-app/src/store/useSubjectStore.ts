import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Subject } from '@/types/study'
import {
  createSubject as dbCreateSubject,
  updateSubject as dbUpdateSubject,
  deleteSubject as dbDeleteSubject,
  getAllSubjects
} from '@/db/operations'

interface SubjectState {
  subjects: Record<string, Subject>
  isLoading: boolean
  error: string | null

  // Computed
  getSubjectsList: () => Subject[]
  getSubjectById: (id: string) => Subject | undefined

  // Actions
  loadSubjects: () => Promise<void>
  addSubject: (subject: Omit<Subject, 'id' | 'createdAt' | 'updatedAt' | 'totalHours'>) => Promise<string>
  editSubject: (id: string, updates: Partial<Subject>) => Promise<void>
  removeSubject: (id: string) => Promise<void>
  clearError: () => void
}

export const useSubjectStore = create<SubjectState>()(
  devtools(
    immer((set, get) => ({
      subjects: {},
      isLoading: false,
      error: null,

      getSubjectsList: () => {
        return Object.values(get().subjects)
      },

      getSubjectById: (id: string) => {
        return get().subjects[id]
      },

      loadSubjects: async () => {
        set({ isLoading: true, error: null })

        try {
          const subjectsArray = await getAllSubjects()
          const subjectsMap = subjectsArray.reduce((acc, subject) => {
            acc[subject.id] = subject
            return acc
          }, {} as Record<string, Subject>)

          set({ subjects: subjectsMap, isLoading: false })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false
          })
        }
      },

      addSubject: async (subjectData) => {
        set({ isLoading: true, error: null })

        try {
          const id = await dbCreateSubject(subjectData)

          // 낙관적 업데이트
          set((state) => {
            const now = new Date().toISOString()
            state.subjects[id] = {
              ...subjectData,
              id,
              createdAt: now,
              updatedAt: now,
              totalHours: 0
            }
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

      editSubject: async (id, updates) => {
        set({ isLoading: true, error: null })

        try {
          await dbUpdateSubject(id, {
            ...updates,
            updatedAt: new Date().toISOString()
          })

          // 낙관적 업데이트
          set((state) => {
            if (state.subjects[id]) {
              state.subjects[id] = {
                ...state.subjects[id],
                ...updates,
                updatedAt: new Date().toISOString()
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

      removeSubject: async (id) => {
        set({ isLoading: true, error: null })

        try {
          await dbDeleteSubject(id)

          // 낙관적 업데이트
          set((state) => {
            delete state.subjects[id]
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
    { name: 'SubjectStore' }
  )
)
