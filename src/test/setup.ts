import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
	cleanup()
})

// Mock window and navigator for WebAuthn tests
if (typeof window === 'undefined') {
	global.window = {} as Window & typeof globalThis
}

if (typeof navigator === 'undefined') {
	global.navigator = {} as Navigator
}

// Mock localStorage
const localStorageMock = (() => {
	let store: Record<string, string> = {}

	return {
		getItem: (key: string) => store[key] || null,
		setItem: (key: string, value: string) => {
			store[key] = String(value)
		},
		removeItem: (key: string) => {
			delete store[key]
		},
		clear: () => {
			store = {}
		},
	}
})()

Object.defineProperty(window, 'localStorage', {
	value: localStorageMock,
})

// Also set it on global for Node.js environments
if (typeof global !== 'undefined') {
	// @ts-expect-error - Adding localStorage to global for tests
	global.localStorage = localStorageMock
}

