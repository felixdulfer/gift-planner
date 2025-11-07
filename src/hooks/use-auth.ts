// Auth hooks for Supabase authentication

import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { authActions } from '@/lib/auth-store'
import { supabase } from '@/lib/supabase'

export function useRegister() {
    const router = useRouter()

    return useMutation({
        mutationFn: async (data: {
            name: string
            email: string
            password: string
        }) => {
            // Sign up with Supabase
            const { data: authData, error } = await supabase.auth.signUp({
                email: data.email.trim(),
                password: data.password,
                options: {
                    data: {
                        name: data.name.trim(),
                    },
                },
            })

            if (error) {
                throw new Error(error.message)
            }

            if (!authData.user) {
                throw new Error('Failed to create user account')
            }

            // Update auth store
            authActions.login(
                authData.user.id,
                authData.user.user_metadata?.name || data.name.trim(),
                authData.user.email || data.email.trim(),
            )

            return authData.user
        },
        onSuccess: () => {
            router.navigate({
                to: '/dashboard',
            })
        },
        onError: (error) => {
            console.error('Error registering user:', error)
            toast.error('Failed to register user', {
                description:
                    error instanceof Error ? error.message : String(error),
            })
        },
    })
}

export function useLogin() {
    const router = useRouter()

    return useMutation({
        mutationFn: async (data: { email: string; password: string }) => {
            // Sign in with Supabase
            const { data: authData, error } =
                await supabase.auth.signInWithPassword({
                    email: data.email.trim(),
                    password: data.password,
                })

            if (error) {
                throw new Error(error.message)
            }

            if (!authData.user) {
                throw new Error('Failed to sign in')
            }

            // Update auth store
            authActions.login(
                authData.user.id,
                authData.user.user_metadata?.name || authData.user.email || '',
                authData.user.email || '',
            )

            return authData.user
        },
        onSuccess: () => {
            router.navigate({
                to: '/dashboard',
            })
        },
        onError: (error) => {
            console.error('Error logging in:', error)
            toast.error('Failed to log in', {
                description:
                    error instanceof Error ? error.message : String(error),
            })
        },
    })
}

export function useLogout() {
    const router = useRouter()

    return {
        logout: async () => {
            await supabase.auth.signOut()
            authActions.logout()
            router.navigate({
                to: '/',
            })
        },
    }
}
