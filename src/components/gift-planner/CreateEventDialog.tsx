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
import { Textarea } from '@/components/ui/textarea'
import { eventsCollection } from '@/db-collections'
import {
    generateId,
    getCurrentTimestamp,
    getCurrentUserId,
} from '@/utils/gift-planner'

export function CreateEventDialog({ groupId }: { groupId: string }) {
    const [open, setOpen] = useState(false)
    const form = useForm({
        defaultValues: {
            name: '',
            description: '',
            date: '',
        },
        onSubmit: async ({ value }) => {
            const currentUserId = getCurrentUserId()
            const now = getCurrentTimestamp()

            eventsCollection.insert({
                id: generateId(),
                groupId,
                name: value.name,
                description: value.description || undefined,
                date: value.date ? new Date(value.date).getTime() : undefined,
                createdAt: now,
                createdBy: currentUserId,
            })

            toast.success('Event created successfully', {
                description: `"${value.name}" has been created.`,
            })

            setOpen(false)
            form.reset()
        },
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Event
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Event</DialogTitle>
                    <DialogDescription>
                        Create an event to organize gift planning
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
                                        ? 'Event name is required'
                                        : undefined,
                            }}
                        >
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        Event Name
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
                        <form.Field name="description">
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        Description (optional)
                                    </Label>
                                    <Textarea
                                        id={field.name}
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                    />
                                </div>
                            )}
                        </form.Field>
                        <form.Field name="date">
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        Date (optional)
                                    </Label>
                                    <Input
                                        id={field.name}
                                        type="date"
                                        value={field.state.value}
                                        onChange={(e) =>
                                            field.handleChange(e.target.value)
                                        }
                                        onBlur={field.handleBlur}
                                    />
                                </div>
                            )}
                        </form.Field>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Create Event</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
