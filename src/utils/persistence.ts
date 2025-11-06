// localStorage persistence utility for TanStack DB collections
import { useEffect } from "react";
import type { Collection } from "@tanstack/db";

const STORAGE_PREFIX = "gift-planner-db-";

function getStorageKey(collectionName: string): string {
	return `${STORAGE_PREFIX}${collectionName}`;
}

export function loadFromStorage<T>(collectionName: string): T[] {
	try {
		const stored = localStorage.getItem(getStorageKey(collectionName));
		if (stored) {
			return JSON.parse(stored);
		}
	} catch (error) {
		console.error(`Error loading ${collectionName} from storage:`, error);
	}
	return [];
}

export function saveToStorage<T>(collectionName: string, data: T[]): void {
	try {
		localStorage.setItem(getStorageKey(collectionName), JSON.stringify(data));
	} catch (error) {
		console.error(`Error saving ${collectionName} to storage:`, error);
	}
}

export function initializeCollectionFromStorage<T>(
	collection: Collection<T, unknown, unknown>,
	collectionName: string,
): void {
	const storedData = loadFromStorage<T>(collectionName);

	// Insert all stored items into the collection
	for (const item of storedData) {
		try {
			collection.insert(item);
		} catch {
			// Item might already exist, that's okay
		}
	}
}

// Hook to sync collection to localStorage
export function usePersistCollection<T>(
	collection: Collection<T, unknown, unknown>,
	collectionName: string,
	data: T[] | undefined,
): void {
	// Initialize from storage on mount
	useEffect(() => {
		initializeCollectionFromStorage(collection, collectionName);
	}, [collection, collectionName]);

	// Save to storage whenever data changes
	useEffect(() => {
		if (data) {
			saveToStorage(collectionName, data);
		}
	}, [data, collectionName]);
}
