// Utility functions for gift planner

export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function getCurrentTimestamp(): number {
	return Date.now();
}

// Get or create current user (for demo purposes, using localStorage)
export function getCurrentUserId(): string {
	const stored = localStorage.getItem("gift-planner-current-user-id");
	if (stored) {
		return stored;
	}
	const newUserId = generateId();
	localStorage.setItem("gift-planner-current-user-id", newUserId);
	return newUserId;
}

export function setCurrentUserId(userId: string): void {
	localStorage.setItem("gift-planner-current-user-id", userId);
}
