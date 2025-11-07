import { useForm } from '@tanstack/react-form'
import { UserPlus, Users } from 'lucide-react'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import type { GroupMember, User } from '@/db-collections'
import {
    useAddGroupMember,
    useCreateUser,
    useGroupMembers,
    useUsers,
} from '@/hooks/use-api'
import { generateId } from '@/utils/gift-planner'

export function AddUserDialog() {
    const [open, setOpen] = useState(false)
    const createUser = useCreateUser()
    const form = useForm({
        defaultValues: {
            name: '',
            email: '',
        },
        onSubmit: async ({ value }) => {
            try {
                await createUser.mutateAsync({
                    id: generateId(),
                    name: value.name.trim(),
                    email: value.email?.trim() || undefined,
                })

                toast.success('User added successfully', {
                    description: `"${value.name.trim()}" has been added.`,
                })

                setOpen(false)
                form.reset()
            } catch (error) {
                console.error('Error adding user:', error)
                toast.error('Failed to add user', {
                    description:
                        error instanceof Error ? error.message : String(error),
                })
            }
        },
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
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
    const { data: users = [] } = useUsers()
    const { data: groupMembers = [] } = useGroupMembers(groupId)
    const addGroupMember = useAddGroupMember()
    const [selectedUserId, setSelectedUserId] = useState<string>('')

    const handleJoin = async () => {
        if (!selectedUserId) return

        const existingMember = groupMembers.find(
            (m: GroupMember) => m.userId === selectedUserId,
        )

        if (!existingMember) {
            try {
                const selectedUser = users.find(
                    (u: User) => u.id === selectedUserId,
                )
                await addGroupMember.mutateAsync({
                    groupId,
                    userId: selectedUserId,
                })
                toast.success('User added to group', {
                    description: `"${selectedUser?.name || 'User'}" has been added to the group.`,
                })
                setOpen(false)
                setSelectedUserId('')
            } catch (error) {
                console.error('Error adding user to group:', error)
                toast.error('Failed to add user to group', {
                    description:
                        error instanceof Error ? error.message : String(error),
                })
            }
        } else {
            toast.warning('User already in group', {
                description: 'This user is already a member of this group.',
            })
        }
    }

    // Filter out users who are already members
    const availableUsers = users.filter((user: User) => {
        return !groupMembers.some(
            (member: GroupMember) => member.userId === user.id,
        )
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
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
                                {users.length === 0
                                    ? 'No users exist yet. Create a user first.'
                                    : 'All users are already members of this group.'}
                            </p>
                            {users.length === 0 && <AddUserDialog />}
                        </div>
                    )}
                </div>
                <DialogFooter>
                    <Button
                        onClick={handleJoin}
                        disabled={
                            !selectedUserId ||
                            !availableUsers ||
                            availableUsers.length === 0 ||
                            addGroupMember.isPending
                        }
                    >
                        {addGroupMember.isPending
                            ? 'Adding...'
                            : 'Add to Group'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
