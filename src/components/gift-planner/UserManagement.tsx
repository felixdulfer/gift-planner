import { useLiveQuery } from '@tanstack/react-db'
import { useForm } from '@tanstack/react-form'
import { UserPlus, Users } from 'lucide-react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    type GroupMember,
    groupMembersCollection,
    type User,
    usersCollection,
} from '@/db-collections'
import { generateId, getCurrentTimestamp } from '@/utils/gift-planner'

export function AddUserDialog() {
    const [open, setOpen] = useState(false)
    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
        },
        onSubmit: async ({ value }) => {
            const now = getCurrentTimestamp()

            try {
                const userData = {
                    id: generateId(),
                    name: value.name.trim(),
                    email: value.email?.trim() || undefined,
                    createdAt: now,
                }

                usersCollection.insert(userData)

                setOpen(false)
                form.reset()
            } catch (error) {
                console.error('Error adding user:', error)
                alert(
                    `Failed to add user: ${error instanceof Error ? error.message : String(error)}`,
                )
            }
        },
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add User</DialogTitle>
                    <DialogDescription>
                        Add a new user to the system
                    </DialogDescription>
                </DialogHeader>
                <form
                    onSubmit={async (e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        await form.handleSubmit()
                    }}
                >
                    <div className="grid gap-4 py-4">
                        <form.Field
                            name="name"
                            validators={{
                                onChange: ({ value }) =>
                                    !value?.trim()
                                        ? 'Name is required'
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
                        <form.Field
                            name="email"
                            validators={{
                                onChange: ({ value }) => {
                                    if (!value || !value.trim()) {
                                        return undefined // Empty email is allowed
                                    }
                                    // Validate email format if provided
                                    const emailRegex =
                                        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
                                    if (!emailRegex.test(value.trim())) {
                                        return 'Please enter a valid email address'
                                    }
                                    return undefined
                                },
                            }}
                        >
                            {(field) => (
                                <div className="grid gap-2">
                                    <Label htmlFor={field.name}>
                                        Email (optional)
                                    </Label>
                                    <Input
                                        id={field.name}
                                        type="email"
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
                        <Button
                            type="submit"
                            disabled={form.state.isSubmitting}
                        >
                            {form.state.isSubmitting ? 'Adding...' : 'Add User'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function JoinGroupDialog({ groupId }: { groupId: string }) {
    const [open, setOpen] = useState(false)
    const users = useLiveQuery((q) =>
        q.from({ user: usersCollection }).select(({ user }) => ({
            ...user,
        })),
    )
    const groupMembers = useLiveQuery((q) =>
        q
            .from({ member: groupMembersCollection })
            .where(({ member }) => member.groupId === groupId)
            .select(({ member }) => ({ ...member })),
    )
    const [selectedUserId, setSelectedUserId] = useState<string>('')

    const handleJoin = () => {
        if (!selectedUserId) return

        const now = getCurrentTimestamp()
        const existingMember = (
            groupMembers.data as GroupMember[] | undefined
        )?.find((m: GroupMember) => m.userId === selectedUserId)

        if (!existingMember) {
            try {
                groupMembersCollection.insert({
                    id: generateId(),
                    groupId,
                    userId: selectedUserId,
                    joinedAt: now,
                })
                setOpen(false)
                setSelectedUserId('')
            } catch (error) {
                console.error('Error adding user to group:', error)
                alert(
                    `Failed to add user to group: ${error instanceof Error ? error.message : String(error)}`,
                )
            }
        } else {
            alert('User is already a member of this group')
        }
    }

    // Filter out users who are already members
    const availableUsers = (users.data as User[] | undefined)?.filter(
        (user: User) => {
            return !(groupMembers.data as GroupMember[] | undefined)?.some(
                (member: GroupMember) => member.userId === user.id,
            )
        },
    )

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <Users className="w-4 h-4 mr-2" />
                    Add User to Group
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add User to Group</DialogTitle>
                    <DialogDescription>
                        Select a user to add to this group
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {availableUsers && availableUsers.length > 0 ? (
                        <div className="grid gap-2">
                            <Label>Select User</Label>
                            <Select
                                value={selectedUserId}
                                onValueChange={setSelectedUserId}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a user" />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableUsers.map((user: User) => (
                                        <SelectItem
                                            key={user.id}
                                            value={user.id}
                                        >
                                            {user.name}
                                            {user.email && ` (${user.email})`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <p className="text-sm text-muted-foreground mb-4">
                                {(users.data as User[] | undefined) &&
                                (users.data as User[]).length === 0
                                    ? 'No users exist yet. Create a user first.'
                                    : 'All users are already members of this group.'}
                            </p>
                            {(users.data as User[] | undefined) &&
                                (users.data as User[]).length === 0 && (
                                    <AddUserDialog />
                                )}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleJoin}
                        disabled={
                            !selectedUserId ||
                            !availableUsers ||
                            availableUsers.length === 0
                        }
                    >
                        Add to Group
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
