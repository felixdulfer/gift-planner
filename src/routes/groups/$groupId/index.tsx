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
    type Event,
    eventsCollection,
    type Group,
    type GroupMember,
    groupMembersCollection,
    groupsCollection,
    type User,
    usersCollection,
} from '@/db-collections'
import { usePersistCollection } from '@/utils/persistence'

export const Route = createFileRoute('/groups/$groupId/')({
    ssr: false,
    component: GroupDetailPage,
})

function GroupDetailPage() {
    const { groupId } = Route.useParams()
    const group = useLiveQuery((q) =>
        q
            .from({ group: groupsCollection })
            .where(({ group }) => group.id === groupId)
            .select(({ group }) => ({ ...group })),
    )
    const events = useLiveQuery((q) =>
        q
            .from({ event: eventsCollection })
            .where(({ event }) => event.groupId === groupId)
            .select(({ event }) => ({ ...event })),
    )
    const groupMembers = useLiveQuery((q) =>
        q
            .from({ member: groupMembersCollection })
            .where(({ member }) => member.groupId === groupId)
            .select(({ member }) => ({ ...member })),
    )
    const users = useLiveQuery((q) =>
        q.from({ user: usersCollection }).select(({ user }) => ({
            ...user,
        })),
    )

    // Persist collections
    // Get all groups for persistence (not just the single one)
    const allGroups = useLiveQuery((q) =>
        q.from({ group: groupsCollection }).select(({ group }) => ({
            ...group,
        })),
    )
    usePersistCollection(
        eventsCollection,
        'events',
        events.data as Event[] | undefined,
    )
    usePersistCollection(
        groupMembersCollection,
        'groupMembers',
        groupMembers.data as GroupMember[] | undefined,
    )
    usePersistCollection(
        usersCollection,
        'users',
        users.data as User[] | undefined,
    )
    usePersistCollection(
        groupsCollection,
        'groups',
        allGroups.data as Group[] | undefined,
    )

    const groupData = (group.data as Group[] | undefined)?.[0]
    if (!groupData) {
        return (
            <div className="container mx-auto py-8 px-4">
                <p>Group not found</p>
            </div>
        )
    }

    const memberCount =
        (groupMembers.data as GroupMember[] | undefined)?.length ?? 0
    const memberNames = (groupMembers.data as GroupMember[] | undefined)
        ?.map((member: GroupMember) => {
            const user = (users.data as User[] | undefined)?.find(
                (u: User) => u.id === member.userId,
            )
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
                        <h1 className="text-3xl font-bold">{groupData.name}</h1>
                        {groupData.description && (
                            <p className="text-muted-foreground mt-2">
                                {groupData.description}
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
                                {memberNames.map((name: string) => (
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
                {(events.data as Event[] | undefined) &&
                (events.data as Event[]).length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(events.data as Event[]).map((event: Event) => (
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
