import { useQueries } from '@tanstack/react-query'
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router'
import {
    ArrowLeft,
    Gift as GiftIcon,
    Pencil,
    Save,
    Settings,
    Trash2,
    X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { CreateReceiverDialog } from '@/components/gift-planner/CreateReceiverDialog'
import { ReceiverCard } from '@/components/gift-planner/ReceiverCard'
import { SiteHeader } from '@/components/SiteHeader'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
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
import type { Event, Receiver } from '@/db-collections'
import {
    queryKeys,
    useDeleteEvent,
    useEvent,
    useReceivers,
    useUpdateEvent,
    useUsers,
} from '@/hooks/use-api'
import { giftAssignmentsApi, giftsApi, wishlistsApi } from '@/lib/api'

export const Route = createFileRoute('/groups/$groupId/events/$eventId/')({
    component: EventDetailPage,
})

function EventDetailPage() {
    const { groupId, eventId } = Route.useParams()
    const navigate = useNavigate()
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const { data: eventData } = useEvent(eventId)
    const { data: receivers = [] } = useReceivers(eventId)
    const { data: users = [] } = useUsers()

    // Fetch all wishlists for all receivers
    const wishlistQueries = useQueries({
        queries: receivers.map((receiver) => ({
            queryKey: queryKeys.wishlists(receiver.id),
            queryFn: () => wishlistsApi.getByReceiver(receiver.id),
        })),
    })

    const allWishlists = wishlistQueries.flatMap((query) => query.data || [])

    // Fetch all gifts for all wishlists
    const giftQueries = useQueries({
        queries: allWishlists.map((wishlist) => ({
            queryKey: queryKeys.gifts(wishlist.id),
            queryFn: () => giftsApi.getByWishlist(wishlist.id),
        })),
    })

    const allGifts = giftQueries.flatMap((query) => query.data || [])

    // Fetch all assignments for all gifts
    const assignmentQueries = useQueries({
        queries: allGifts.map((gift) => ({
            queryKey: queryKeys.giftAssignments(gift.id),
            queryFn: () => giftAssignmentsApi.getByGift(gift.id),
        })),
    })

    const allAssignments = assignmentQueries.flatMap(
        (query) => query.data || [],
    )

    if (!eventData) {
        return (
            <SidebarInset>
                <SiteHeader />
                <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                    <div className="container mx-auto py-8 px-4">
                        <p>Event not found</p>
                    </div>
                </div>
            </SidebarInset>
        )
    }

    return (
        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="container mx-auto py-8 px-4 max-w-6xl">
                    <div className="mb-6">
                        <Link to="/groups/$groupId" params={{ groupId }}>
                            <Button variant="ghost" size="sm" className="mb-4">
                                <ArrowLeft className="w-4 h-4 mr-2" />
                                Back to Group
                            </Button>
                        </Link>
                        <div className="flex items-start justify-between">
                            <div>
                                <EditableEventName
                                    eventId={eventId}
                                    name={eventData.name}
                                />
                                {eventData.description && (
                                    <p className="text-muted-foreground mt-2">
                                        {eventData.description}
                                    </p>
                                )}
                                {eventData.date &&
                                    (() => {
                                        const date = new Date(eventData.date)
                                        return !Number.isNaN(date.getTime()) ? (
                                            <p className="text-muted-foreground mt-2">
                                                {date.toLocaleDateString()}
                                            </p>
                                        ) : null
                                    })()}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditDialogOpen(true)}
                                >
                                    <Settings className="w-4 h-4" />
                                </Button>
                                <CreateReceiverDialog eventId={eventId} />
                            </div>
                        </div>
                    </div>

                    {eventData && (
                        <EditEventDialog
                            event={eventData}
                            eventId={eventId}
                            groupId={groupId}
                            open={editDialogOpen}
                            onOpenChange={setEditDialogOpen}
                            onDelete={() =>
                                navigate({
                                    to: '/groups/$groupId',
                                    params: { groupId },
                                })
                            }
                        />
                    )}

                    <Separator className="my-6" />

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">
                            Gift Receivers
                        </h2>
                        {receivers && receivers.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {receivers.map((receiver: Receiver) => (
                                    <ReceiverCard
                                        key={receiver.id}
                                        receiver={receiver}
                                        eventId={eventId}
                                        wishlists={allWishlists}
                                        gifts={allGifts}
                                        assignments={allAssignments}
                                        users={users}
                                    />
                                ))}
                            </div>
                        ) : (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <GiftIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                    <CardTitle className="mb-2">
                                        No receivers yet
                                    </CardTitle>
                                    <CardDescription className="mb-6">
                                        Add gift receivers to start managing
                                        wishlists
                                    </CardDescription>
                                    <CreateReceiverDialog eventId={eventId} />
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </SidebarInset>
    )
}

function EditEventDialog({
    event,
    eventId,
    open,
    onOpenChange,
    onDelete,
}: {
    event: Event
    eventId: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onDelete: () => void
}) {
    const formatDateForInput = (timestamp?: number): string => {
        if (!timestamp) return ''
        const date = new Date(timestamp)
        if (Number.isNaN(date.getTime())) return ''
        return date.toISOString().split('T')[0]
    }

    const [name, setName] = useState(event.name)
    const [description, setDescription] = useState(event.description || '')
    const [date, setDate] = useState(formatDateForInput(event.date))
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const updateEvent = useUpdateEvent()
    const deleteEvent = useDeleteEvent()

    useEffect(() => {
        setName(event.name)
        setDescription(event.description || '')
        setDate(formatDateForInput(event.date))
    }, [event])

    const handleSave = async () => {
        try {
            await updateEvent.mutateAsync({
                id: eventId,
                data: {
                    name: name.trim(),
                    description: description.trim() || undefined,
                    date: date ? new Date(date).getTime() : undefined,
                },
            })
            toast.success('Event updated successfully', {
                description: `"${name}" has been updated.`,
            })
            onOpenChange(false)
        } catch (error) {
            console.error('Failed to update event:', error)
            toast.error('Failed to update event', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred',
            })
        }
    }

    const handleDelete = async () => {
        try {
            await deleteEvent.mutateAsync(eventId)
            toast.success('Event deleted successfully', {
                description: `"${event.name}" has been deleted.`,
            })
            setDeleteDialogOpen(false)
            onOpenChange(false)
            onDelete()
        } catch (error) {
            console.error('Failed to delete event:', error)
            toast.error('Failed to delete event', {
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
                        <DialogTitle>Edit Event</DialogTitle>
                        <DialogDescription>
                            Update the event details or delete the event
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="event-name">Name</Label>
                            <Input
                                id="event-name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Event name"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="event-description">
                                Description (optional)
                            </Label>
                            <Textarea
                                id="event-description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Event description"
                                rows={3}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="event-date">Date (optional)</Label>
                            <Input
                                id="event-date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                            />
                        </div>
                    </div>
                    <DialogFooter className="flex justify-between">
                        <Button
                            variant="destructive"
                            onClick={() => setDeleteDialogOpen(true)}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Event
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
                                disabled={updateEvent.isPending}
                            >
                                {updateEvent.isPending ? 'Saving...' : 'Save'}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Event</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{event.name}"? This
                            action cannot be undone and will remove all
                            associated receivers, wishlists, and gifts.
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
                            disabled={deleteEvent.isPending}
                        >
                            {deleteEvent.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

function EditableEventName({
    eventId,
    name,
}: {
    eventId: string
    name: string
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedName, setEditedName] = useState(name)
    const inputRef = useRef<HTMLInputElement>(null)
    const updateEvent = useUpdateEvent()

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
                await updateEvent.mutateAsync({
                    id: eventId,
                    data: { name: trimmedName },
                })
            } catch (error) {
                console.error('Failed to update event name:', error)
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
                className="text-3xl font-bold cursor-pointer transition-all group-hover:outline-2 group-hover:outline-primary/20 group-hover:rounded-md group-hover:px-2 group-hover:-mx-2 text-left"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
            >
                {name}
            </button>
            <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground shrink-0" />
        </div>
    )
}
