// Protected route component that requires authentication

import { Navigate, useRouterState } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/lib/auth-store'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const authState = useStore(authStore)
    const router = useRouterState()

    // Show loading state while checking auth
    if (authState.isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-muted-foreground">Loading...</div>
            </div>
        )
    }

    // Redirect to login if not authenticated
    if (!authState.isAuthenticated) {
        return (
            <Navigate
                to="/login"
                search={{
                    redirect: router.location.pathname,
                }}
            />
        )
    }

    return <>{children}</>
}
