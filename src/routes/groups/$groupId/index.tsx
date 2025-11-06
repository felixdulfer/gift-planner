import { createFileRoute, Link, Outlet } from '@tanstack/react-router'
import { ArrowLeft, Calendar, Pencil, Save, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { CreateEventDialog } from '@/components/gift-planner/CreateEventDialog'
import {
    AddUserDialog,
    JoinGroupDialog,
} from '@/components/gift-planner/UserManagement'
import { SiteHeader } from '@/components/SiteHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarInset } from '@/components/ui/sidebar'
import {
    type Event,
    eventsCollection,
    eventsStore,
    type Group,
    type GroupMember,
    groupMembersCollection,
    groupMembersStore,
    groupsCollection,
    groupsStore,
    type User,
    usersCollection,
    usersStore,
} from '@/db-collections'
import { useStoreQuery } from '@/hooks/useLiveQuery'
import { usePersistCollection } from '@/utils/persistence'

export const Route = createFileRoute('/groups/$groupId/')({
    ssr: false,
    component: GroupDetailPage,
})

function GroupDetailPage() {
    const { groupId } = Route.useParams()
    const group = useStoreQuery(
        groupsStore,
        (items) => items.filter((g) => g.id === groupId),
        [groupId],
    )
    const events = useStoreQuery(
        eventsStore,
        (items) => items.filter((e) => e.groupId === groupId),
        [groupId],
    )
    const groupMembers = useStoreQuery(
        groupMembersStore,
        (items) => items.filter((m) => m.groupId === groupId),
        [groupId],
    )
    const users = useStoreQuery(usersStore, (items) => items)

    // Persist collections
    // Get all groups for persistence (not just the single one)
    const allGroups = useStoreQuery(groupsStore, (items) => items)
    usePersistCollection(
        eventsStore,
        'events',
        events.data as Event[] | undefined,
    )
    usePersistCollection(
        groupMembersStore,
        'groupMembers',
        groupMembers.data as GroupMember[] | undefined,
    )
    usePersistCollection(usersStore, 'users', users.data as User[] | undefined)
    usePersistCollection(
        groupsStore,
        'groups',
        allGroups.data as Group[] | undefined,
    )

    const groupData = (group.data as Group[] | undefined)?.[0]
    if (!groupData) {
        return (
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="container mx-auto py-8 px-4">
                        <p>Group not found</p>
                    </div>
                </div>
            </SidebarInset>
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
        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
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
                                <EditableGroupName
                                    groupId={groupId}
                                    name={groupData.name}
                                />
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
                                            {memberCount === 1
                                                ? 'member'
                                                : 'members'}
                                        </span>
                                    </div>
                                </div>
                                {memberNames && memberNames.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-3">
                                        {memberNames.map((name: string) => (
                                            <Badge
                                                key={name}
                                                variant="secondary"
                                            >
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
                                {(events.data as Event[]).map(
                                    (event: Event) => (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            groupId={groupId}
                                        />
                                    ),
                                )}
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
            </div>
        </SidebarInset>
    )
}

function EditableGroupName({
    groupId,
    name,
}: {
    groupId: string
    name: string
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedName, setEditedName] = useState(name)
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    useEffect(() => {
        setEditedName(name)
    }, [name])

    const handleSave = () => {
        const trimmedName = editedName.trim()
        if (trimmedName && trimmedName !== name) {
            groupsCollection.update(groupId, (draft) => {
                draft.name = trimmedName
            })
        } else {
            setEditedName(name)
        }
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditedName(name)
        setIsEditing(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            handleSave()
        } else if (e.key === 'Escape') {
            e.preventDefault()
            handleCancel()
        }
    }

    if (isEditing) {
        return (
            <div className="flex items-center gap-2">
                <Input
                    ref={inputRef}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="!text-3xl !font-bold h-auto py-2 px-3 -ml-3"
                    style={{ fontSize: '1.875rem' }}
                />
                <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={handleSave}
                    title="Save"
                >
                    <Save className="w-4 h-4" />
                </Button>
                <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={handleCancel}
                    title="Cancel"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        )
    }

    return (
        <div className="group relative inline-flex items-center gap-2">
            <h1
                className="text-3xl font-bold cursor-pointer transition-all group-hover:outline group-hover:outline-2 group-hover:outline-primary/20 group-hover:rounded-md group-hover:px-2 group-hover:-mx-2"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
            >
                {name}
            </h1>
            <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground shrink-0" />
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
