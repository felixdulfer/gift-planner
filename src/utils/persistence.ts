// localStorage persistence utility for TanStack Store collections

import type { Store } from '@tanstack/store'
import { useEffect } from 'react'

const STORAGE_PREFIX = 'gift-planner-db-'

function getStorageKey(collectionName: string): string {
    return `${STORAGE_PREFIX}${collectionName}`
}

export function loadFromStorage<T>(collectionName: string): T[] {
    try {
        const stored = localStorage.getItem(getStorageKey(collectionName))
        if (stored) {
            return JSON.parse(stored)
        }
    } catch (error) {
        console.error(`Error loading ${collectionName} from storage:`, error)
    }
    return []
}

export function saveToStorage<T>(collectionName: string, data: T[]): void {
    try {
        localStorage.setItem(
            getStorageKey(collectionName),
            JSON.stringify(data),
        )
    } catch (error) {
        console.error(`Error saving ${collectionName} to storage:`, error)
    }
}

type StoreData<T> = {
    items: Map<string, T>
}

export function initializeCollectionFromStorage<T extends { id: string }>(
    store: Store<StoreData<T>>,
    collectionName: string,
): void {
    const storedData = loadFromStorage<T>(collectionName)

    if (storedData.length > 0) {
        store.setState((state) => {
            const newItems = new Map(state.items)
            for (const item of storedData) {
                newItems.set(item.id, item)
            }
            return { items: newItems }
        })
    }
}

// Hook to sync store to localStorage
export function usePersistCollection<T extends { id: string }>(
    store: Store<StoreData<T>>,
    collectionName: string,
    data: T[] | undefined,
): void {
    // Initialize from storage on mount
    useEffect(() => {
        initializeCollectionFromStorage(store, collectionName)
    }, [store, collectionName])

    // Save to storage whenever data changes
    useEffect(() => {
        if (data) {
            saveToStorage(collectionName, data)
        }
    }, [data, collectionName])
}
