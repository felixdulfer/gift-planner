import { Link, useRouterState } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { Calendar, Gift, LayoutDashboard, LogOut } from 'lucide-react'
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '@/components/ui/sidebar'
import {
    type Event,
    eventsStore,
    type Group,
    type GroupMember,
    groupMembersStore,
    groupsStore,
} from '@/db-collections'
import { useLogout } from '@/hooks/use-auth'
import { useStoreQuery } from '@/hooks/useLiveQuery'
import { authStore } from '@/lib/auth-store'

const navigation = [
    {
        title: 'Dashboard',
        url: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Groups',
        url: '/groups',
        icon: Gift,
    },
]

export function AppSidebar() {
    const router = useRouterState()
    const currentPath = router.location.pathname
    const authState = useStore(authStore)
    const currentUserId = authState.user?.id || ''
    const { logout } = useLogout()

    const groups = useStoreQuery(groupsStore, (items) => items)
    const groupMembers = useStoreQuery(groupMembersStore, (items) => items)
    const events = useStoreQuery(eventsStore, (items) => items)

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

    // Get events for each group
    const getGroupEvents = (groupId: string) => {
        return (events.data as Event[] | undefined)?.filter(
            (event: Event) => event.groupId === groupId,
        )
    }

    return (
        <Sidebar>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Navigation</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {navigation.map((item) => {
                                const Icon = item.icon
                                const isActive =
                                    currentPath === item.url ||
                                    (item.url !== '/' &&
                                        currentPath.startsWith(item.url))

                                return (
                                    <SidebarMenuItem key={item.url}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                        >
                                            <Link to={item.url}>
                                                <Icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                {userGroups && userGroups.length > 0 && (
                    <SidebarGroup>
                        <SidebarGroupLabel>Groups</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {userGroups.map((group) => {
                                    const groupEvents =
                                        getGroupEvents(group.id) ?? []
                                    const isGroupActive =
                                        currentPath === `/groups/${group.id}` ||
                                        currentPath.startsWith(
                                            `/groups/${group.id}/`,
                                        )

                                    return (
                                        <SidebarMenuItem key={group.id}>
                                            <SidebarMenuButton
                                                asChild
                                                isActive={isGroupActive}
                                                tooltip={group.name}
                                            >
                                                <Link
                                                    to="/groups/$groupId"
                                                    params={{
                                                        groupId: group.id,
                                                    }}
                                                >
                                                    <Gift />
                                                    <span>{group.name}</span>
                                                </Link>
                                            </SidebarMenuButton>
                                            {groupEvents.length > 0 ? (
                                                <SidebarMenuSub>
                                                    {groupEvents.map(
                                                        (event) => {
                                                            const isEventActive =
                                                                currentPath ===
                                                                    `/groups/${group.id}/events/${event.id}` ||
                                                                currentPath.startsWith(
                                                                    `/groups/${group.id}/events/${event.id}/`,
                                                                )

                                                            return (
                                                                <SidebarMenuSubItem
                                                                    key={
                                                                        event.id
                                                                    }
                                                                >
                                                                    <SidebarMenuSubButton
                                                                        asChild
                                                                        isActive={
                                                                            isEventActive
                                                                        }
                                                                    >
                                                                        <Link
                                                                            to="/groups/$groupId/events/$eventId"
                                                                            params={{
                                                                                groupId:
                                                                                    group.id,
                                                                                eventId:
                                                                                    event.id,
                                                                            }}
                                                                        >
                                                                            <Calendar />
                                                                            <span>
                                                                                {
                                                                                    event.name
                                                                                }
                                                                            </span>
                                                                        </Link>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            )
                                                        },
                                                    )}
                                                </SidebarMenuSub>
                                            ) : null}
                                        </SidebarMenuItem>
                                    )
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>
                )}
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    {authState.user && (
                        <SidebarMenuItem>
                            <div className="px-2 py-1 text-xs text-muted-foreground">
                                {authState.user.name}
                            </div>
                        </SidebarMenuItem>
                    )}
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={logout} tooltip="Logout">
                            <LogOut />
                            <span>Logout</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
