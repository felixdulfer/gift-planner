// API client for backend communication

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

export interface ApiError {
    error: string
}

class ApiClient {
    private baseUrl: string
    private authToken: string | null = null

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl
        // Load auth token from localStorage
        if (typeof window !== 'undefined') {
            this.authToken = localStorage.getItem('gift-planner-auth-token')
        }
    }

    setAuthToken(token: string | null) {
        this.authToken = token
        if (typeof window !== 'undefined') {
            if (token) {
                localStorage.setItem('gift-planner-auth-token', token)
            } else {
                localStorage.removeItem('gift-planner-auth-token')
            }
        }
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {},
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        }

        if (this.authToken) {
            headers.Authorization = `Bearer ${this.authToken}`
        }

        const response = await fetch(url, {
            ...options,
            headers,
        })

        if (!response.ok) {
            const error: ApiError = await response.json().catch(() => ({
                error: `HTTP ${response.status}: ${response.statusText}`,
            }))
            throw new Error(error.error || 'API request failed')
        }

        // Handle empty responses
        if (
            response.status === 204 ||
            response.headers.get('content-length') === '0'
        ) {
            return {} as T
        }

        return response.json()
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' })
    }

    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: data ? JSON.stringify(data) : undefined,
        })
    }

    async put<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        })
    }

    async patch<T>(endpoint: string, data: unknown): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data),
        })
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' })
    }
}

export const apiClient = new ApiClient(API_BASE_URL)
