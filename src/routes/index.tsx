import { createFileRoute, Link } from '@tanstack/react-router'
import { Calendar, Gift, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { useStore } from '@tanstack/react-store'
import { authStore } from '@/lib/auth-store'

export const Route = createFileRoute('/')({ component: App })

function App() {
    const authState = useStore(authStore)

    return (
        <div className="flex min-h-screen items-center justify-center p-4">
            <div className="w-full max-w-4xl">
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-2 text-center">
                        <h1 className="text-3xl font-bold tracking-tight">
                            Welcome to Gift Planner
                        </h1>
                        <p className="text-muted-foreground">
                            Plan gifts together with your groups. Create groups,
                            organize events, manage wishlists, and assign gifts
                            to group members. Never forget a gift again!
                        </p>
                    </div>

                    <div className="flex items-center justify-center gap-4">
                        {authState.isAuthenticated ? (
                            <Link to="/dashboard">
                                <Button size="lg">Go to Dashboard</Button>
                            </Link>
                        ) : (
                            <>
                                <Link to="/register">
                                    <Button size="lg">Get Started</Button>
                                </Link>
                                <Link to="/login">
                                    <Button size="lg" variant="outline">
                                        Login
                                    </Button>
                                </Link>
                            </>
                        )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-3 mt-6">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    <CardTitle>Create Groups</CardTitle>
                                </div>
                                <CardDescription>
                                    Organize your gift planning by creating
                                    groups with friends and family members.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <CardTitle>Manage Events</CardTitle>
                                </div>
                                <CardDescription>
                                    Create events for birthdays, holidays, or
                                    any special occasion that needs gift
                                    planning.
                                </CardDescription>
                            </CardHeader>
                        </Card>

                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-2">
                                    <Gift className="h-5 w-5 text-primary" />
                                    <CardTitle>Track Gifts</CardTitle>
                                </div>
                                <CardDescription>
                                    Assign gifts to group members and track
                                    purchase status to avoid duplicates.
                                </CardDescription>
                            </CardHeader>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
