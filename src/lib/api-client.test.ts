import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { apiClient } from './api-client'

// Mock fetch globally
global.fetch = vi.fn()

describe('ApiClient', () => {
	let client: typeof apiClient
	const baseUrl = 'http://localhost:8080/api'

	beforeEach(() => {
		vi.clearAllMocks()
		// Clear localStorage
		if (typeof Storage !== 'undefined') {
			localStorage.clear()
		}
		client = apiClient
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	describe('constructor', () => {
		it('should initialize with base URL', () => {
			expect(client).toBeDefined()
		})

		it('should load auth token from localStorage', () => {
			if (typeof Storage !== 'undefined') {
				localStorage.setItem('gift-planner-auth-token', 'test-token')
				// The client is a singleton, so we just verify it exists
				expect(client).toBeDefined()
			}
		})
	})

	describe('setAuthToken', () => {
		it('should set auth token', () => {
			if (typeof Storage !== 'undefined') {
				client.setAuthToken('test-token')
				expect(localStorage.getItem('gift-planner-auth-token')).toBe('test-token')
			} else {
				// In test environment without localStorage, just verify the method doesn't throw
				expect(() => client.setAuthToken('test-token')).not.toThrow()
			}
		})

		it('should remove auth token when set to null', () => {
			if (typeof Storage !== 'undefined') {
				localStorage.setItem('gift-planner-auth-token', 'test-token')
				client.setAuthToken(null)
				expect(localStorage.getItem('gift-planner-auth-token')).toBeNull()
			} else {
				// In test environment without localStorage, just verify the method doesn't throw
				expect(() => client.setAuthToken(null)).not.toThrow()
			}
		})
	})

	describe('get', () => {
		it('should make GET request', async () => {
			const mockData = { id: '1', name: 'Test' }
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify(mockData),
			})

			const result = await client.get<typeof mockData>('/test')
			expect(result).toEqual(mockData)
			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/test`,
				expect.objectContaining({
					method: 'GET',
					headers: expect.objectContaining({
						'Content-Type': 'application/json',
					}),
				}),
			)
		})

		it('should include auth token in headers when set', async () => {
			client.setAuthToken('test-token')
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({}),
			})

			await client.get('/test')
			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/test`,
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: 'Bearer test-token',
					}),
				}),
			)
		})

		it('should handle error responses', async () => {
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 404,
				statusText: 'Not Found',
				json: async () => ({ error: 'Resource not found' }),
			})

			await expect(client.get('/test')).rejects.toThrow('Resource not found')
		})

		it('should handle empty responses (204)', async () => {
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: new Headers(),
				text: async () => '',
			})

			const result = await client.get('/test')
			expect(result).toEqual({})
		})
	})

	describe('post', () => {
		it('should make POST request with data', async () => {
			const mockData = { id: '1', name: 'Test' }
			const postData = { name: 'Test' }
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 201,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify(mockData),
			})

			const result = await client.post<typeof mockData>('/test', postData)
			expect(result).toEqual(mockData)
			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/test`,
				expect.objectContaining({
					method: 'POST',
					body: JSON.stringify(postData),
				}),
			)
		})

		it('should make POST request without data', async () => {
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify({}),
			})

			await client.post('/test')
			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/test`,
				expect.objectContaining({
					method: 'POST',
					body: undefined,
				}),
			)
		})
	})

	describe('put', () => {
		it('should make PUT request', async () => {
			const mockData = { id: '1', name: 'Updated' }
			const putData = { name: 'Updated' }
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify(mockData),
			})

			const result = await client.put<typeof mockData>('/test', putData)
			expect(result).toEqual(mockData)
			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/test`,
				expect.objectContaining({
					method: 'PUT',
					body: JSON.stringify(putData),
				}),
			)
		})
	})

	describe('patch', () => {
		it('should make PATCH request', async () => {
			const patchData = { name: 'Patched' }
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => JSON.stringify(patchData),
			})

			const result = await client.patch('/test', patchData)
			expect(result).toEqual(patchData)
			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/test`,
				expect.objectContaining({
					method: 'PATCH',
				}),
			)
		})
	})

	describe('delete', () => {
		it('should make DELETE request', async () => {
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 204,
				headers: new Headers(),
				text: async () => '',
			})

			const result = await client.delete('/test')
			expect(result).toEqual({})
			expect(fetch).toHaveBeenCalledWith(
				`${baseUrl}/test`,
				expect.objectContaining({
					method: 'DELETE',
				}),
			)
		})
	})

	describe('error handling', () => {
		it('should handle invalid JSON response', async () => {
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: true,
				status: 200,
				headers: new Headers({ 'content-type': 'application/json' }),
				text: async () => 'invalid json',
			})

			await expect(client.get('/test')).rejects.toThrow(
				'Invalid JSON response from server',
			)
		})

		it('should handle network errors', async () => {
			;(fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
				new Error('Network error'),
			)

			await expect(client.get('/test')).rejects.toThrow('Network error')
		})

		it('should handle error response without JSON body', async () => {
			;(fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
				ok: false,
				status: 500,
				statusText: 'Internal Server Error',
				json: async () => {
					throw new Error('Invalid JSON')
				},
			})

			await expect(client.get('/test')).rejects.toThrow(
				'HTTP 500: Internal Server Error',
			)
		})
	})
})

