// Auth hooks for Firebase authentication

import { useMutation } from '@tanstack/react-query'
import { useRouter } from '@tanstack/react-router'
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from 'firebase/auth'
import { doc, setDoc, Timestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { authActions } from '@/lib/auth-store'
import { auth, db } from '@/lib/firebase'

export function useRegister() {
    const router = useRouter()

    return useMutation({
        mutationFn: async (data: {
            name: string
            email: string
            password: string
        }) => {
            // Create user with Firebase Auth
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                data.email.trim(),
                data.password,
            )

            const user = userCredential.user

            // Update display name
            await updateProfile(user, {
                displayName: data.name.trim(),
            })

            // Create user document in Firestore
            await setDoc(doc(db, 'users', user.uid), {
                id: user.uid,
                name: data.name.trim(),
                email: data.email.trim(),
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
            })

            // Update auth store
            authActions.login(user.uid, data.name.trim(), data.email.trim())

            return user
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
            // Sign in with Firebase Auth
            const userCredential = await signInWithEmailAndPassword(
                auth,
                data.email.trim(),
                data.password,
            )

            const user = userCredential.user

            // Update auth store
            authActions.login(
                user.uid,
                user.displayName || user.email || '',
                user.email || '',
            )

            return user
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
            await signOut(auth)
            authActions.logout()
            router.navigate({
                to: '/',
            })
        },
    }
}
