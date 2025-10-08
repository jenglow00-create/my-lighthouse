import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface UIState {
  // Modal states
  isAuthModalOpen: boolean
  isSettingsModalOpen: boolean

  // Toast notifications
  toasts: Toast[]

  // Loading states
  globalLoading: boolean

  // Theme
  theme: 'light' | 'dark'

  // Actions
  openAuthModal: () => void
  closeAuthModal: () => void
  openSettingsModal: () => void
  closeSettingsModal: () => void

  addToast: (message: string, type: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void

  setGlobalLoading: (loading: boolean) => void
  toggleTheme: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      isAuthModalOpen: false,
      isSettingsModalOpen: false,
      toasts: [],
      globalLoading: false,
      theme: 'light',

      openAuthModal: () => set({ isAuthModalOpen: true }),
      closeAuthModal: () => set({ isAuthModalOpen: false }),
      openSettingsModal: () => set({ isSettingsModalOpen: true }),
      closeSettingsModal: () => set({ isSettingsModalOpen: false }),

      addToast: (message, type) => {
        const id = crypto.randomUUID()
        set((state) => ({
          toasts: [
            ...state.toasts,
            { id, message, type }
          ]
        }))

        // 3초 후 자동 제거
        setTimeout(() => {
          set((state) => ({
            toasts: state.toasts.filter(t => t.id !== id)
          }))
        }, 3000)
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }))
      },

      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      toggleTheme: () => {
        set((state) => ({
          theme: state.theme === 'light' ? 'dark' : 'light'
        }))
      }
    }),
    { name: 'UIStore' }
  )
)
