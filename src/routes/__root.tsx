import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
    createRootRouteWithContext,
    HeadContent,
    Link,
    Scripts,
    useRouterState,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Button } from '@/components/ui/button'
import { SidebarProvider } from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/toaster'
import { AppSidebar } from '../components/AppSidebar'
import { ThemeProvider } from '../components/ThemeProvider'

import TanStackQueryDevtools from '../integrations/tanstack-query/devtools'
import appCss from '../styles.css?url'

interface MyRouterContext {
    queryClient: QueryClient
}

// Memoize the head configuration to prevent unnecessary re-renders
const headConfig = {
    meta: [
        {
            charSet: 'utf-8',
        },
        {
            name: 'viewport',
            content: 'width=device-width, initial-scale=1',
        },
        {
            title: 'TanStack Start Starter',
        },
    ],
    links: [
        {
            rel: 'stylesheet',
            href: appCss,
            id: 'app-stylesheet',
        },
    ],
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
    head: () => headConfig,

    shellComponent: RootDocument,
    notFoundComponent: NotFound,
})

function RootDocument({ children }: { children: React.ReactNode }) {
    const router = useRouterState()
    const isHomePage = router.location.pathname === '/'

    const content = isHomePage ? (
        children
    ) : (
        <SidebarProvider>
            <AppSidebar />
            {children}
        </SidebarProvider>
    )

    return (
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
            <html lang="en" suppressHydrationWarning>
                <head>
                    <HeadContent />
                </head>
                <body>
                    {content}
                    <Toaster />
                    <TanStackDevtools
                        config={{
                            position: 'bottom-right',
                        }}
                        plugins={[
                            {
                                name: 'Tanstack Router',
                                render: <TanStackRouterDevtoolsPanel />,
                            },
                            TanStackQueryDevtools,
                        ]}
                    />
                    <Scripts />
                </body>
            </html>
        </ThemeProvider>
    )
}

function NotFound() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-6">
            <div className="text-center max-w-2xl">
                <h1 className="text-9xl font-black text-white mb-4 tracking-[-0.08em]">
                    <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                        404
                    </span>
                </h1>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
                    Page Not Found
                </h2>
                <p className="text-lg text-gray-400 mb-8">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                <Link to="/">
                    <Button size="lg" className="px-8 py-6 text-lg">
                        Go Home
                    </Button>
                </Link>
            </div>
        </div>
    )
}
