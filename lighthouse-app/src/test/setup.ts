import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import 'fake-indexeddb/auto'

// 각 테스트 후 정리
afterEach(() => {
  cleanup()
})

// localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
    get length() {
      return Object.keys(store).length
    },
    key: (index: number) => {
      const keys = Object.keys(store)
      return keys[index] || null
    }
  }
})()

global.localStorage = localStorageMock as any

// crypto.randomUUID mock (Node 환경용)
if (!global.crypto) {
  global.crypto = {
    randomUUID: () => Math.random().toString(36).substring(2, 15)
  } as any
}
