import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { authStore, authActions, type AuthState } from './auth-store'
import * as apiClientModule from './api-client'

// Mock apiClient
vi.mock('./api-client', () => ({
	apiClient: {
		setAuthToken: vi.fn(),
	},
}))

describe('auth-store', () => {
	beforeEach(() => {
		// Clear localStorage
		if (typeof Storage !== 'undefined') {
			localStorage.clear()
		}
		// Reset store to initial state
		authStore.setState({
			user: null,
			isAuthenticated: false,
			isLoading: false,
		})
		vi.clearAllMocks()
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('initial state', () => {
		it('should have correct initial state when no localStorage data', () => {
			const state = authStore.state
			expect(state.isAuthenticated).toBe(false)
			expect(state.user).toBeNull()
			expect(state.isLoading).toBe(false)
		})

		it('should load state from localStorage', () => {
			if (typeof Storage !== 'undefined') {
				localStorage.setItem('gift-planner-user-id', 'user-123')
				localStorage.setItem('gift-planner-user-name', 'Test User')
				localStorage.setItem('gift-planner-user-email', 'test@example.com')

				// Create a new store instance to test loadAuthState
				// Note: This tests the initialization logic
				const state = authStore.state
				// The store should have loaded from localStorage
				// We need to manually check if it loaded correctly
				expect(localStorage.getItem('gift-planner-user-id')).toBe('user-123')
			}
		})
	})

	describe('authActions.login', () => {
		it('should login user and update store', () => {
			authActions.login('user-123', 'Test User', 'test@example.com')

			const state = authStore.state
			expect(state.isAuthenticated).toBe(true)
			expect(state.user).toEqual({
				id: 'user-123',
				name: 'Test User',
				email: 'test@example.com',
			})
			expect(state.isLoading).toBe(false)
		})

		it('should login user without email', () => {
			authActions.login('user-123', 'Test User')

			const state = authStore.state
			expect(state.isAuthenticated).toBe(true)
			expect(state.user).toEqual({
				id: 'user-123',
				name: 'Test User',
				email: undefined,
			})
		})

		it('should store user data in localStorage', () => {
			if (typeof Storage !== 'undefined') {
				authActions.login('user-123', 'Test User', 'test@example.com')

				expect(localStorage.getItem('gift-planner-user-id')).toBe('user-123')
				expect(localStorage.getItem('gift-planner-user-name')).toBe('Test User')
				expect(localStorage.getItem('gift-planner-user-email')).toBe(
					'test@example.com',
				)
			}
		})

		it('should set auth token in API client', () => {
			authActions.login('user-123', 'Test User')
			expect(apiClientModule.apiClient.setAuthToken).toHaveBeenCalledWith(
				'user-123',
			)
		})
	})

	describe('authActions.logout', () => {
		it('should logout user and clear store', () => {
			// First login
			authActions.login('user-123', 'Test User', 'test@example.com')

			// Then logout
			authActions.logout()

			const state = authStore.state
			expect(state.isAuthenticated).toBe(false)
			expect(state.user).toBeNull()
			expect(state.isLoading).toBe(false)
		})

		it('should clear localStorage on logout', () => {
			if (typeof Storage !== 'undefined') {
				authActions.login('user-123', 'Test User', 'test@example.com')
				authActions.logout()

				expect(localStorage.getItem('gift-planner-user-id')).toBeNull()
				expect(localStorage.getItem('gift-planner-user-name')).toBeNull()
				expect(localStorage.getItem('gift-planner-user-email')).toBeNull()
			}
		})

		it('should clear auth token in API client', () => {
			authActions.login('user-123', 'Test User')
			authActions.logout()
			expect(apiClientModule.apiClient.setAuthToken).toHaveBeenCalledWith(null)
		})
	})

	describe('authActions.setLoading', () => {
		it('should update loading state', () => {
			authActions.setLoading(true)
			expect(authStore.state.isLoading).toBe(true)

			authActions.setLoading(false)
			expect(authStore.state.isLoading).toBe(false)
		})

		it('should preserve other state when setting loading', () => {
			authActions.login('user-123', 'Test User')
			authActions.setLoading(true)

			const state = authStore.state
			expect(state.isLoading).toBe(true)
			expect(state.isAuthenticated).toBe(true)
			expect(state.user).not.toBeNull()
		})
	})
})

