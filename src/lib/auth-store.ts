// Auth store for managing authentication state with Firebase

import { Store } from '@tanstack/store'
import { type User as FirebaseUser, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

export interface AuthState {
    user: { id: string; name: string; email: string } | null
    isAuthenticated: boolean
    isLoading: boolean
}

const initialState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true,
}

// Load auth state from Firebase session
async function loadAuthState(): Promise<AuthState> {
    if (typeof window === 'undefined') {
        return initialState
    }

    try {
        // Firebase auth state is managed by onAuthStateChanged
        // This will be set by the listener below
        return { ...initialState, isLoading: true }
    } catch (error) {
        console.error('Error loading auth state:', error)
        return { ...initialState, isLoading: false }
    }
}

// Initialize store with loading state, then load actual state
export const authStore = new Store<AuthState>(initialState)

// Load initial auth state
if (typeof window !== 'undefined') {
    loadAuthState().then((state) => {
        authStore.setState(state)
    })
}

// Listen for auth state changes
if (typeof window !== 'undefined') {
    onAuthStateChanged(auth, (firebaseUser: FirebaseUser | null) => {
        if (firebaseUser) {
            authStore.setState({
                user: {
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || firebaseUser.email || '',
                    email: firebaseUser.email || '',
                },
                isAuthenticated: true,
                isLoading: false,
            })
        } else {
            authStore.setState({
                user: null,
                isAuthenticated: false,
                isLoading: false,
            })
        }
    })
}

// Auth actions
export const authActions = {
    login: (userId: string, userName: string, userEmail: string) => {
        // Update store
        authStore.setState({
            user: {
                id: userId,
                name: userName,
                email: userEmail,
            },
            isAuthenticated: true,
            isLoading: false,
        })
    },

    logout: () => {
        // Update store
        authStore.setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
        })
    },

    setLoading: (isLoading: boolean) => {
        authStore.setState((state) => ({ ...state, isLoading }))
    },
}
