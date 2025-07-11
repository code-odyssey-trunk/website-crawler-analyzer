import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock environment variables
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// More complete localStorage mock
class LocalStorageMock {
  store: Record<string, string> = {}
  length = 0
  key = (index: number) => Object.keys(this.store)[index] || null
  getItem = (key: string) => this.store[key] || null
  setItem = (key: string, value: string) => { this.store[key] = value; this.length = Object.keys(this.store).length }
  removeItem = (key: string) => { delete this.store[key]; this.length = Object.keys(this.store).length }
  clear = () => { this.store = {}; this.length = 0 }
}
// @ts-ignore
global.localStorage = new LocalStorageMock() 