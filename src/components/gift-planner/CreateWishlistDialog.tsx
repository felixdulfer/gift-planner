import { useForm } from '@tanstack/react-form'
import { Plus } from 'lucide-react'
import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { wishlistsCollection } from '@/db-collections'
import {
    generateId,
    getCurrentTimestamp,
    getCurrentUserId,
} from '@/utils/gift-planner'

export function CreateWishlistDialog({
    receiverId,
    eventId,
}: {
    receiverId: string
    eventId: string
}) {
    const [open, setOpen] = useState(false)
    const form = useForm({
        defaultValues: {
            name: '',
        },
        onSubmit: async ({ value }) => {
            const currentUserId = getCurrentUserId()
            const now = getCurrentTimestamp()

            wishlistsCollection.insert({
                id: generateId(),
                receiverId,
                eventId,
                name: value.name || undefined,
                createdAt: now,
                createdBy: currentUserId,
            })

            setOpen(false)
            form.reset()
        },
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <Plus className="w-3 h-3 mr-1" />
                    Add Wishlist
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Wishlist</DialogTitle>
                    <DialogDescription>
                        Create a wishlist for this receiver
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        form.handleSubmit()
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <form.Field name="name">
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        Wishlist Name (optional)
                                    </Label>
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder="e.g., Electronics, Books, etc."
                                    />
                                </div>
                            )}
                        </form.Field>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Create Wishlist</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
