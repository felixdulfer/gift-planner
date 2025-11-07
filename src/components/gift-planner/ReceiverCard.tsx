import { Gift, Pencil, Save, Trash2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import type {
    GiftAssignment,
    Gift as GiftType,
    Receiver,
    User,
    Wishlist,
} from '@/db-collections'
import { useDeleteReceiver, useUpdateReceiver } from '@/hooks/use-api'
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

    const deleteReceiver = useDeleteReceiver()

    const handleDelete = async () => {
        try {
            await deleteReceiver.mutateAsync(receiver.id)
            toast.success('Receiver deleted', {
                description: `"${receiver.name}" has been deleted.`,
            })
        } catch (error) {
            toast.error('Failed to delete receiver', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred while deleting the receiver.',
            })
        }
    }

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Gift className="w-5 h-5 shrink-0" />
                        <EditableReceiverName
                            receiverId={receiver.id}
                            name={receiver.name}
                        />
                    </div>
                    <DeleteReceiverDialog
                        receiver={receiver}
                        onDelete={handleDelete}
                        isDeleting={deleteReceiver.isPending}
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
    const updateReceiver = useUpdateReceiver()

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
                await updateReceiver.mutateAsync({
                    id: receiverId,
                    data: { name: trimmedName },
                })
            } catch (error) {
                console.error('Failed to update receiver name:', error)
                toast.error('Failed to update receiver name', {
                    description:
                        error instanceof Error
                            ? error.message
                            : 'An unexpected error occurred',
                })
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

function DeleteReceiverDialog({
    receiver,
    onDelete,
    isDeleting,
}: {
    receiver: Receiver
    onDelete: () => void
    isDeleting: boolean
}) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete receiver"
                >
                    <Trash2 className="w-4 h-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Receiver</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{receiver.name}"? This
                        action cannot be undone and will also delete all
                        wishlists and gifts associated with this receiver.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => setOpen(false)}
                        disabled={isDeleting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={() => {
                            onDelete()
                            setOpen(false)
                        }}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
