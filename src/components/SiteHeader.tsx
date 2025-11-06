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

export function SiteHeader() {
	const router = useRouterState()
	const pathname = router.location.pathname

	// Build breadcrumbs from pathname
	const pathSegments = pathname.split('/').filter(Boolean)
	const breadcrumbs = pathSegments.map((segment, index) => {
		const path = '/' + pathSegments.slice(0, index + 1).join('/')
		// Format segment names (e.g., "groups" -> "Groups", "groupId" -> "Group")
		let label = segment
		if (segment.startsWith('$')) {
			label = segment.slice(1).replace(/([A-Z])/g, ' $1').trim()
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
							<Link to="/">Home</Link>
						</BreadcrumbLink>
					</BreadcrumbItem>
					{breadcrumbs.map((crumb, index) => {
						const isLast = index === breadcrumbs.length - 1
						return (
							<>
								<BreadcrumbSeparator />
								<BreadcrumbItem>
									{isLast ? (
										<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
									) : (
										<BreadcrumbLink asChild>
											<Link to={crumb.path}>{crumb.label}</Link>
										</BreadcrumbLink>
									)}
								</BreadcrumbItem>
							</>
						)
					})}
				</BreadcrumbList>
			</Breadcrumb>
		</header>
	)
}

