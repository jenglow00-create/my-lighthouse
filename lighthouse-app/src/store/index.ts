export { useSessionStore } from './useSessionStore'
export { useSubjectStore } from './useSubjectStore'
export { useReflectionStore } from './useReflectionStore'
export { useUserStore } from './useUserStore'
export { useUIStore } from './useUIStore'

// 모든 스토어 초기화
export async function initializeStores() {
  const { useSessionStore } = await import('./useSessionStore')
  const { useSubjectStore } = await import('./useSubjectStore')
  const { useReflectionStore } = await import('./useReflectionStore')

  const { loadSessions } = useSessionStore.getState()
  const { loadSubjects } = useSubjectStore.getState()
  const { loadReflections } = useReflectionStore.getState()

  await Promise.all([
    loadSessions(),
    loadSubjects(),
    loadReflections()
  ])
}
