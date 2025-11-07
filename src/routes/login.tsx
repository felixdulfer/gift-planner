import { createFileRoute, Link } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLogin } from '@/hooks/use-auth'

export const Route = createFileRoute('/login')({
    component: LoginPage,
})

function LoginPage() {
    const emailId = useId()
    const passwordId = useId()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const login = useLogin()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!email.trim()) {
            return
        }

        if (!password) {
            return
        }

        login.mutate({ email: email.trim(), password })
    }

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Login</CardTitle>
                    <CardDescription>Sign in to your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor={emailId}>Email</Label>
                            <Input
                                id={emailId}
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Enter your email address"
                                required
                                disabled={login.isPending}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={passwordId}>Password</Label>
                            <Input
                                id={passwordId}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                disabled={login.isPending}
                            />
                        </div>
                        {login.isError && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {login.error instanceof Error
                                    ? login.error.message
                                    : 'Login failed'}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={login.isPending}
                        >
                            {login.isPending ? 'Logging in...' : 'Login'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Don't have an account?{' '}
                            <Link
                                to="/register"
                                className="text-primary hover:underline"
                            >
                                Register
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
