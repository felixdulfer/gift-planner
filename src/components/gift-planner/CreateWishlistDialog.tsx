import { useForm } from '@tanstack/react-form'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
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
import { useCreateWishlist } from '@/hooks/use-api'

export function CreateWishlistDialog({
    receiverId,
    eventId,
}: {
    receiverId: string
    eventId: string
}) {
    const [open, setOpen] = useState(false)
    const createWishlist = useCreateWishlist()
    const form = useForm({
        defaultValues: {
            name: '',
        },
        onSubmit: async ({ value }) => {
            try {
                await createWishlist.mutateAsync({
                    receiverId,
                    data: {
                        eventId,
                        name: value.name || undefined,
                    },
                })

                toast.success('Wishlist created successfully', {
                    description: value.name
                        ? `"${value.name}" wishlist has been created.`
                        : 'Wishlist has been created.',
                })

                setOpen(false)
                form.reset()
            } catch (error) {
                console.error('Failed to create wishlist:', error)
                toast.error('Failed to create wishlist', {
                    description:
                        error instanceof Error
                            ? error.message
                            : 'An unexpected error occurred',
                })
            }
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
