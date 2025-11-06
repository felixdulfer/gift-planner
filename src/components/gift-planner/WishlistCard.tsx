import { Pencil, Save, X } from 'lucide-react'
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
    type User,
    type Wishlist,
    wishlistsCollection,
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
                    <EditableWishlistName
                        wishlistId={wishlist.id}
                        name={wishlist.name}
                    />
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
                                : undefined

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

function EditableWishlistName({
    wishlistId,
    name,
}: {
    wishlistId: string
    name?: string
}) {
    const [isEditing, setIsEditing] = useState(false)
    const [editedName, setEditedName] = useState(name || '')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus()
            inputRef.current.select()
        }
    }, [isEditing])

    useEffect(() => {
        setEditedName(name || '')
    }, [name])

    const handleSave = () => {
        const trimmedName = editedName.trim()
        if (trimmedName !== (name || '')) {
            wishlistsCollection.update(wishlistId, (draft) => {
                draft.name = trimmedName || undefined
            })
        } else {
            setEditedName(name || '')
        }
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditedName(name || '')
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
                    className="text-sm font-semibold h-auto py-1 px-2 -ml-2"
                    placeholder="Wishlist name"
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

    const displayName = name || 'Wishlist'

    return (
        <div className="group relative inline-flex items-center gap-2 flex-1 min-w-0">
            <button
                type="button"
                className="text-sm font-semibold cursor-pointer transition-all group-hover:outline-2 group-hover:outline-primary/20 group-hover:rounded-md group-hover:px-2 group-hover:-mx-2 text-left truncate"
                onClick={() => setIsEditing(true)}
                title="Click to edit"
            >
                {displayName}
            </button>
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity text-muted-foreground shrink-0" />
        </div>
    )
}
