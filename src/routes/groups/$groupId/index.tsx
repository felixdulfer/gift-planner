import { useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Users } from 'lucide-react'
import { CreateEventDialog } from '@/components/gift-planner/CreateEventDialog'
import {
    AddUserDialog,
    JoinGroupDialog,
} from '@/components/gift-planner/UserManagement'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    eventsCollection,
    groupMembersCollection,
    groupsCollection,
    usersCollection,
} from '@/db-collections'
import { usePersistCollection } from '@/utils/persistence'

export const Route = createFileRoute('/groups/$groupId/')({
    ssr: false,
    component: GroupDetailPage,
})

function GroupDetailPage() {
    const { groupId } = Route.useParams()
    const group = useLiveQuery(groupsCollection, () => ({
        filter: { id: groupId },
        single: true,
    }))
    const events = useLiveQuery(eventsCollection, () => ({
        filter: { groupId },
    }))
    const groupMembers = useLiveQuery(groupMembersCollection, () => ({
        filter: { groupId },
    }))
    const users = useLiveQuery(usersCollection, () => ({
        filter: {},
    }))

    // Persist collections
    // Get all groups for persistence (not just the single one)
    const allGroups = useLiveQuery(groupsCollection, () => ({
        filter: {},
    }))
    usePersistCollection(eventsCollection, 'events', events.data)
    usePersistCollection(
        groupMembersCollection,
        'groupMembers',
        groupMembers.data,
    )
    usePersistCollection(usersCollection, 'users', users.data)
    usePersistCollection(groupsCollection, 'groups', allGroups.data)

    if (!group.data) {
        return (
            <div className="container mx-auto py-8 px-4">
                <p>Group not found</p>
            </div>
        )
    }

    const memberCount = groupMembers.data?.length ?? 0
    const memberNames = groupMembers.data
        ?.map((member) => {
            const user = users.data?.find((u) => u.id === member.userId)
            return user?.name ?? 'Unknown'
        })
        .slice(0, 5)

    return (
        <div className="container mx-auto py-8 px-4 max-w-6xl">
            <div className="mb-6">
                <Link to="/groups">
                    <Button variant="ghost" size="sm" className="mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Groups
                    </Button>
                </Link>
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">
                            {group.data.name}
                        </h1>
                        {group.data.description && (
                            <p className="text-muted-foreground mt-2">
                                {group.data.description}
                            </p>
                        )}
                        <div className="flex items-center gap-4 mt-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Users className="w-4 h-4" />
                                <span>
                                    {memberCount}{' '}
                                    {memberCount === 1 ? 'member' : 'members'}
                                </span>
                            </div>
                        </div>
                        {memberNames && memberNames.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {memberNames.map((name) => (
                                    <Badge key={name} variant="secondary">
                                        {name}
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <AddUserDialog />
                        <JoinGroupDialog groupId={groupId} />
                        <CreateEventDialog groupId={groupId} />
                    </div>
                </div>
            </div>

            <Separator className="my-6" />

            <div>
                <h2 className="text-2xl font-semibold mb-4">Events</h2>
                {events.data && events.data.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {events.data.map((event) => (
                            <EventCard
                                key={event.id}
                                event={event}
                                groupId={groupId}
                            />
                        ))}
                    </div>
                ) : (
                    <Card className="text-center py-12">
                        <CardContent>
                            <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                            <CardTitle className="mb-2">
                                No events yet
                            </CardTitle>
                            <CardDescription className="mb-6">
                                Create an event to start planning gifts
                            </CardDescription>
                            <CreateEventDialog groupId={groupId} />
                        </CardContent>
                    </Card>
                )}
            </div>

            <Outlet />
        </div>
    )
}

function EventCard({
    event,
    groupId,
}: {
    event: { id: string; name: string; date?: number }
    groupId: string
}) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                {event.date && (
                    <CardDescription>
                        {new Date(event.date).toLocaleDateString()}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <Link
                    to="/groups/$groupId/events/$eventId"
                    params={{ groupId, eventId: event.id }}
                >
                    <Button className="w-full" variant="outline">
                        View Event
                    </Button>
                </Link>
            </CardContent>
        </Card>
    )
}
