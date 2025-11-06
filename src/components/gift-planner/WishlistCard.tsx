import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import type {
    GiftAssignment,
    Gift as GiftType,
    User,
    Wishlist,
} from '@/db-collections'
import { CreateGiftDialog } from './CreateGiftDialog'
import { GiftCard } from './GiftCard'

export function WishlistCard({
    wishlist,
    gifts,
    assignments,
    users,
}: {
    wishlist: Wishlist
    gifts: GiftType[]
    assignments: GiftAssignment[]
    users: User[]
}) {
    const wishlistAssignments = assignments.filter((a) =>
        gifts.some((g) => g.id === a.giftId),
    )
    const purchasedCount = wishlistAssignments.filter(
        (a) => a.isPurchased,
    ).length

    return (
        <Card className="border-2">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm">
                        {wishlist.name || 'Wishlist'}
                    </CardTitle>
                    <CreateGiftDialog wishlistId={wishlist.id} />
                </div>
                <CardDescription className="text-xs">
                    {gifts.length} {gifts.length === 1 ? 'gift' : 'gifts'}
                    {purchasedCount > 0 && (
                        <span> • {purchasedCount} purchased</span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
                {gifts.length > 0 ? (
                    <div className="space-y-2">
                        {gifts.map((gift) => {
                            const assignment = assignments.find(
                                (a) => a.giftId === gift.id,
                            )
                            const assignedUser = assignment
                                ? users.find(
                                      (u) =>
                                          u.id === assignment.assignedToUserId,
                                  )
                                : null

                            return (
                                <GiftCard
                                    key={gift.id}
                                    gift={gift}
                                    assignment={assignment}
                                    assignedUser={assignedUser}
                                    users={users}
                                />
                            )
                        })}
                    </div>
                ) : (
                    <p className="text-xs text-muted-foreground">
                        No gifts yet. Add one to get started.
                    </p>
                )}
            </CardContent>
        </Card>
    )
}
