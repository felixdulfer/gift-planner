import { Link, useRouterState } from '@tanstack/react-router'
import { Gift, Home } from 'lucide-react'
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from '@/components/ui/sidebar'

const navigation = [
	{
		title: 'Home',
		url: '/',
		icon: Home,
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
									(item.url !== '/' && currentPath.startsWith(item.url))

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
			</SidebarContent>
		</Sidebar>
	)
}

