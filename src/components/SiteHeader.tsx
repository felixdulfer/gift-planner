import { Link, useRouterState } from '@tanstack/react-router'
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
    type Event,
    eventsStore,
    type Group,
    groupsStore,
} from '@/db-collections'
import { useStoreQuery } from '@/hooks/useLiveQuery'
import { ThemeToggle } from './ThemeToggle'

export function SiteHeader() {
    const router = useRouterState()
    const pathname = router.location.pathname

    // Extract groupId and eventId from pathname
    const pathSegments = pathname.split('/').filter(Boolean)
    const groupIdIndex = pathSegments.indexOf('groups')
    const groupId =
        groupIdIndex >= 0 && pathSegments[groupIdIndex + 1]
            ? pathSegments[groupIdIndex + 1]
            : null
    const eventIdIndex = pathSegments.indexOf('events')
    const eventId =
        eventIdIndex >= 0 && pathSegments[eventIdIndex + 1]
            ? pathSegments[eventIdIndex + 1]
            : null

    // Fetch group and event data
    const group = useStoreQuery(
        groupsStore,
        (items) =>
            groupId
                ? (items as Group[]).filter((g: Group) => g.id === groupId)
                : [],
        [groupId],
    )
    const event = useStoreQuery(
        eventsStore,
        (items) =>
            eventId
                ? (items as Event[]).filter((e: Event) => e.id === eventId)
                : [],
        [eventId],
    )

    const groupData = (group.data as Group[] | undefined)?.[0]
    const eventData = (event.data as Event[] | undefined)?.[0]

    // Build breadcrumbs from pathname
    // Filter out 'dashboard' from breadcrumbs since it's the base route
    const breadcrumbSegments = pathSegments.filter((seg) => seg !== 'dashboard')
    const breadcrumbs = breadcrumbSegments.map((segment, index) => {
        const path = `/${breadcrumbSegments.slice(0, index + 1).join('/')}`
        // Format segment names (e.g., "groups" -> "Groups", "groupId" -> "Group")
        let label = segment
        // Replace groupId with actual group name if available
        if (segment === groupId) {
            if (groupData) {
                label = groupData.name
            } else {
                // Keep the ID if group data is not loaded yet
                label = segment
            }
        } else if (segment === eventId) {
            // Replace eventId with actual event name if available
            if (eventData) {
                label = eventData.name
            } else {
                // Keep the ID if event data is not loaded yet
                label = segment
            }
        } else if (segment.startsWith('$')) {
            label = segment
                .slice(1)
                .replace(/([A-Z])/g, ' $1')
                .trim()
            label = label.charAt(0).toUpperCase() + label.slice(1)
        } else {
            label = segment.charAt(0).toUpperCase() + segment.slice(1)
        }
        return {
            label,
            path,
        }
    })

    return (
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink asChild>
                            {/* @ts-expect-error - TypeScript cache issue, route tree includes /dashboard */}
                            <Link to="/dashboard">Dashboard</Link>
                        </BreadcrumbLink>
                    </BreadcrumbItem>
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1
                        return (
                            <>
                                <BreadcrumbSeparator />
                                <BreadcrumbItem>
                                    {isLast ? (
                                        <BreadcrumbPage>
                                            {crumb.label}
                                        </BreadcrumbPage>
                                    ) : (
                                        <BreadcrumbLink asChild>
                                            <Link to={crumb.path}>
                                                {crumb.label}
                                            </Link>
                                        </BreadcrumbLink>
                                    )}
                                </BreadcrumbItem>
                            </>
                        )
                    })}
                </BreadcrumbList>
            </Breadcrumb>
            <div className="ml-auto">
                <ThemeToggle />
            </div>
        </header>
    )
}
