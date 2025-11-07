import { CheckCircle2, ExternalLink, ShoppingCart, Trash2, User } from 'lucide-react'
import { type ReactNode, useEffect, useId, useState } from 'react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    type GiftAssignment,
    type Gift as GiftType,
    giftAssignmentsCollection,
    giftsCollection,
    type User as UserType,
} from '@/db-collections'
import { useDeleteGift } from '@/hooks/use-api'
import {
    generateId,
    getCurrentTimestamp,
    getCurrentUserId,
} from '@/utils/gift-planner'
import { EditGiftDialog } from './EditGiftDialog'

export function GiftCard({
    gift,
    assignment,
    assignedUser,
    users,
}: {
    gift: GiftType
    assignment?: GiftAssignment
    assignedUser?: UserType
    users: UserType[]
}) {
    const currentUserId = getCurrentUserId()
    const isAssigned = !!assignment
    const isPurchased = assignment?.isPurchased ?? false
    const isAssignedToMe =
        assignment?.assignedToUserId === currentUserId && !isPurchased
    const isPurchasedByMe =
        assignment?.assignedToUserId === currentUserId && isPurchased

    const deleteGift = useDeleteGift()

    const handleDelete = async () => {
        try {
            // Optimistically update local state
            giftsCollection.delete(gift.id)
            // Also delete associated assignments
            if (assignment) {
                giftAssignmentsCollection.delete(assignment.id)
            }
            // Delete from API
            await deleteGift.mutateAsync(gift.id)
            toast.success('Gift deleted', {
                description: `"${gift.name}" has been deleted.`,
            })
        } catch (error) {
            // Revert optimistic update on error
            giftsCollection.insert(gift)
            if (assignment) {
                giftAssignmentsCollection.insert(assignment)
            }
            toast.error('Failed to delete gift', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An error occurred while deleting the gift.',
            })
        }
    }

    const handleAssign = (userId: string | null) => {
        if (userId === null) {
            // Unassign
            if (assignment) {
                giftAssignmentsCollection.delete(assignment.id)
            }
        } else if (assignment) {
            // Update existing assignment
            giftAssignmentsCollection.update(assignment.id, (draft) => {
                draft.assignedToUserId = userId
            })
        } else {
            // Create new assignment
            giftAssignmentsCollection.insert({
                id: generateId(),
                giftId: gift.id,
                assignedToUserId: userId,
                assignedAt: getCurrentTimestamp(),
                assignedBy: currentUserId,
                isPurchased: false,
            })
        }
    }

    const handleMarkPurchased = () => {
        if (assignment) {
            giftAssignmentsCollection.update(assignment.id, (draft) => {
                draft.isPurchased = true
                draft.purchasedAt = getCurrentTimestamp()
            })
            toast.success('Gift marked as purchased', {
                description: gift.name,
            })
        }
    }

    const handleUnmarkPurchased = () => {
        if (assignment) {
            giftAssignmentsCollection.update(assignment.id, (draft) => {
                draft.isPurchased = false
                draft.purchasedAt = undefined
            })
            toast.success('Gift marked as not purchased', {
                description: gift.name,
            })
        }
    }

    const handleToggleQualified = (checked: boolean | 'indeterminate') => {
        giftsCollection.update(gift.id, (draft) => {
            draft.isQualified = checked === true
        })
    }

    return (
        <div className="flex items-start gap-3 p-3 border rounded-lg bg-card">
            <Checkbox
                checked={gift.isQualified ?? false}
                onCheckedChange={handleToggleQualified}
                className="mt-1"
                title="Mark as qualified - this gift needs to be bought"
            />
            {gift.picture && (
                <img
                    src={gift.picture}
                    alt={gift.name}
                    className="w-16 h-16 object-cover rounded"
                />
            )}
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <h4 className="font-medium text-sm">{gift.name}</h4>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
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
                            {isAssigned && !isPurchased && assignedUser && (
                                <AssignGiftDialog
                                    users={users}
                                    onAssign={handleAssign}
                                    currentUserId={assignment.assignedToUserId}
                                >
                                    <Badge
                                        variant="secondary"
                                        className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                                    >
                                        <User className="w-3 h-3 mr-1" />
                                        {assignedUser.name}
                                    </Badge>
                                </AssignGiftDialog>
                            )}
                            {!isAssigned && (
                                <AssignGiftDialog
                                    users={users}
                                    onAssign={handleAssign}
                                >
                                    <Badge
                                        variant="outline"
                                        className="text-xs cursor-pointer hover:bg-accent transition-colors"
                                    >
                                        Unassigned
                                    </Badge>
                                </AssignGiftDialog>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <DeleteGiftDialog
                            gift={gift}
                            onDelete={handleDelete}
                            isDeleting={deleteGift.isPending}
                        />
                        <EditGiftDialog gift={gift} />
                    </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
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
                    {isAssignedToMe && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleMarkPurchased}
                            className="h-6 text-xs"
                        >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Mark Purchased
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}

function AssignGiftDialog({
    users,
    onAssign,
    currentUserId,
    children,
}: {
    users: UserType[]
    onAssign: (userId: string | null) => void
    currentUserId?: string
    children?: ReactNode
}) {
    const [open, setOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string>(
        currentUserId || '',
    )
    const selectId = useId()

    useEffect(() => {
        if (open) {
            setSelectedUserId(currentUserId || '')
        }
    }, [open, currentUserId])

    const handleAssign = () => {
        if (selectedUserId) {
            onAssign(selectedUserId)
            setOpen(false)
            setSelectedUserId(currentUserId || '')
        }
    }

    const handleUnassign = () => {
        onAssign(null)
        setOpen(false)
        setSelectedUserId('')
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button size="sm" variant="outline" className="h-6 text-xs">
                        <ShoppingCart className="w-3 h-3 mr-1" />
                        Assign
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {currentUserId ? 'Change Assignment' : 'Assign Gift'}
                    </DialogTitle>
                    <DialogDescription>
                        {currentUserId
                            ? 'Assign this gift to a different group member or unassign it'
                            : 'Assign this gift to a group member'}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <label
                            htmlFor={selectId}
                            className="text-sm font-medium"
                        >
                            Select User
                        </label>
                        <Select
                            value={selectedUserId}
                            onValueChange={setSelectedUserId}
                        >
                            <SelectTrigger id={selectId}>
                                <SelectValue placeholder="Choose a user" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map((user) => (
                                    <SelectItem key={user.id} value={user.id}>
                                        {user.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="flex justify-between">
                    {currentUserId && (
                        <Button variant="destructive" onClick={handleUnassign}>
                            Unassign
                        </Button>
                    )}
                    <div className="flex gap-2 ml-auto">
                        <Button
                            variant="outline"
                            onClick={() => setOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAssign}
                            disabled={!selectedUserId}
                        >
                            {currentUserId
                                ? 'Change Assignment'
                                : 'Assign Gift'}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function DeleteGiftDialog({
    gift,
    onDelete,
    isDeleting,
}: {
    gift: GiftType
    onDelete: () => void
    isDeleting: boolean
}) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    title="Delete gift"
                >
                    <Trash2 className="w-3 h-3" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Gift</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete "{gift.name}"? This
                        action cannot be undone and will also remove any
                        assignments for this gift.
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
