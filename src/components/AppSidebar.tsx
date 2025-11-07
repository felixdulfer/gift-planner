import { Link, useRouterState } from '@tanstack/react-router'
import { useStore } from '@tanstack/react-store'
import { Calendar, Gift, LayoutDashboard, LogOut } from 'lucide-react'
import { useMemo } from 'react'
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
import type { Event, Group, GroupMember } from '@/db-collections'
import { useAllGroupMembers, useEvents, useGroups } from '@/hooks/use-api'
import { useLogout } from '@/hooks/use-auth'
import { authStore } from '@/lib/auth-store'

// Component to fetch events for a specific group
function GroupEvents({ groupId }: { groupId: string }) {
    const { data: events = [] } = useEvents(groupId)
    const router = useRouterState()
    const currentPath = router.location.pathname

    if (events.length === 0) return null

    return (
        <SidebarMenuSub>
            {events.map((event: Event) => {
                const isEventActive =
                    currentPath === `/groups/${groupId}/events/${event.id}` ||
                    currentPath.startsWith(
                        `/groups/${groupId}/events/${event.id}/`,
                    )

                return (
                    <SidebarMenuSubItem key={event.id}>
                        <SidebarMenuSubButton asChild isActive={isEventActive}>
                            <Link
                                to="/groups/$groupId/events/$eventId"
                                params={{
                                    groupId,
                                    eventId: event.id,
                                }}
                            >
                                <Calendar />
                                <span>{event.name}</span>
                            </Link>
                        </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                )
            })}
        </SidebarMenuSub>
    )
}

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

    const { data: groups = [] } = useGroups()
    const { data: allGroupMembers = [] } = useAllGroupMembers()

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
                                            <GroupEvents groupId={group.id} />
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
