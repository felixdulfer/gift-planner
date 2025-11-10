import { useQueries } from '@tanstack/react-query'
import { createFileRoute, Link } from '@tanstack/react-router'
import { Calendar, CheckCircle2, ExternalLink } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CreateGroupDialog } from '@/components/gift-planner/CreateGroupDialog'
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
import { Separator } from '@/components/ui/separator'
import { SidebarInset } from '@/components/ui/sidebar'
import type {
    Event,
    GiftAssignment,
    Gift as GiftType,
    Group,
    GroupMember,
    Receiver,
} from '@/db-collections'
import {
    queryKeys,
    useAllGroupMembers,
    useGroups,
    useUpdateGiftAssignment,
} from '@/hooks/use-api'
import {
    eventsApi,
    giftAssignmentsApi,
    giftsApi,
    receiversApi,
    wishlistsApi,
} from '@/lib/api'
import { getCurrentUserId } from '@/utils/gift-planner'

export const Route = createFileRoute('/dashboard')({
    component: DashboardPage,
})

function DashboardPage() {
    return (
        <ProtectedRoute>
            <DashboardContent />
        </ProtectedRoute>
    )
}

function DashboardContent() {
    const currentUserId = getCurrentUserId()
    // Track recently purchased gifts to keep them visible until navigation/refresh
    const [recentlyPurchasedGiftIds, setRecentlyPurchasedGiftIds] = useState<
        Set<string>
    >(new Set())

    const { data: groups = [] } = useGroups()
    const { data: allGroupMembers = [] } = useAllGroupMembers()

    // Get groups the current user is a member of
    const userGroups = useMemo(() => {
        return groups.filter((group: Group) => {
            return allGroupMembers.some(
                (member: GroupMember) =>
                    member.groupId === group.id &&
                    member.userId === currentUserId,
            )
        })
    }, [groups, allGroupMembers, currentUserId])

    const userGroupIds = useMemo(
        () => new Set(userGroups.map((g) => g.id)),
        [userGroups],
    )

    // Fetch events for all user groups using useQueries
    const eventQueries = useQueries({
        queries: userGroups.map((group) => ({
            queryKey: queryKeys.events(group.id),
            queryFn: () => eventsApi.getByGroup(group.id),
        })),
    })

    // Aggregate all events from user's groups
    const allEvents = useMemo(() => {
        return eventQueries.flatMap((query) => query.data || [])
    }, [eventQueries])

    // Fetch receivers for all events
    const receiverQueries = useQueries({
        queries: allEvents.map((event) => ({
            queryKey: queryKeys.receivers(event.id),
            queryFn: () => receiversApi.getByEvent(event.id),
        })),
    })

    // Aggregate all receivers
    const allReceivers = useMemo(() => {
        return receiverQueries.flatMap((query) => query.data || [])
    }, [receiverQueries])

    // Fetch wishlists for all receivers
    const wishlistQueries = useQueries({
        queries: allReceivers.map((receiver) => ({
            queryKey: queryKeys.wishlists(receiver.id),
            queryFn: () => wishlistsApi.getByReceiver(receiver.id),
        })),
    })

    // Aggregate all wishlists
    const allWishlists = useMemo(() => {
        return wishlistQueries.flatMap((query) => query.data || [])
    }, [wishlistQueries])

    // Fetch gifts for all wishlists
    const giftQueries = useQueries({
        queries: allWishlists.map((wishlist) => ({
            queryKey: queryKeys.gifts(wishlist.id),
            queryFn: () => giftsApi.getByWishlist(wishlist.id),
        })),
    })

    // Aggregate all gifts
    const allGifts = useMemo(() => {
        return giftQueries.flatMap((query) => query.data || [])
    }, [giftQueries])

    // Fetch assignments for all gifts
    const assignmentQueries = useQueries({
        queries: allGifts.map((gift) => ({
            queryKey: queryKeys.giftAssignments(gift.id),
            queryFn: () => giftAssignmentsApi.getByGift(gift.id),
        })),
    })

    // Aggregate all gift assignments
    const allGiftAssignments = useMemo(() => {
        return assignmentQueries.flatMap((query) => query.data || [])
    }, [assignmentQueries])

    // Get all events from user's groups
    const userEvents = allEvents.filter((event: Event) =>
        userGroupIds.has(event.groupId),
    )

    // Sort events by date (upcoming first)
    // Events without dates go to the end
    const sortedEvents = [...userEvents].sort((a, b) => {
        // If both have dates, sort by date (earliest first)
        if (a.date && b.date) {
            return a.date - b.date
        }
        // If only a has a date, it comes first
        if (a.date && !b.date) {
            return -1
        }
        // If only b has a date, it comes first
        if (!a.date && b.date) {
            return 1
        }
        // If neither has a date, maintain original order
        return 0
    })

    // Get gifts assigned to current user (not purchased, or recently purchased)
    const myAssignments = allGiftAssignments.filter(
        (assignment) =>
            assignment.assignedToUserId === currentUserId &&
            (!assignment.isPurchased ||
                recentlyPurchasedGiftIds.has(assignment.giftId)),
    )

    // Build gift context: gift -> wishlist -> receiver -> event -> group
    const assignedGiftsWithContext = myAssignments
        .map((assignment) => {
            const gift = allGifts.find((g) => g.id === assignment.giftId)
            if (!gift) return null

            const wishlist = allWishlists.find((w) => w.id === gift.wishlistId)
            if (!wishlist) return null

            const receiver = allReceivers.find(
                (r) => r.id === wishlist.receiverId,
            )
            if (!receiver) return null

            const event = allEvents.find((e) => e.id === receiver.eventId)
            if (!event) return null

            const group = userGroups.find((g) => g.id === event.groupId)
            if (!group) return null

            return {
                gift,
                assignment,
                wishlist,
                receiver,
                event,
                group,
            }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

    // Sort assigned gifts by event date (upcoming first)
    const sortedAssignedGifts = [...assignedGiftsWithContext].sort((a, b) => {
        if (a.event.date && b.event.date) {
            return a.event.date - b.event.date
        }
        if (a.event.date && !b.event.date) return -1
        if (!a.event.date && b.event.date) return 1
        return 0
    })

    // Get qualified gifts that are not assigned and not purchased
    const qualifiedGifts = allGifts.filter((gift) => gift.isQualified === true)

    const qualifiedGiftsWithContext = qualifiedGifts
        .map((gift) => {
            // Check if gift is assigned or purchased
            const assignment = allGiftAssignments.find(
                (a) => a.giftId === gift.id,
            )
            if (
                assignment?.isPurchased &&
                !recentlyPurchasedGiftIds.has(gift.id)
            ) {
                return null // Skip purchased gifts (unless recently purchased)
            }
            if (assignment) {
                return null // Skip assigned gifts (even if not purchased)
            }

            const wishlist = allWishlists.find((w) => w.id === gift.wishlistId)
            if (!wishlist) return null

            const receiver = allReceivers.find(
                (r) => r.id === wishlist.receiverId,
            )
            if (!receiver) return null

            const event = allEvents.find((e) => e.id === receiver.eventId)
            if (!event) return null

            const group = userGroups.find((g) => g.id === event.groupId)
            if (!group) return null

            return {
                gift,
                wishlist,
                receiver,
                event,
                group,
            }
        })
        .filter((item): item is NonNullable<typeof item> => item !== null)

    // Sort qualified gifts by event date (upcoming first)
    const sortedQualifiedGifts = [...qualifiedGiftsWithContext].sort((a, b) => {
        if (a.event.date && b.event.date) {
            return a.event.date - b.event.date
        }
        if (a.event.date && !b.event.date) return -1
        if (!a.event.date && b.event.date) return 1
        return 0
    })

    return (
        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="container mx-auto py-8 px-4 max-w-6xl">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold">Dashboard</h1>
                        <p className="text-muted-foreground mt-2">
                            View qualified gifts, assigned gifts, and upcoming
                            events
                        </p>
                    </div>

                    {/* Qualified Gifts Section */}
                    {sortedQualifiedGifts.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4">
                                Qualified Gifts (Need Assignment)
                            </h2>
                            <p className="text-muted-foreground mb-4">
                                These gifts from wishlists need to be bought but
                                haven't been assigned yet
                            </p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedQualifiedGifts.map((item) => (
                                    <QualifiedGiftCard
                                        key={item.gift.id}
                                        gift={item.gift}
                                        receiver={item.receiver}
                                        event={item.event}
                                        group={item.group}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Assigned Gifts Section */}
                    {sortedAssignedGifts.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-semibold mb-4">
                                Gifts Assigned to Me
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedAssignedGifts.map((item) => (
                                    <AssignedGiftCard
                                        key={item.assignment.id}
                                        gift={item.gift}
                                        assignment={item.assignment}
                                        receiver={item.receiver}
                                        event={item.event}
                                        group={item.group}
                                        onMarkPurchased={(giftId) => {
                                            setRecentlyPurchasedGiftIds(
                                                (prev) => {
                                                    const next = new Set(prev)
                                                    next.add(giftId)
                                                    return next
                                                },
                                            )
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Events Section */}
                    {(sortedAssignedGifts.length > 0 ||
                        sortedQualifiedGifts.length > 0) && (
                        <Separator className="my-8" />
                    )}
                    <div>
                        <h2 className="text-2xl font-semibold mb-4">
                            Upcoming Events
                        </h2>
                        {sortedEvents && sortedEvents.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {sortedEvents.map((event: Event) => {
                                    const group = userGroups.find(
                                        (g) => g.id === event.groupId,
                                    )
                                    return (
                                        <EventCard
                                            key={event.id}
                                            event={event}
                                            group={group}
                                        />
                                    )
                                })}
                            </div>
                        ) : (
                            <Card className="text-center py-12">
                                <CardContent>
                                    <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                    <CardTitle className="mb-2">
                                        No events yet
                                    </CardTitle>
                                    <CardDescription className="mb-6">
                                        {userGroups.length === 0
                                            ? 'Create your first group to start planning gifts'
                                            : 'Create a group and add events to see them here'}
                                    </CardDescription>
                                    {userGroups.length === 0 && (
                                        <CreateGroupDialog />
                                    )}
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </SidebarInset>
    )
}

function AssignedGiftCard({
    gift,
    assignment,
    receiver,
    event,
    group,
    onMarkPurchased,
}: {
    gift: GiftType
    assignment: GiftAssignment
    receiver: Receiver
    event: Event
    group: Group
    onMarkPurchased: (giftId: string) => void
}) {
    const currentUserId = getCurrentUserId()
    const isPurchased = assignment.isPurchased
    const isPurchasedByMe =
        assignment.assignedToUserId === currentUserId && isPurchased
    const updateGiftAssignment = useUpdateGiftAssignment()

    const handleMarkPurchased = async () => {
        try {
            await updateGiftAssignment.mutateAsync({
                id: assignment.id,
                data: {
                    isPurchased: true,
                    purchasedAt: Date.now(),
                },
            })
            onMarkPurchased(gift.id)
            toast.success('Gift marked as purchased', {
                description: gift.name,
            })
        } catch (error) {
            console.error('Failed to mark gift as purchased:', error)
            toast.error('Failed to mark gift as purchased', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred',
            })
        }
    }

    const handleUnmarkPurchased = async () => {
        try {
            await updateGiftAssignment.mutateAsync({
                id: assignment.id,
                data: {
                    isPurchased: false,
                    purchasedAt: undefined,
                },
            })
            toast.success('Gift marked as not purchased', {
                description: gift.name,
            })
        } catch (error) {
            console.error('Failed to unmark gift as purchased:', error)
            toast.error('Failed to unmark gift as purchased', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred',
            })
        }
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                            <CardTitle className="text-lg">
                                {gift.name}
                            </CardTitle>
                            {isPurchased && (
                                <Badge
                                    variant="default"
                                    className={`text-xs ${
                                        isPurchasedByMe
                                            ? 'cursor-pointer hover:bg-primary/90 transition-colors'
                                            : ''
                                    }`}
                                    onClick={
                                        isPurchasedByMe
                                            ? handleUnmarkPurchased
                                            : undefined
                                    }
                                    title={
                                        isPurchasedByMe
                                            ? 'Click to unmark as purchased'
                                            : undefined
                                    }
                                >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Purchased
                                </Badge>
                            )}
                        </div>
                        <CardDescription className="mt-1">
                            For {receiver.name}
                        </CardDescription>
                    </div>
                    {gift.picture && (
                        <img
                            src={gift.picture}
                            alt={gift.name}
                            className="w-16 h-16 object-cover rounded"
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{event.name}</span>
                    </div>
                    {event.date && (
                        <div className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                        </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                        {group.name}
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    {gift.link && (
                        <a
                            href={gift.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <ExternalLink className="w-3 h-3" />
                            View Link
                        </a>
                    )}
                    {!isPurchased && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleMarkPurchased}
                            disabled={updateGiftAssignment.isPending}
                            className="h-7 text-xs"
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Purchased
                        </Button>
                    )}
                </div>
                <Link
                    to="/groups/$groupId/events/$eventId"
                    params={{ groupId: event.groupId, eventId: event.id }}
                    className="block mt-3"
                >
                    <CardDescription className="text-primary hover:underline cursor-pointer">
                        View Event →
                    </CardDescription>
                </Link>
            </CardContent>
        </Card>
    )
}

function QualifiedGiftCard({
    gift,
    receiver,
    event,
    group,
}: {
    gift: GiftType
    receiver: Receiver
    event: Event
    group: Group
}) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <CardTitle className="text-lg">{gift.name}</CardTitle>
                        <CardDescription className="mt-1">
                            For {receiver.name}
                        </CardDescription>
                    </div>
                    {gift.picture && (
                        <img
                            src={gift.picture}
                            alt={gift.name}
                            className="w-16 h-16 object-cover rounded"
                        />
                    )}
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>{event.name}</span>
                    </div>
                    {event.date && (
                        <div className="text-sm text-muted-foreground">
                            {new Date(event.date).toLocaleDateString()}
                        </div>
                    )}
                    <div className="text-sm text-muted-foreground">
                        {group.name}
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                    {gift.link && (
                        <a
                            href={gift.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                            <ExternalLink className="w-3 h-3" />
                            View Link
                        </a>
                    )}
                </div>
                <Link
                    to="/groups/$groupId/events/$eventId"
                    params={{ groupId: event.groupId, eventId: event.id }}
                    className="block mt-3"
                >
                    <CardDescription className="text-primary hover:underline cursor-pointer">
                        View Event →
                    </CardDescription>
                </Link>
            </CardContent>
        </Card>
    )
}

function EventCard({
    event,
    group,
}: {
    event: Event
    group: Group | undefined
}) {
    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle>{event.name}</CardTitle>
                {group && <CardDescription>{group.name}</CardDescription>}
                {event.date && (
                    <CardDescription>
                        {new Date(event.date).toLocaleDateString()}
                    </CardDescription>
                )}
            </CardHeader>
            <CardContent>
                {event.description && (
                    <p className="text-sm text-muted-foreground mb-4">
                        {event.description}
                    </p>
                )}
                <Link
                    to="/groups/$groupId/events/$eventId"
                    params={{ groupId: event.groupId, eventId: event.id }}
                >
                    <CardDescription className="text-primary hover:underline cursor-pointer">
                        View Event →
                    </CardDescription>
                </Link>
            </CardContent>
        </Card>
    )
}
