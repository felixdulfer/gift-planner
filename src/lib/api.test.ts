import { describe, it, expect, beforeEach, vi } from 'vitest'
import { authApi, usersApi } from './api'
import * as apiClientModule from './api-client'
import * as userSchemaModule from '../db-collections/gift-planner'

// Mock apiClient
vi.mock('./api-client', () => ({
	apiClient: {
		post: vi.fn(),
		get: vi.fn(),
		put: vi.fn(),
		delete: vi.fn(),
	},
}))

// Mock UserSchema
vi.mock('../db-collections/gift-planner', () => ({
	UserSchema: {
		parse: vi.fn(),
	},
}))

describe('api', () => {
	beforeEach(() => {
		vi.clearAllMocks()
	})

	describe('authApi', () => {
		describe('createUser', () => {
			it('should create user and transform response', async () => {
				const mockResponse = {
					id: 'user-123',
					name: 'Test User',
					email: 'test@example.com',
					createdAt: '2025-01-01T00:00:00Z',
				}

				const parsedUser = {
					id: 'user-123',
					name: 'Test User',
					email: 'test@example.com',
					createdAt: new Date('2025-01-01T00:00:00Z').getTime(),
				}

				vi.spyOn(apiClientModule.apiClient, 'post').mockResolvedValue(mockResponse)
				vi.spyOn(userSchemaModule.UserSchema, 'parse').mockReturnValue(parsedUser)

				const result = await authApi.createUser({
					name: 'Test User',
					email: 'test@example.com',
				})

				expect(result).toEqual(parsedUser)
				expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
					'/auth/users',
					{ name: 'Test User', email: 'test@example.com' },
				)
			})

			it('should handle validation errors with fallback', async () => {
				const mockResponse = {
					id: 'user-123',
					name: 'Test User',
					createdAt: '2025-01-01T00:00:00Z',
				}

				vi.spyOn(apiClientModule.apiClient, 'post').mockResolvedValue(mockResponse)
				vi.spyOn(userSchemaModule.UserSchema, 'parse').mockImplementation(() => {
					throw new Error('Validation failed')
				})

				const result = await authApi.createUser({ name: 'Test User' })

				expect(result.id).toBe('user-123')
				expect(result.name).toBe('Test User')
				expect(result.createdAt).toBeInstanceOf(Number)
			})
		})

		describe('beginRegistration', () => {
			it('should call begin registration endpoint', async () => {
				const mockResponse = {
					sessionId: 'session-123',
					session: {},
				}

				vi.spyOn(apiClientModule.apiClient, 'post').mockResolvedValue(mockResponse)

				const result = await authApi.beginRegistration('user-123')
				expect(result).toEqual(mockResponse)
				expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
					'/auth/register/begin',
					{ userId: 'user-123' },
				)
			})
		})

		describe('finishRegistration', () => {
			it('should call finish registration endpoint', async () => {
				const mockResponse = { message: 'Registration successful' }
				const credential = {
					id: 'cred-123',
					rawId: 'raw-123',
					response: {},
					type: 'public-key',
				}

				vi.spyOn(apiClientModule.apiClient, 'post').mockResolvedValue(mockResponse)

				const result = await authApi.finishRegistration(
					'user-123',
					'session-123',
					credential,
				)

				expect(result).toEqual(mockResponse)
				expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
					'/auth/register/finish',
					{
						userId: 'user-123',
						sessionId: 'session-123',
						credential,
					},
				)
			})
		})

		describe('beginLogin', () => {
			it('should call begin login endpoint', async () => {
				const mockResponse = {
					sessionId: 'session-123',
					session: {},
				}

				vi.spyOn(apiClientModule.apiClient, 'post').mockResolvedValue(mockResponse)

				const result = await authApi.beginLogin('user-123')
				expect(result).toEqual(mockResponse)
				expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
					'/auth/login/begin',
					{ userId: 'user-123' },
				)
			})
		})

		describe('finishLogin', () => {
			it('should call finish login endpoint', async () => {
				const mockResponse = { message: 'Login successful' }
				const credential = {
					id: 'cred-123',
					rawId: 'raw-123',
					response: {},
					type: 'public-key',
				}

				vi.spyOn(apiClientModule.apiClient, 'post').mockResolvedValue(mockResponse)

				const result = await authApi.finishLogin('user-123', 'session-123', credential)

				expect(result).toEqual(mockResponse)
				expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
					'/auth/login/finish',
					{
						userId: 'user-123',
						sessionId: 'session-123',
						credential,
					},
				)
			})
		})
	})

	describe('usersApi', () => {
		it('should get all users', async () => {
			const mockUsers = [
				{ id: 'user-1', name: 'User 1', createdAt: 1234567890 },
				{ id: 'user-2', name: 'User 2', createdAt: 1234567890 },
			]

			vi.spyOn(apiClientModule.apiClient, 'get').mockResolvedValue(mockUsers)

			const result = await usersApi.getAll()
			expect(result).toEqual(mockUsers)
			expect(apiClientModule.apiClient.get).toHaveBeenCalledWith('/users')
		})

		it('should get user by id', async () => {
			const mockUser = {
				id: 'user-123',
				name: 'Test User',
				createdAt: 1234567890,
			}

			vi.spyOn(apiClientModule.apiClient, 'get').mockResolvedValue(mockUser)

			const result = await usersApi.getById('user-123')
			expect(result).toEqual(mockUser)
			expect(apiClientModule.apiClient.get).toHaveBeenCalledWith('/users/user-123')
		})

		it('should update user', async () => {
			const mockUser = {
				id: 'user-123',
				name: 'Updated User',
				createdAt: 1234567890,
			}

			vi.spyOn(apiClientModule.apiClient, 'put').mockResolvedValue(mockUser)

			const result = await usersApi.update('user-123', { name: 'Updated User' })
			expect(result).toEqual(mockUser)
			expect(apiClientModule.apiClient.put).toHaveBeenCalledWith('/users/user-123', {
				name: 'Updated User',
			})
		})
	})
})
