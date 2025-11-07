import { useForm } from '@tanstack/react-form'
import { createFileRoute, Link } from '@tanstack/react-router'
import { toast } from 'sonner'
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
import { useRegister } from '@/hooks/use-auth'

export const Route = createFileRoute('/register')({
    component: RegisterPage,
})

function RegisterPage() {
    const register = useRegister()

    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
            password: '',
            confirmPassword: '',
        },
        onSubmit: async ({ value }) => {
            // Validate password match
            if (value.password !== value.confirmPassword) {
                toast.error('Passwords do not match')
                return
            }

            // Validate password length
            if (value.password.length < 6) {
                toast.error('Password must be at least 6 characters')
                return
            }

            // Validate required fields
            if (!value.name?.trim()) {
                toast.error('Name is required')
                return
            }

            if (!value.email?.trim()) {
                toast.error('Email is required')
                return
            }

            try {
                register.mutate({
                    name: value.name.trim(),
                    email: value.email.trim(),
                    password: value.password,
                })
            } catch (error) {
                console.error('Error registering user:', error)
                toast.error('Failed to register user', {
                    description:
                        error instanceof Error ? error.message : String(error),
                })
            }
        },
    })

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>
                        Create a new account to get started
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        onSubmit={async (e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            await form.handleSubmit()
                        }}
                        className="space-y-4"
                    >
                        <form.Field
                            name="name"
                            validators={{
                                onChange: ({ value }) =>
                                    !value || value.trim() === ''
                                        ? 'Name is required'
                                        : undefined,
                                onBlur: ({ value }) =>
                                    !value || value.trim() === ''
                                        ? 'Name is required'
                                        : undefined,
                            }}
                        >
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Name</Label>
                                    <Input
                                        id={field.name}
                                        type="text"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder="Enter your name"
                                        required
                                        disabled={register.isPending}
                                    />
                                    {field.state.meta.errors && (
                                        <p className="text-sm text-destructive">
                                            {field.state.meta.errors[0]}
                                        </p>
                                    )}
                                </div>
                            )}
                        </form.Field>
                        <form.Field
                            name="email"
                            validators={{
                                onChange: ({ value }) => {
                                    if (!value || value.trim() === '') {
                                        return 'Email is required'
                                    }
                                    const emailRegex =
                                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                                    if (!emailRegex.test(value.trim())) {
                                        return 'Please enter a valid email address'
                                    }
                                    return undefined
                                },
                                onBlur: ({ value }) => {
                                    if (!value || value.trim() === '') {
                                        return 'Email is required'
                                    }
                                    const emailRegex =
                                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                                    if (!emailRegex.test(value.trim())) {
                                        return 'Please enter a valid email address'
                                    }
                                    return undefined
                                },
                            }}
                        >
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Email</Label>
                                    <Input
                                        id={field.name}
                                        type="email"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder="Enter your email"
                                        required
                                        disabled={register.isPending}
                                    />
                                    {field.state.meta.errors && (
                                        <p className="text-sm text-destructive">
                                            {field.state.meta.errors[0]}
                                        </p>
                                    )}
                                </div>
                            )}
                        </form.Field>
                        <form.Field
                            name="password"
                            validators={{
                                onChange: ({ value }) => {
                                    if (!value || value.length < 6) {
                                        return 'Password must be at least 6 characters'
                                    }
                                    return undefined
                                },
                                onBlur: ({ value }) => {
                                    if (!value || value.length < 6) {
                                        return 'Password must be at least 6 characters'
                                    }
                                    return undefined
                                },
                            }}
                        >
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>Password</Label>
                                    <Input
                                        id={field.name}
                                        type="password"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder="Enter your password"
                                        required
                                        disabled={register.isPending}
                                    />
                                    {field.state.meta.errors && (
                                        <p className="text-sm text-destructive">
                                            {field.state.meta.errors[0]}
                                        </p>
                                    )}
                                </div>
                            )}
                        </form.Field>
                        <form.Field
                            name="confirmPassword"
                            validators={{
                                onChange: ({ value, fieldApi }) => {
                                    const password =
                                        fieldApi.form.getFieldValue('password')
                                    if (value !== password) {
                                        return 'Passwords do not match'
                                    }
                                    return undefined
                                },
                                onBlur: ({ value, fieldApi }) => {
                                    const password =
                                        fieldApi.form.getFieldValue('password')
                                    if (value !== password) {
                                        return 'Passwords do not match'
                                    }
                                    return undefined
                                },
                            }}
                        >
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor={field.name}>
                                        Confirm Password
                                    </Label>
                                    <Input
                                        id={field.name}
                                        type="password"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder="Confirm your password"
                                        required
                                        disabled={register.isPending}
                                    />
                                    {field.state.meta.errors && (
                                        <p className="text-sm text-destructive">
                                            {field.state.meta.errors[0]}
                                        </p>
                                    )}
                                </div>
                            )}
                        </form.Field>
                        {register.isError && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {register.error instanceof Error
                                    ? register.error.message
                                    : 'Registration failed'}
                            </div>
                        )}
                        <Button
                            type="submit"
                            className="w-full"
                            disabled={register.isPending}
                        >
                            {register.isPending
                                ? 'Registering...'
                                : 'Create Account'}
                        </Button>
                        <div className="text-center text-sm text-muted-foreground">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="text-primary hover:underline"
                            >
                                Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
