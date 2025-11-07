// API functions for gift planner entities

import type {
    Event,
    Gift,
    GiftAssignment,
    Group,
    GroupMember,
    Receiver,
    User,
    Wishlist,
} from '../db-collections/gift-planner'
import { UserSchema } from '../db-collections/gift-planner'
import { apiClient } from './api-client'

// Helper to transform API user response
function transformUser(data: unknown): User {
    try {
        const parsed = UserSchema.parse(data)
        return parsed
    } catch (error) {
        console.error('User validation error:', error)
        console.error('Raw user data:', data)
        // If validation fails, try to extract at least the id
        if (data && typeof data === 'object' && 'id' in data) {
            const fallback = data as {
                id: string
                name: string
                email?: string
                createdAt?: string | number
            }
            return {
                id: fallback.id,
                name: fallback.name || '',
                email: fallback.email || '',
                createdAt: fallback.createdAt
                    ? typeof fallback.createdAt === 'string'
                        ? new Date(fallback.createdAt).getTime()
                        : fallback.createdAt
                    : Date.now(),
            }
        }
        throw new Error(
            `Invalid user data: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

// Auth API
export const authApi = {
    createUser: async (data: { name: string; email: string }) => {
        const response = await apiClient.post<unknown>('/auth/users', data)
        return transformUser(response)
    },

    beginRegistration: (userId: string) =>
        apiClient.post<{ sessionId: string; session: unknown }>(
            '/auth/register/begin',
            { userId },
        ),

    finishRegistration: (
        userId: string,
        sessionId: string,
        credential: unknown,
    ) =>
        apiClient.post<{ message: string }>('/auth/register/finish', {
            userId,
            sessionId,
            credential,
        }),

    beginLogin: (email: string) =>
        apiClient.post<{ sessionId: string; session: unknown; userId: string }>(
            '/auth/login/begin',
            { email },
        ),

    finishLogin: (userId: string, sessionId: string, credential: unknown) =>
        apiClient.post<{ message: string }>('/auth/login/finish', {
            userId,
            sessionId,
            credential,
        }),
}

// Users API
export const usersApi = {
    getAll: () => apiClient.get<User[]>('/users'),
    getById: (id: string) => apiClient.get<User>(`/users/${id}`),
    update: (id: string, data: { name?: string; email?: string }) =>
        apiClient.put<User>(`/users/${id}`, data),
}

// Groups API
export const groupsApi = {
    getAll: () => apiClient.get<Group[]>('/groups'),
    getById: (id: string) => apiClient.get<Group>(`/groups/${id}`),
    create: (data: { name: string; description?: string }) =>
        apiClient.post<Group>('/groups', data),
    update: (id: string, data: { name?: string; description?: string }) =>
        apiClient.put<Group>(`/groups/${id}`, data),
    delete: (id: string) =>
        apiClient.delete<{ message: string }>(`/groups/${id}`),
}

// Group Members API
export const groupMembersApi = {
    getByGroup: (groupId: string) =>
        apiClient.get<GroupMember[]>(`/groups/${groupId}/members`),
    add: (groupId: string, userId: string) =>
        apiClient.post<GroupMember>(`/groups/${groupId}/members`, { userId }),
    remove: (groupId: string, memberId: string) =>
        apiClient.delete<{ message: string }>(
            `/groups/${groupId}/members/${memberId}`,
        ),
}

// Events API
export const eventsApi = {
    getByGroup: (groupId: string) =>
        apiClient.get<Event[]>(`/groups/${groupId}/events`),
    getById: (id: string) => apiClient.get<Event>(`/events/${id}`),
    create: (
        groupId: string,
        data: {
            name: string
            description?: string
            date?: number
        },
    ) => apiClient.post<Event>(`/groups/${groupId}/events`, data),
    update: (
        id: string,
        data: {
            name?: string
            description?: string
            date?: number
        },
    ) => apiClient.put<Event>(`/events/${id}`, data),
    delete: (id: string) =>
        apiClient.delete<{ message: string }>(`/events/${id}`),
}

// Receivers API
export const receiversApi = {
    getByEvent: (eventId: string) =>
        apiClient.get<Receiver[]>(`/events/${eventId}/receivers`),
    getById: (id: string) => apiClient.get<Receiver>(`/receivers/${id}`),
    create: (eventId: string, data: { name: string }) =>
        apiClient.post<Receiver>(`/events/${eventId}/receivers`, data),
    update: (id: string, data: { name?: string }) =>
        apiClient.put<Receiver>(`/receivers/${id}`, data),
    delete: (id: string) =>
        apiClient.delete<{ message: string }>(`/receivers/${id}`),
}

// Wishlists API
export const wishlistsApi = {
    getByReceiver: (receiverId: string) =>
        apiClient.get<Wishlist[]>(`/receivers/${receiverId}/wishlists`),
    getById: (id: string) => apiClient.get<Wishlist>(`/wishlists/${id}`),
    create: (
        receiverId: string,
        data: {
            eventId?: string
            name?: string
        },
    ) => apiClient.post<Wishlist>(`/receivers/${receiverId}/wishlists`, data),
    update: (id: string, data: { eventId?: string; name?: string }) =>
        apiClient.put<Wishlist>(`/wishlists/${id}`, data),
    delete: (id: string) =>
        apiClient.delete<{ message: string }>(`/wishlists/${id}`),
}

// Gifts API
export const giftsApi = {
    getByWishlist: (wishlistId: string) =>
        apiClient.get<Gift[]>(`/wishlists/${wishlistId}/gifts`),
    getById: (id: string) => apiClient.get<Gift>(`/gifts/${id}`),
    create: (
        wishlistId: string,
        data: {
            name: string
            picture?: string
            link?: string
            isQualified?: boolean
        },
    ) => apiClient.post<Gift>(`/wishlists/${wishlistId}/gifts`, data),
    update: (
        id: string,
        data: {
            name?: string
            picture?: string
            link?: string
            isQualified?: boolean
        },
    ) => apiClient.put<Gift>(`/gifts/${id}`, data),
    delete: (id: string) =>
        apiClient.delete<{ message: string }>(`/gifts/${id}`),
}

// Gift Assignments API
export const giftAssignmentsApi = {
    getByGift: (giftId: string) =>
        apiClient.get<GiftAssignment[]>(`/gifts/${giftId}/assignments`),
    create: (giftId: string, assignedToUserId: string) =>
        apiClient.post<GiftAssignment>(`/gifts/${giftId}/assignments`, {
            assignedToUserId,
        }),
    update: (
        id: string,
        data: {
            isPurchased?: boolean
            purchasedAt?: number
        },
    ) => apiClient.put<GiftAssignment>(`/assignments/${id}`, data),
    delete: (id: string) =>
        apiClient.delete<{ message: string }>(`/assignments/${id}`),
}
