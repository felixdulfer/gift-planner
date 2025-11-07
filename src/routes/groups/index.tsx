import { createFileRoute, Link } from '@tanstack/react-router'
import { Trash2, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { CreateGroupDialog } from '@/components/gift-planner/CreateGroupDialog'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { SiteHeader } from '@/components/SiteHeader'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { SidebarInset } from '@/components/ui/sidebar'
import type { Group, GroupMember, User } from '@/db-collections'
import {
    useAllGroupMembers,
    useDeleteGroup,
    useGroupMembers,
    useGroups,
    useUsers,
} from '@/hooks/use-api'
import { getCurrentUserId } from '@/utils/gift-planner'

export const Route = createFileRoute('/groups/')({
    component: GroupsPage,
})

function GroupsPage() {
    return (
        <ProtectedRoute>
            <GroupsContent />
        </ProtectedRoute>
    )
}

function GroupsContent() {
    const currentUserId = getCurrentUserId()

    const { data: groups = [] } = useGroups()
    const { data: allGroupMembers = [] } = useAllGroupMembers()
    const { data: users = [] } = useUsers()

    // Get groups the current user is a member of
    const userGroups = useMemo(() => {
        return groups.filter((group: Group) => {
            return allGroupMembers.some(
                (member: GroupMember) =>
                    member.groupId === group.id &&
                    member.userId === currentUserId,
            )
        })
    }, [groups, allGroupMembers, currentUserId])

    return (
        <SidebarInset>
            <SiteHeader />
            <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                <div className="container mx-auto py-8 px-4 max-w-6xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold">My Groups</h1>
                            <p className="text-muted-foreground mt-2">
                                Manage your gift planning groups
                            </p>
                        </div>
                        <CreateGroupDialog />
                    </div>

                    {userGroups && userGroups.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {userGroups
                                .filter((group: Group) => group.id)
                                .map((group: Group) => (
                                    <GroupCard key={group.id} group={group} />
                                ))}
                        </div>
                    ) : (
                        <Card className="text-center py-12">
                            <CardContent>
                                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                <CardTitle className="mb-2">
                                    No groups yet
                                </CardTitle>
                                <CardDescription className="mb-6">
                                    Create your first group to start planning
                                    gifts
                                </CardDescription>
                                <CreateGroupDialog />
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </SidebarInset>
    )
}

function GroupCard({ group }: { group: Group }) {
    const groupId: string = group.id
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const deleteGroup = useDeleteGroup()
    const { data: groupMembers = [] } = useGroupMembers(groupId)
    const { data: users = [] } = useUsers()

    const memberCount = groupMembers.length
    const memberNames = groupMembers
        .map((member: GroupMember) => {
            const user = users.find((u: User) => u.id === member.userId)
            return user?.name ?? 'Unknown'
        })
        .slice(0, 3)

    const handleDelete = async () => {
        try {
            await deleteGroup.mutateAsync(groupId)
            toast.success('Group deleted successfully', {
                description: `"${group.name}" has been deleted.`,
            })
            setDeleteDialogOpen(false)
        } catch (error) {
            console.error('Failed to delete group:', error)
            toast.error('Failed to delete group', {
                description:
                    error instanceof Error
                        ? error.message
                        : 'An unexpected error occurred',
            })
        }
    }

    return (
        <>
            <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <CardTitle>{group.name}</CardTitle>
                            {group.description && (
                                <CardDescription>
                                    {group.description}
                                </CardDescription>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                setDeleteDialogOpen(true)
                            }}
                            title="Delete group"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                        <Users className="w-4 h-4" />
                        <span>
                            {memberCount}{' '}
                            {memberCount === 1 ? 'member' : 'members'}
                            {memberNames && memberNames.length > 0 && (
                                <span> • {memberNames.join(', ')}</span>
                            )}
                        </span>
                    </div>
                    <Link to="/groups/$groupId" params={{ groupId: group.id }}>
                        <Button className="w-full">View Group</Button>
                    </Link>
                </CardContent>
            </Card>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Group</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{group.name}"? This
                            action cannot be undone and will remove all
                            associated events, receivers, wishlists, and gifts.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleteGroup.isPending}
                        >
                            {deleteGroup.isPending ? 'Deleting...' : 'Delete'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
