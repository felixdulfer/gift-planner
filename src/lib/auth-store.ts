// Auth store for managing authentication state with Supabase

import { Store } from '@tanstack/store'
import { supabase } from './supabase'
import { apiClient } from './api-client'

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

// Load auth state from Supabase session
async function loadAuthState(): Promise<AuthState> {
	if (typeof window === 'undefined') {
		return initialState
	}

	try {
		const {
			data: { session },
		} = await supabase.auth.getSession()

		if (session?.user) {
			// Set auth token in API client
			apiClient.setAuthToken(session.access_token)

			return {
				user: {
					id: session.user.id,
					name: session.user.user_metadata?.name || session.user.email || '',
					email: session.user.email || '',
				},
				isAuthenticated: true,
				isLoading: false,
			}
		}
	} catch (error) {
		console.error('Error loading auth state:', error)
	}

	return { ...initialState, isLoading: false }
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
	supabase.auth.onAuthStateChange((_event, session) => {
		if (session?.user) {
			apiClient.setAuthToken(session.access_token)
			authStore.setState({
				user: {
					id: session.user.id,
					name: session.user.user_metadata?.name || session.user.email || '',
					email: session.user.email || '',
				},
				isAuthenticated: true,
				isLoading: false,
			})
		} else {
			apiClient.setAuthToken(null)
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
		// Get the current session to get the access token
		supabase.auth.getSession().then(({ data: { session } }) => {
			if (session) {
				apiClient.setAuthToken(session.access_token)
			}
		})

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
		// Clear auth token in API client
		apiClient.setAuthToken(null)

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

