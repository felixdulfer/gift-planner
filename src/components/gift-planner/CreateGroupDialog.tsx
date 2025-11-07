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
import { groupMembersCollection, groupsCollection } from '@/db-collections'
import {
    useAddGroupMember,
    useCreateGroup,
    useCreateUser,
} from '@/hooks/use-api'
import { usersApi } from '@/lib/api'
import { getCurrentUserId } from '@/utils/gift-planner'

export function CreateGroupDialog() {
    const [open, setOpen] = useState(false)
    const currentUserId = getCurrentUserId()
    const createGroup = useCreateGroup()
    const addGroupMember = useAddGroupMember()
    const createUser = useCreateUser()

    const form = useForm({
        defaultValues: {
            name: '',
            description: '',
        },
        onSubmit: async ({ value }) => {
            try {
                // Ensure current user exists in Firestore
                if (currentUserId) {
                    // Check if user exists in Firestore, create if not
                    try {
                        await usersApi.getById(currentUserId)
                    } catch (error) {
                        // User doesn't exist, create them
                        // Firestore returns "User not found" error
                        if (
                            error instanceof Error &&
                            error.message.includes('User not found')
                        ) {
                            // Get user info from auth store
                            const { authStore } = await import(
                                '@/lib/auth-store'
                            )
                            const authState = authStore.state
                            const userEmail = authState.user?.email || ''
                            const userName = authState.user?.name || 'You'

                            await createUser.mutateAsync({
                                id: currentUserId,
                                name: userName,
                                email: userEmail,
                            })
                        } else {
                            throw error
                        }
                    }
                }

                // Create group in Firestore
                const createdGroup = await createGroup.mutateAsync({
                    name: value.name,
                    description: value.description || undefined,
                })

                // Update local store with the created group
                groupsCollection.insert({
                    id: createdGroup.id,
                    name: createdGroup.name,
                    description: createdGroup.description,
                    createdAt: createdGroup.createdAt,
                    createdBy: createdGroup.createdBy,
                })

                // Add creator as member in Firestore
                const createdMember = await addGroupMember.mutateAsync({
                    groupId: createdGroup.id,
                    userId: currentUserId,
                })

                // Update local store with the created member
                groupMembersCollection.insert({
                    id: createdMember.id,
                    groupId: createdMember.groupId,
                    userId: createdMember.userId,
                    joinedAt: createdMember.joinedAt,
                })

                toast.success('Group created successfully', {
                    description: `"${value.name}" has been created.`,
                })

                setOpen(false)
                form.reset()
            } catch (error) {
                console.error('Failed to create group:', error)
                toast.error('Failed to create group', {
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
