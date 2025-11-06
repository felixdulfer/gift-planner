import { createRouter } from '@tanstack/react-router'
import * as TanstackQuery from './integrations/tanstack-query/root-provider'

// Import the generated route tree
import { routeTree } from './routeTree.gen'

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext()

	// Get base path from Vite's BASE_URL (removes trailing slash for router)
	const basePath = import.meta.env.BASE_URL.slice(0, -1) || '/'

	const router = createRouter({
		routeTree,
		context: { ...rqContext },
		defaultPreload: 'intent',
		basepath: basePath,
		Wrap: (props: { children: React.ReactNode }) => {
			return (
				<TanstackQuery.Provider {...rqContext}>
					{props.children}
				</TanstackQuery.Provider>
			)
		},
	})

	return router
}
