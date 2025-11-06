import { Gift } from 'lucide-react'
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
    Receiver,
    User,
    Wishlist,
} from '@/db-collections'
import { CreateWishlistDialog } from './CreateWishlistDialog'
import { WishlistCard } from './WishlistCard'

export function ReceiverCard({
    receiver,
    eventId,
    wishlists,
    gifts,
    assignments,
    users,
}: {
    receiver: Receiver
    eventId: string
    wishlists: Wishlist[]
    gifts: GiftType[]
    assignments: GiftAssignment[]
    users: User[]
}) {
    const receiverWishlists = wishlists.filter(
        (w) => w.receiverId === receiver.id,
    )
    const receiverGifts = gifts.filter((g) =>
        receiverWishlists.some((w) => w.id === g.wishlistId),
    )

    const purchasedCount = receiverGifts.filter((gift) =>
        assignments.some((a) => a.giftId === gift.id && a.isPurchased),
    ).length

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    {receiver.name}
                </CardTitle>
                <CardDescription>
                    {receiverGifts.length}{' '}
                    {receiverGifts.length === 1 ? 'gift' : 'gifts'}
                    {purchasedCount > 0 && (
                        <span> • {purchasedCount} purchased</span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold">Wishlists</h3>
                            <CreateWishlistDialog
                                receiverId={receiver.id}
                                eventId={eventId}
                            />
                        </div>
                        {receiverWishlists.length > 0 ? (
                            <div className="space-y-2">
                                {receiverWishlists.map((wishlist) => (
                                    <WishlistCard
                                        key={wishlist.id}
                                        wishlist={wishlist}
                                        gifts={gifts.filter(
                                            (g) => g.wishlistId === wishlist.id,
                                        )}
                                        assignments={assignments}
                                        users={users}
                                    />
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-muted-foreground">
                                No wishlists yet. Create one to add gifts.
                            </p>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
