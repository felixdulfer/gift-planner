// Utility functions for gift planner

import { authStore } from '@/lib/auth-store'

export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export function getCurrentTimestamp(): number {
    return Date.now()
}

// Get current user ID from auth store
export function getCurrentUserId(): string {
    // Check if we're in a browser environment (not SSR)
    if (typeof window === 'undefined') {
        // Return a temporary ID during SSR - will be replaced on client
        return 'ssr-temp-user-id'
    }
    const authState = authStore.state
    if (authState.user?.id) {
        return authState.user.id
    }
    // Fallback: return empty string if not authenticated
    return ''
}

export function setCurrentUserId(userId: string): void {
    // This function is deprecated - user ID is now managed by Supabase auth
    // Only set if we're in a browser environment
    if (typeof window !== 'undefined') {
        localStorage.setItem('gift-planner-current-user-id', userId)
    }
}
