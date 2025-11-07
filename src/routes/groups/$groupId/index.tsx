import {
    createFileRoute,
    Link,
    Outlet,
    useNavigate,
} from '@tanstack/react-router'
import {
    ArrowLeft,
    Calendar,
    Pencil,
    Save,
    Settings,
    Trash2,
    Users,
    X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CreateEventDialog } from '@/components/gift-planner/CreateEventDialog'
import {
    AddUserDialog,
    JoinGroupDialog,
} from '@/components/gift-planner/UserManagement'
import { ProtectedRoute } from '@/components/ProtectedRoute'
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SidebarInset } from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import type { Event, Group, GroupMember, User } from '@/db-collections'
import {
    useDeleteGroup,
    useEvents,
    useGroup,
    useGroupMembers,
    useUpdateGroup,
    useUsers,
} from '@/hooks/use-api'

export const Route = createFileRoute('/groups/$groupId/')({
    component: GroupDetailPage,
})

function GroupDetailPage() {
    return (
        <ProtectedRoute>
            <GroupDetailContent />
        </ProtectedRoute>
    )
}

function GroupDetailContent() {
    const { groupId } = Route.useParams()
    const navigate = useNavigate()
    const [editDialogOpen, setEditDialogOpen] = useState(false)

    const { data: group } = useGroup(groupId)
    const { data: events = [] } = useEvents(groupId)
    const { data: groupMembers = [] } = useGroupMembers(groupId)
    const { data: users = [] } = useUsers()

    if (!group) {
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

    const memberCount = groupMembers.length
    const memberNames = groupMembers
        .map((member: GroupMember) => {
            const user = users.find((u: User) => u.id === member.userId)
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
                                    name={group.name}
                                />
                                {group.description ? (
                                    <button
                                        type="button"
                                        onClick={() => setEditDialogOpen(true)}
                                        className="text-muted-foreground mt-2 text-left hover:text-foreground transition-colors cursor-pointer"
                                    >
                                        {group.description}
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setEditDialogOpen(true)}
                                        className="text-muted-foreground/50 mt-2 text-left hover:text-muted-foreground transition-colors cursor-pointer italic"
                                    >
                                        Click to add description
                                    </button>
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
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditDialogOpen(true)}
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                                <CreateEventDialog groupId={groupId} />
                            </div>
                        </div>
                    </div>

                    <EditGroupDialog
                        group={group}
                        groupId={groupId}
                        open={editDialogOpen}
                        onOpenChange={setEditDialogOpen}
                        onDelete={() => navigate({ to: '/groups' })}
                    />

                    <Separator className="my-6" />

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">Events</h2>
                        {events && events.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {events.map((event: Event) => (
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
            </div>
        </SidebarInset>
    )
}

function EditGroupDialog({
    group,
    groupId,
    open,
    onOpenChange,
    onDelete,
}: {
    group: Group
    groupId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onDelete: () => void
}) {
    const [name, setName] = useState(group.name)
    const [description, setDescription] = useState(group.description || '')
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const updateGroup = useUpdateGroup()
    const deleteGroup = useDeleteGroup()

    useEffect(() => {
        setName(group.name)
        setDescription(group.description || '')
    }, [group])

    const handleSave = async () => {
        try {
            await updateGroup.mutateAsync({
                id: groupId,
                data: {
                    name: name.trim(),
                    description: description.trim() || undefined,
                },
            })
            toast.success('Group updated successfully', {
                description: `"${name}" has been updated.`,
            })
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to update group:', error)
            toast.error('Failed to update group', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred',
            })
        }
    }

    const handleDelete = async () => {
        try {
            await deleteGroup.mutateAsync(groupId)
            toast.success('Group deleted successfully', {
                description: `"${group.name}" has been deleted.`,
            })
            setDeleteDialogOpen(false)
            onOpenChange(false)
            onDelete()
        } catch (error) {
            console.error('Failed to delete group:', error)
            toast.error('Failed to delete group', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred',
            })
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Group</DialogTitle>
                        <DialogDescription>
                            Update the group details or delete the group
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="group-name">Name</Label>
                            <Input
                                id="group-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Group name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="group-description">
                                Description (optional)
                            </Label>
                            <Textarea
                                id="group-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Group description"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between">
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Group
                        </Button>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={updateGroup.isPending}
                            >
                                {updateGroup.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Group</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{group.name}"? This
                            action cannot be undone and will remove all
                            associated events, receivers, wishlists, and gifts.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteGroup.isPending}
                        >
                            {deleteGroup.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
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
    const updateGroup = useUpdateGroup()

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    useEffect(() => {
        setEditedName(name)
    }, [name])

    const handleSave = async () => {
        const trimmedName = editedName.trim()
        if (trimmedName && trimmedName !== name) {
            try {
                // Update in Firestore
                await updateGroup.mutateAsync({
                    id: groupId,
                    data: { name: trimmedName },
                })
            } catch (error) {
                console.error('Failed to update group name:', error)
                // Revert on error
                setEditedName(name)
            }
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
                    className="text-3xl! font-bold! h-auto py-2 px-3 -ml-3"
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
            <button
                type="button"
                className="text-3xl font-bold cursor-pointer transition-all group-hover:outline-2 group-hover:outline-primary/20 group-hover:rounded-md group-hover:px-2 group-hover:-mx-2"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
            >
                {name}
            </button>
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
