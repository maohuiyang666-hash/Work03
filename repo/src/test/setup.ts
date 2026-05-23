import '@testing-library/jest-dom'
import { beforeEach } from 'vitest'

// Mock requestAnimationFrame
const originalRAF = window.requestAnimationFrame
const originalCAF = window.cancelAnimationFrame

beforeEach(() => {
  let callback: ((time: number) => void) | null = null
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  window.requestAnimationFrame = (cb: (time: number) => void) => {
    callback = cb
    timeoutId = setTimeout(() => {
      if (callback) callback(Date.now())
    }, 0) as ReturnType<typeof setTimeout>
    return (timeoutId as unknown as number)
  }

  window.cancelAnimationFrame = (id: number) => {
    if (timeoutId) clearTimeout(timeoutId)
    callback = null
  }
})

afterEach(() => {
  window.requestAnimationFrame = originalRAF
  window.cancelAnimationFrame = originalCAF
})
