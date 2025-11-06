import { useStore } from '@tanstack/react-store'
import type { Store } from '@tanstack/store'
import { useMemo } from 'react'

type StoreData<T> = {
    items: Map<string, T>
}

type QueryFn<T> = (items: T[]) => T[]

// Hook to replace useLiveQuery from TanStack DB
export function useLiveQuery<T>(
    _queryFn: QueryFn<T>,
    _deps: unknown[] = [],
): { data: T[] } {
    // This is a simplified version - we'll need to pass the store
    // For now, this is a placeholder that will be replaced per usage
    throw new Error(
        'useLiveQuery must be called with a store. Use useStoreQuery instead.',
    )
}

// Helper hook for querying stores
export function useStoreQuery<T>(
    store: Store<StoreData<T>>,
    queryFn: QueryFn<T>,
    deps: unknown[] = [],
): { data: T[] } {
    const storeState = useStore(store)
    const items = Array.from(storeState.items.values())

    const data = useMemo(() => {
        return queryFn(items)
    }, [items, ...deps, queryFn])

    return { data }
}
