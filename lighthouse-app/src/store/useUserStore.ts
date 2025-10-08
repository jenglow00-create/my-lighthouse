import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'

interface AuthUser {
  id: string
  username: string
  email?: string
}

interface UserProfile {
  displayName: string
  bio?: string
  avatar?: string
}

interface UserState {
  currentUser: AuthUser | null
  profile: UserProfile | null
  isAuthenticated: boolean

  // Actions
  login: (user: AuthUser) => void
  logout: () => void
  updateProfile: (updates: Partial<UserProfile>) => void
  setUser: (user: AuthUser | null) => void
}

export const useUserStore = create<UserState>()(
  devtools(
    persist(
      (set) => ({
        currentUser: null,
        profile: null,
        isAuthenticated: false,

        login: (user) => {
          set({
            currentUser: user,
            isAuthenticated: true
          })
        },

        logout: () => {
          set({
            currentUser: null,
            profile: null,
            isAuthenticated: false
          })
        },

        updateProfile: (updates) => {
          set((state) => ({
            profile: state.profile
              ? { ...state.profile, ...updates }
              : null
          }))
        },

        setUser: (user) => {
          set({
            currentUser: user,
            isAuthenticated: !!user
          })
        }
      }),
      {
        name: 'user-storage',
        partialize: (state) => ({
          currentUser: state.currentUser,
          isAuthenticated: state.isAuthenticated
        })
      }
    ),
    { name: 'UserStore' }
  )
)
