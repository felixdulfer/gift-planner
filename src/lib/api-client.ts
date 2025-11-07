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
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            try {
                const errorData: ApiError = await response.json()
                errorMessage = errorData.error || errorMessage
                console.error('Backend error response:', {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData,
                    errorString: JSON.stringify(errorData, null, 2),
                })
            } catch {
                // If JSON parsing fails, use the status text
                const text = await response.text().catch(() => '')
                if (text) {
                    console.error('Backend error response (non-JSON):', text)
                    errorMessage = text || errorMessage
                }
            }
            throw new Error(errorMessage)
        }

        // Handle empty responses
        if (
            response.status === 204 ||
            response.headers.get('content-length') === '0'
        ) {
            return {} as T
        }

        const text = await response.text()
        if (!text) {
            return {} as T
        }

        try {
            return JSON.parse(text) as T
        } catch (error) {
            console.error('Failed to parse JSON response:', text)
            throw new Error('Invalid JSON response from server')
        }
    }

    async get<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET' })
    }

    async post<T>(endpoint: string, data?: unknown): Promise<T> {
        if (endpoint.includes('/auth/register/finish') || endpoint.includes('/auth/login/finish')) {
            console.log('Sending credential data to:', endpoint, {
                data: data,
                dataString: JSON.stringify(data, null, 2),
            })
        }
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
