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
import {
	groupMembersCollection,
	groupsCollection,
	type User,
	usersCollection,
	usersStore,
} from '@/db-collections'
import { useStoreQuery } from '@/hooks/useLiveQuery'
import {
	generateId,
	getCurrentTimestamp,
	getCurrentUserId,
} from '@/utils/gift-planner'

export function CreateGroupDialog() {
	const [open, setOpen] = useState(false)
	const currentUserId = getCurrentUserId()
	const users = useStoreQuery(usersStore, (items) => items)

    const form = useForm({
        defaultValues: {
            name: '',
            description: '',
        },
        onSubmit: async ({ value }) => {
            const now = getCurrentTimestamp()

            // Ensure current user exists
            const existingUser = (users.data as User[] | undefined)?.find(
                (u: User) => u.id === currentUserId,
            )
            if (!existingUser) {
                usersCollection.insert({
                    id: currentUserId,
                    name: 'You',
                    createdAt: now,
                })
            }

            // Create group
            const groupId = generateId()
            groupsCollection.insert({
                id: groupId,
                name: value.name,
                description: value.description || undefined,
                createdAt: now,
                createdBy: currentUserId,
            })

            // Add creator as member
            groupMembersCollection.insert({
                id: generateId(),
                groupId,
                userId: currentUserId,
                joinedAt: now,
            })

            toast.success('Group created successfully', {
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
                    Create Group
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create New Group</DialogTitle>
                    <DialogDescription>
                        Create a new group to start planning gifts together
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        // Read values directly from input elements using their IDs
                        const nameInput = document.getElementById(
                            'name',
                        ) as HTMLInputElement
                        const descInput = document.getElementById(
                            'description',
                        ) as HTMLTextAreaElement
                        const name = nameInput?.value || ''
                        const description = descInput?.value || ''

                        if (!name) return

                        // Execute onSubmit logic directly
                        const now = getCurrentTimestamp()

                        // Ensure current user exists
                        const existingUser = (
                            users.data as User[] | undefined
                        )?.find((u: User) => u.id === currentUserId)
                        if (!existingUser) {
                            usersCollection.insert({
                                id: currentUserId,
                                name: 'You',
                                createdAt: now,
                            })
                        }

                        // Create group
                        const groupId = generateId()

                        groupsCollection.insert({
                            id: groupId,
                            name,
                            description: description || undefined,
                            createdAt: now,
                            createdBy: currentUserId,
                        })

                        // Add creator as member
                        groupMembersCollection.insert({
                            id: generateId(),
                            groupId,
                            userId: currentUserId,
                            joinedAt: now,
                        })

                        toast.success('Group created successfully', {
                            description: `"${name}" has been created.`,
                        })

                        setOpen(false)
                        form.reset()
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <form.Field
                            name="name"
                            validators={{
                                onChange: ({ value }) =>
                                    !value || value.trim() === ''
                                        ? 'Group name is required'
                                        : undefined,
                            }}
                        >
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        Group Name
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
                    </div>
                    <DialogFooter>
                        <Button type="submit">Create Group</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
