import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Gift as GiftIcon, Pencil, Save, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { SidebarInset } from '@/components/ui/sidebar'
import {
    type Event,
    eventsCollection,
    eventsStore,
    type Gift,
    type GiftAssignment,
    giftAssignmentsCollection,
    giftAssignmentsStore,
    giftsCollection,
    giftsStore,
    type Receiver,
    receiversCollection,
    receiversStore,
    type User,
    usersCollection,
    usersStore,
    type Wishlist,
    wishlistsCollection,
    wishlistsStore,
} from '@/db-collections'
import { useStoreQuery } from '@/hooks/useLiveQuery'
import { usePersistCollection } from '@/utils/persistence'

export const Route = createFileRoute('/groups/$groupId/events/$eventId/')({
    ssr: false,
    component: EventDetailPage,
})

function EventDetailPage() {
    const { groupId, eventId } = Route.useParams()
    const event = useStoreQuery(
        eventsStore,
        (items) => (items as Event[]).filter((e) => e.id === eventId),
        [eventId],
    )
    const receivers = useStoreQuery(
        receiversStore,
        (items) => (items as Receiver[]).filter((r) => r.eventId === eventId),
        [eventId],
    )
    const wishlists = useStoreQuery(wishlistsStore, (items) => items)
    const gifts = useStoreQuery(giftsStore, (items) => items)
    const assignments = useStoreQuery(giftAssignmentsStore, (items) => items)
    const users = useStoreQuery(usersStore, (items) => items)

    // Persist all collections
    // Note: For events, we need to get all events, not just the single one
    const allEvents = useStoreQuery(eventsStore, (items) => items)
    usePersistCollection(
        eventsStore,
        'events',
        allEvents.data as Event[] | undefined,
    )
    usePersistCollection(
        receiversStore,
        'receivers',
        receivers.data as Receiver[] | undefined,
    )
    usePersistCollection(
        wishlistsStore,
        'wishlists',
        wishlists.data as Wishlist[] | undefined,
    )
    usePersistCollection(giftsStore, 'gifts', gifts.data as Gift[] | undefined)
    usePersistCollection(
        giftAssignmentsStore,
        'giftAssignments',
        assignments.data as GiftAssignment[] | undefined,
    )
    usePersistCollection(usersStore, 'users', users.data as User[] | undefined)

    const eventData = (event.data as Event[] | undefined)?.[0]
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
                                {eventData.date && (
                                    <p className="text-muted-foreground mt-2">
                                        {new Date(
                                            eventData.date,
                                        ).toLocaleDateString()}
                                    </p>
                                )}
                            </div>
                            <CreateReceiverDialog eventId={eventId} />
                        </div>
                    </div>

                    <Separator className="my-6" />

                    <div>
                        <h2 className="text-2xl font-semibold mb-4">
                            Gift Receivers
                        </h2>
                        {(receivers.data as Receiver[] | undefined) &&
                        (receivers.data as Receiver[]).length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(receivers.data as Receiver[]).map(
                                    (receiver: Receiver) => (
                                        <ReceiverCard
                                            key={receiver.id}
                                            receiver={receiver}
                                            eventId={eventId}
                                            wishlists={
                                                (wishlists.data as Wishlist[]) ??
                                                []
                                            }
                                            gifts={(gifts.data as Gift[]) ?? []}
                                            assignments={
                                                (assignments.data as GiftAssignment[]) ??
                                                []
                                            }
                                            users={(users.data as User[]) ?? []}
                                        />
                                    ),
                                )}
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
            eventsCollection.update(eventId, (draft) => {
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
