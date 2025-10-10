import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import type { Reflection, ReflectionFilter } from '@/types/reflection'
import { createReflection as dbCreateReflection } from '@/db/operations'
import { db } from '@/db/schema'
import { logAudit } from '@/db/audit'

interface ReflectionState {
  reflections: Reflection[]
  isLoading: boolean
  error: string | null

  // Computed
  getReflectionsByDate: (date: string) => Reflection[]
  getRecentReflections: (limit: number) => Reflection[]
  getAverageRating: () => number

  // Actions
  loadReflections: (filter?: ReflectionFilter) => Promise<void>
  addReflection: (reflection: Omit<Reflection, 'id' | 'timestamp'>) => Promise<number>
  editReflection: (id: number, updates: Partial<Reflection>) => Promise<void>
  removeReflection: (id: number) => Promise<void>
  clearError: () => void
}

export const useReflectionStore = create<ReflectionState>()(
  devtools(
    immer((set, get) => ({
      reflections: [],
      isLoading: false,
      error: null,

      getReflectionsByDate: (date: string) => {
        return get().reflections.filter(r => r.date === date)
      },

      getRecentReflections: (limit: number) => {
        return get().reflections.slice(0, limit)
      },

      getAverageRating: () => {
        const reflections = get().reflections
        if (reflections.length === 0) return 0

        const sum = reflections.reduce((acc, r) => acc + r.learningRating, 0)
        return sum / reflections.length
      },

      loadReflections: async (filter) => {
        set({ isLoading: true, error: null })

        try {
          let reflections: Reflection[]

          if (filter?.startDate && filter?.endDate) {
            reflections = await db.reflections
              .where('date')
              .between(filter.startDate, filter.endDate, true, true)
              .toArray()
          } else {
            // 모든 성찰 로드 (최근 순)
            reflections = await db.reflections.toArray()
          }

          // 추가 필터링
          if (filter) {
            if (filter.minRating) {
              reflections = reflections.filter(r => r.learningRating >= filter.minRating!)
            }
            if (filter.maxRating) {
              reflections = reflections.filter(r => r.learningRating <= filter.maxRating!)
            }
            if (filter.searchTopic) {
              const searchLower = filter.searchTopic.toLowerCase()
              reflections = reflections.filter(r =>
                r.allTopics.some(topic => topic.toLowerCase().includes(searchLower)) ||
                r.selectedTopic.toLowerCase().includes(searchLower)
              )
            }
            if (filter.autoTriggeredOnly) {
              reflections = reflections.filter(r => r.isAutoTriggered)
            }
          }

          // 최신 순으로 정렬
          reflections.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

          set({ reflections, isLoading: false })
        } catch (error) {
          set({
            error: (error as Error).message,
            isLoading: false
          })
        }
      },

      addReflection: async (reflectionData) => {
        set({ isLoading: true, error: null })

        try {
          const id = await dbCreateReflection(reflectionData)

          // 낙관적 업데이트
          set((state) => {
            state.reflections.unshift({
              ...reflectionData,
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

      editReflection: async (id, updates) => {
        set({ isLoading: true, error: null })

        try {
          const before = await db.reflections.get(id)
          await db.reflections.update(id, updates)

          // 감사 로그
          await logAudit({
            entity: 'reflection',
            entityId: String(id),
            action: 'update',
            userId: '',
            before,
            after: updates
          })

          // 낙관적 업데이트
          set((state) => {
            const index = state.reflections.findIndex(r => r.id === id)
            if (index !== -1) {
              state.reflections[index] = {
                ...state.reflections[index],
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

      removeReflection: async (id) => {
        set({ isLoading: true, error: null })

        try {
          const before = await db.reflections.get(id)
          await db.reflections.delete(id)

          // 감사 로그
          await logAudit({
            entity: 'reflection',
            entityId: String(id),
            action: 'delete',
            userId: '',
            before
          })

          // 낙관적 업데이트
          set((state) => {
            state.reflections = state.reflections.filter(r => r.id !== id)
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
    { name: 'ReflectionStore' }
  )
)
