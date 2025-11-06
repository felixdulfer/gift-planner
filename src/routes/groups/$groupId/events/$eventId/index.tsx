import { useLiveQuery } from '@tanstack/react-db'
import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowLeft, Gift as GiftIcon } from 'lucide-react'
import { CreateReceiverDialog } from '@/components/gift-planner/CreateReceiverDialog'
import { ReceiverCard } from '@/components/gift-planner/ReceiverCard'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
    type Event,
    eventsCollection,
    type Gift,
    type GiftAssignment,
    giftAssignmentsCollection,
    giftsCollection,
    type Receiver,
    receiversCollection,
    type User,
    usersCollection,
    type Wishlist,
    wishlistsCollection,
} from '@/db-collections'
import { usePersistCollection } from '@/utils/persistence'

export const Route = createFileRoute('/groups/$groupId/events/$eventId/')({
    ssr: false,
    component: EventDetailPage,
})

function EventDetailPage() {
    const { groupId, eventId } = Route.useParams()
    const event = useLiveQuery((q) =>
        q
            .from({ event: eventsCollection })
            .where(({ event }) => event.id === eventId)
            .select(({ event }) => ({ ...event })),
    )
    const receivers = useLiveQuery((q) =>
        q
            .from({ receiver: receiversCollection })
            .where(({ receiver }) => receiver.eventId === eventId)
            .select(({ receiver }) => ({ ...receiver })),
    )
    const wishlists = useLiveQuery((q) =>
        q.from({ wishlist: wishlistsCollection }).select(({ wishlist }) => ({
            ...wishlist,
        })),
    )
    const gifts = useLiveQuery((q) =>
        q.from({ gift: giftsCollection }).select(({ gift }) => ({
            ...gift,
        })),
    )
    const assignments = useLiveQuery((q) =>
        q
            .from({ assignment: giftAssignmentsCollection })
            .select(({ assignment }) => ({ ...assignment })),
    )
    const users = useLiveQuery((q) =>
        q.from({ user: usersCollection }).select(({ user }) => ({
            ...user,
        })),
    )

    // Persist all collections
    // Note: For events, we need to get all events, not just the single one
    const allEvents = useLiveQuery((q) =>
        q.from({ event: eventsCollection }).select(({ event }) => ({
            ...event,
        })),
    )
    usePersistCollection(
        eventsCollection,
        'events',
        allEvents.data as Event[] | undefined,
    )
    usePersistCollection(
        receiversCollection,
        'receivers',
        receivers.data as Receiver[] | undefined,
    )
    usePersistCollection(
        wishlistsCollection,
        'wishlists',
        wishlists.data as Wishlist[] | undefined,
    )
    usePersistCollection(
        giftsCollection,
        'gifts',
        gifts.data as Gift[] | undefined,
    )
    usePersistCollection(
        giftAssignmentsCollection,
        'giftAssignments',
        assignments.data as GiftAssignment[] | undefined,
    )
    usePersistCollection(
        usersCollection,
        'users',
        users.data as User[] | undefined,
    )

    const eventData = (event.data as Event[] | undefined)?.[0]
    if (!eventData) {
        return (
            <div className="container mx-auto py-8 px-4">
                <p>Event not found</p>
            </div>
        )
    }

    return (
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
                        <h1 className="text-3xl font-bold">{eventData.name}</h1>
                        {eventData.description && (
                            <p className="text-muted-foreground mt-2">
                                {eventData.description}
                            </p>
                        )}
                        {eventData.date && (
                            <p className="text-muted-foreground mt-2">
                                {new Date(eventData.date).toLocaleDateString()}
                            </p>
                        )}
                    </div>
                    <CreateReceiverDialog eventId={eventId} />
                </div>
            </div>

            <Separator className="my-6" />

            <div>
                <h2 className="text-2xl font-semibold mb-4">Gift Receivers</h2>
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
                                        (wishlists.data as Wishlist[]) ?? []
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
                                Add gift receivers to start managing wishlists
                            </CardDescription>
                            <CreateReceiverDialog eventId={eventId} />
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}
