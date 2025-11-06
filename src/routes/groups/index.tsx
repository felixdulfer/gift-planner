import { createFileRoute, Link } from '@tanstack/react-router'
import { Users } from 'lucide-react'
import { CreateGroupDialog } from '@/components/gift-planner/CreateGroupDialog'
import { SiteHeader } from '@/components/SiteHeader'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { SidebarInset } from '@/components/ui/sidebar'
import {
    type Group,
    type GroupMember,
    groupMembersStore,
    groupsStore,
    type User,
    usersStore,
} from '@/db-collections'
import { useStoreQuery } from '@/hooks/useLiveQuery'
import { getCurrentUserId } from '@/utils/gift-planner'
import { usePersistCollection } from '@/utils/persistence'

export const Route = createFileRoute('/groups/')({
    ssr: false,
    component: GroupsPage,
})

function GroupsPage() {
    const currentUserId = getCurrentUserId()

    const groups = useStoreQuery(groupsStore, (items) => items)
    const groupMembers = useStoreQuery(groupMembersStore, (items) => items)
    const users = useStoreQuery(usersStore, (items) => items)

    // Persist collections to localStorage
    usePersistCollection(usersStore, 'users', users.data as User[] | undefined)
    usePersistCollection(
        groupsStore,
        'groups',
        groups.data as Group[] | undefined,
    )
    usePersistCollection(
        groupMembersStore,
        'groupMembers',
        groupMembers.data as GroupMember[] | undefined,
    )

    // Get groups the current user is a member of
    const userGroups = (groups.data as Group[] | undefined)?.filter(
        (group: Group) => {
            return (groupMembers.data as GroupMember[] | undefined)?.some(
                (member: GroupMember) =>
                    member.groupId === group.id &&
                    member.userId === currentUserId,
            )
        },
    )

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

    const groupMembers = useStoreQuery(
        groupMembersStore,
        (items) =>
            (items as GroupMember[]).filter(
                (member) => member.groupId === groupId,
            ),
        [groupId],
    )

    const users = useStoreQuery(usersStore, (items) => items)

    const memberCount =
        (groupMembers.data as GroupMember[] | undefined)?.length ?? 0
    const memberNames = (groupMembers.data as GroupMember[] | undefined)
        ?.map((member: GroupMember) => {
            const user = (users.data as User[] | undefined)?.find(
                (u: User) => u.id === member.userId,
            )
            return user?.name ?? 'Unknown'
        })
        .slice(0, 3)

    return (
        <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                {group.description && (
                    <CardDescription>{group.description}</CardDescription>
                )}
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <Users className="w-4 h-4" />
                    <span>
                        {memberCount} {memberCount === 1 ? 'member' : 'members'}
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
    )
}
