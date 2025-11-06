import { useForm } from '@tanstack/react-form'
import { Settings } from 'lucide-react'
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
import { type Gift, giftsCollection } from '@/db-collections'

export function EditGiftDialog({ gift }: { gift: Gift }) {
    const [open, setOpen] = useState(false)
    const form = useForm({
        defaultValues: {
            name: gift.name,
            picture: gift.picture || '',
            link: gift.link || '',
        },
        onSubmit: async ({ value }) => {
            giftsCollection.update(gift.id, (draft) => {
                draft.name = value.name
                draft.picture = value.picture || undefined
                draft.link = value.link || undefined
            })

            toast.success('Gift updated successfully', {
                description: `"${value.name}" has been updated.`,
            })

            setOpen(false)
        },
    })

    const handlePaste = async (e: React.ClipboardEvent<HTMLInputElement>) => {
        const items = e.clipboardData.items
        for (let i = 0; i < items.length; i++) {
            const item = items[i]
            if (item.type.indexOf('image') !== -1) {
                e.preventDefault()
                const file = item.getAsFile()
                if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                        const dataUrl = event.target?.result as string
                        form.setFieldValue('picture', dataUrl)
                        toast.success('Image pasted', {
                            description:
                                'Image has been pasted from clipboard.',
                        })
                    }
                    reader.onerror = () => {
                        toast.error('Failed to read image', {
                            description: 'Could not process the pasted image.',
                        })
                    }
                    reader.readAsDataURL(file)
                }
                break
            }
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                    <Settings className="w-3 h-3" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Gift</DialogTitle>
                    <DialogDescription>
                        Update the gift details
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
                                        onPaste={handlePaste}
                                        onBlur={field.handleBlur}
                                        placeholder="https://example.com/image.jpg or paste an image"
                                    />
                                    {field.state.value && (
                                        <div className="mt-2">
                                            <img
                                                src={field.state.value}
                                                alt="Preview"
                                                className="max-w-full h-32 object-contain rounded border"
                                                onError={() => {
                                                    toast.error(
                                                        'Invalid image',
                                                        {
                                                            description:
                                                                'Could not load the image. Please check the URL or try pasting again.',
                                                        },
                                                    )
                                                }}
                                            />
                                        </div>
                                    )}
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
                        <Button type="submit">Update Gift</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
