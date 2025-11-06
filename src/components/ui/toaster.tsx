import { useEffect, useState } from 'react'
import { Toaster as SonnerToaster } from './sonner'

export function Toaster() {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return null
    }

    return <SonnerToaster />
}
