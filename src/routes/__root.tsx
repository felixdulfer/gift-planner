import { TanStackDevtools } from '@tanstack/react-devtools'
import type { QueryClient } from '@tanstack/react-query'
import {
    createRootRouteWithContext,
    HeadContent,
    Scripts,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { Toaster } from '@/components/ui/toaster'
import Header from '../components/Header'

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
})

function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <HeadContent />
            </head>
            <body>
                <Header />
                {children}
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
    )
}
