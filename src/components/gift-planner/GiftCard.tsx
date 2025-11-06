import { CheckCircle2, ExternalLink, ShoppingCart, User } from 'lucide-react'
import { useId, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    type User as UserType,
} from '@/db-collections'
import {
    generateId,
    getCurrentTimestamp,
    getCurrentUserId,
} from '@/utils/gift-planner'

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

    const handleAssign = (userId: string) => {
        if (assignment) {
            // Update existing assignment
            giftAssignmentsCollection.update(assignment.id, {
                assignedToUserId: userId,
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
            giftAssignmentsCollection.update(assignment.id, {
                isPurchased: true,
                purchasedAt: getCurrentTimestamp(),
            })
        }
    }

    return (
        <div className="flex items-start gap-3 p-3 border rounded-lg bg-card">
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
                                <Badge variant="default" className="text-xs">
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Purchased
                                </Badge>
                            )}
                            {isAssigned && !isPurchased && assignedUser && (
                                <Badge variant="secondary" className="text-xs">
                                    <User className="w-3 h-3 mr-1" />
                                    {assignedUser.name}
                                </Badge>
                            )}
                            {!isAssigned && (
                                <Badge variant="outline" className="text-xs">
                                    Unassigned
                                </Badge>
                            )}
                        </div>
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
                    {!isAssigned && (
                        <AssignGiftDialog
                            users={users}
                            onAssign={handleAssign}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

function AssignGiftDialog({
    users,
    onAssign,
}: {
    users: UserType[]
    onAssign: (userId: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const selectId = useId()

    const handleAssign = () => {
        if (selectedUserId) {
            onAssign(selectedUserId)
            setOpen(false)
            setSelectedUserId('')
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-6 text-xs">
                    <ShoppingCart className="w-3 h-3 mr-1" />
                    Assign
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Gift</DialogTitle>
                    <DialogDescription>
                        Assign this gift to a group member
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
                <DialogFooter>
                    <Button onClick={handleAssign} disabled={!selectedUserId}>
                        Assign Gift
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
