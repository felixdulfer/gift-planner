import { useForm } from '@tanstack/react-form'
import { UserPlus } from 'lucide-react'
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
import { useCreateReceiver } from '@/hooks/use-api'

export function CreateReceiverDialog({ eventId }: { eventId: string }) {
    const [open, setOpen] = useState(false)
    const createReceiver = useCreateReceiver()
    const form = useForm({
        defaultValues: {
            name: '',
        },
        onSubmit: async ({ value }) => {
            try {
                await createReceiver.mutateAsync({
                    eventId,
                    data: { name: value.name },
                })

                toast.success('Receiver added successfully', {
                    description: `"${value.name}" has been added.`,
                })

                setOpen(false)
                form.reset()
            } catch (error) {
                console.error('Failed to create receiver:', error)
                toast.error('Failed to add receiver', {
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
                <Button>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Receiver
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Gift Receiver</DialogTitle>
                    <DialogDescription>
                        Add someone who will receive gifts for this event
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
                                        ? 'Receiver name is required'
                                        : undefined,
                            }}
                        >
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>Name</Label>
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
                    </div>
                    <DialogFooter>
                        <Button type="submit">Add Receiver</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
