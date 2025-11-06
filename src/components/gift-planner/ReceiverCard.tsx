import { Gift, Pencil, Save, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
    type GiftAssignment,
    type Gift as GiftType,
    type Receiver,
    receiversCollection,
    type User,
    type Wishlist,
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
                <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5" />
                    <EditableReceiverName
                        receiverId={receiver.id}
                        name={receiver.name}
                    />
                </div>
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

function EditableReceiverName({
    receiverId,
    name,
}: {
    receiverId: string
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
            receiversCollection.update(receiverId, (draft) => {
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
            <div className="flex items-center gap-2 flex-1 min-w-0">
                <Input
                    ref={inputRef}
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="text-lg font-semibold h-auto py-1 px-2 -ml-2"
                />
                <Button
                    size="icon-sm"
                    variant="outline"
                    onClick={handleSave}
                    title="Save"
                >
                    <Save className="w-3 h-3" />
                </Button>
                <Button
                    size="icon-sm"
                    variant="ghost"
                    onClick={handleCancel}
                    title="Cancel"
                >
                    <X className="w-3 h-3" />
                </Button>
            </div>
        )
    }

    return (
        <div className="group relative inline-flex items-center gap-2 flex-1 min-w-0">
            <button
                type="button"
                className="text-lg font-semibold cursor-pointer transition-all group-hover:outline-2 group-hover:outline-primary/20 group-hover:rounded-md group-hover:px-2 group-hover:-mx-2 text-left truncate"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
            >
                {name}
            </button>
            <Pencil className="w-4 h-4 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground shrink-0" />
        </div>
    )
}
