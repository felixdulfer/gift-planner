import { useState } from 'react'
import { useForm } from '@tanstack/react-form'
import { Plus } from 'lucide-react'

import { giftsCollection } from '@/db-collections'
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
import {
    generateId,
    getCurrentTimestamp,
    getCurrentUserId,
} from '@/utils/gift-planner'

export function CreateGiftDialog({ wishlistId }: { wishlistId: string }) {
    const [open, setOpen] = useState(false)
    const form = useForm({
        defaultValues: {
            name: '',
            picture: '',
            link: '',
        },
        onSubmit: async ({ value }) => {
            const currentUserId = getCurrentUserId()
            const now = getCurrentTimestamp()

            giftsCollection.insert({
                id: generateId(),
                wishlistId,
                name: value.name,
                picture: value.picture || undefined,
                link: value.link || undefined,
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
                    Add Gift
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Gift</DialogTitle>
                    <DialogDescription>
                        Add a gift to this wishlist
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
                        <form.Field
                            name="name"
                            validators={{
                                onChange: ({ value }) =>
                                    !value
                                        ? 'Gift name is required'
                                        : undefined,
                            }}
                        >
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        Gift Name
                                    </Label>
                                    <Input
                                        id={field.name}
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                    />
                                    {field.state.meta.errors && (
                                        <p className="text-sm text-destructive">
                                            {field.state.meta.errors[0]}
                                        </p>
                                    )}
                                </div>
                            )}
                        </form.Field>
                        <form.Field name="picture">
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        Picture URL (optional)
                                    </Label>
                                    <Input
                                        id={field.name}
                                        type="url"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder="https://example.com/image.jpg"
                                    />
                                </div>
                            )}
                        </form.Field>
                        <form.Field name="link">
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        Link (optional)
                                    </Label>
                                    <Input
                                        id={field.name}
                                        type="url"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                        placeholder="https://example.com/product"
                                    />
                                </div>
                            )}
                        </form.Field>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Add Gift</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
