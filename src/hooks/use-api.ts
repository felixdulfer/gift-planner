// API integration utilities and hooks

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
    eventsApi,
    giftAssignmentsApi,
    giftsApi,
    groupMembersApi,
    groupsApi,
    receiversApi,
    usersApi,
    wishlistsApi,
} from '../lib/api'

// Query keys factory
export const queryKeys = {
    users: ['users'] as const,
    user: (id: string) => ['users', id] as const,
    groups: ['groups'] as const,
    group: (id: string) => ['groups', id] as const,
    groupMembers: (groupId: string) => ['groups', groupId, 'members'] as const,
    events: (groupId: string) => ['groups', groupId, 'events'] as const,
    event: (id: string) => ['events', id] as const,
    receivers: (eventId: string) => ['events', eventId, 'receivers'] as const,
    receiver: (id: string) => ['receivers', id] as const,
    wishlists: (receiverId: string) =>
        ['receivers', receiverId, 'wishlists'] as const,
    wishlist: (id: string) => ['wishlists', id] as const,
    gifts: (wishlistId: string) => ['wishlists', wishlistId, 'gifts'] as const,
    gift: (id: string) => ['gifts', id] as const,
    giftAssignments: (giftId: string) =>
        ['gifts', giftId, 'assignments'] as const,
}

// Hooks for Users
export function useUsers() {
    return useQuery({
        queryKey: queryKeys.users,
        queryFn: () => usersApi.getAll(),
    })
}

export function useUser(id: string) {
    return useQuery({
        queryKey: queryKeys.user(id),
        queryFn: () => usersApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateUser() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: { id: string; name: string; email?: string }) =>
            usersApi.create(data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.user(variables.id),
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.users })
        },
    })
}

export function useUpdateUser() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: { name?: string; email?: string }
        }) => usersApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.user(variables.id),
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.users })
        },
    })
}

// Hooks for Groups
export function useGroups() {
    return useQuery({
        queryKey: queryKeys.groups,
        queryFn: () => groupsApi.getAll(),
    })
}

export function useGroup(id: string) {
    return useQuery({
        queryKey: queryKeys.group(id),
        queryFn: () => groupsApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (data: { name: string; description?: string }) =>
            groupsApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.groups })
        },
    })
}

export function useUpdateGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: { name?: string; description?: string }
        }) => groupsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.group(variables.id),
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.groups })
        },
    })
}

export function useDeleteGroup() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => groupsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.groups })
        },
    })
}

// Hooks for Group Members
export function useGroupMembers(groupId: string) {
    return useQuery({
        queryKey: queryKeys.groupMembers(groupId),
        queryFn: () => groupMembersApi.getByGroup(groupId),
        enabled: !!groupId,
    })
}

export function useAddGroupMember() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            groupId,
            userId,
        }: {
            groupId: string
            userId: string
        }) => groupMembersApi.add(groupId, userId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.groupMembers(variables.groupId),
            })
            queryClient.invalidateQueries({
                queryKey: queryKeys.group(variables.groupId),
            })
        },
    })
}

export function useRemoveGroupMember() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            groupId,
            memberId,
        }: {
            groupId: string
            memberId: string
        }) => groupMembersApi.remove(groupId, memberId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.groupMembers(variables.groupId),
            })
        },
    })
}

// Hooks for Events
export function useEvents(groupId: string) {
    return useQuery({
        queryKey: queryKeys.events(groupId),
        queryFn: () => eventsApi.getByGroup(groupId),
        enabled: !!groupId,
    })
}

export function useEvent(id: string) {
    return useQuery({
        queryKey: queryKeys.event(id),
        queryFn: () => eventsApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateEvent() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            groupId,
            data,
        }: {
            groupId: string
            data: { name: string; description?: string; date?: number }
        }) => eventsApi.create(groupId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.events(variables.groupId),
            })
        },
    })
}

export function useUpdateEvent() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: { name?: string; description?: string; date?: number }
        }) => eventsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.event(variables.id),
            })
            queryClient.invalidateQueries({ queryKey: queryKeys.events })
        },
    })
}

export function useDeleteEvent() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => eventsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.events })
        },
    })
}

// Hooks for Receivers
export function useReceivers(eventId: string) {
    return useQuery({
        queryKey: queryKeys.receivers(eventId),
        queryFn: () => receiversApi.getByEvent(eventId),
        enabled: !!eventId,
    })
}

export function useReceiver(id: string) {
    return useQuery({
        queryKey: queryKeys.receiver(id),
        queryFn: () => receiversApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateReceiver() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            eventId,
            data,
        }: {
            eventId: string
            data: { name: string }
        }) => receiversApi.create(eventId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.receivers(variables.eventId),
            })
        },
    })
}

export function useUpdateReceiver() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: { name?: string } }) =>
            receiversApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.receiver(variables.id),
            })
        },
    })
}

export function useDeleteReceiver() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => receiversApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.receivers })
        },
    })
}

// Hooks for Wishlists
export function useWishlists(receiverId: string) {
    return useQuery({
        queryKey: queryKeys.wishlists(receiverId),
        queryFn: () => wishlistsApi.getByReceiver(receiverId),
        enabled: !!receiverId,
    })
}

export function useWishlist(id: string) {
    return useQuery({
        queryKey: queryKeys.wishlist(id),
        queryFn: () => wishlistsApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateWishlist() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            receiverId,
            data,
        }: {
            receiverId: string
            data: { eventId?: string; name?: string }
        }) => wishlistsApi.create(receiverId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.wishlists(variables.receiverId),
            })
        },
    })
}

export function useUpdateWishlist() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: { eventId?: string; name?: string }
        }) => wishlistsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.wishlist(variables.id),
            })
        },
    })
}

export function useDeleteWishlist() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => wishlistsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.wishlists })
        },
    })
}

// Hooks for Gifts
export function useGifts(wishlistId: string) {
    return useQuery({
        queryKey: queryKeys.gifts(wishlistId),
        queryFn: () => giftsApi.getByWishlist(wishlistId),
        enabled: !!wishlistId,
    })
}

export function useGift(id: string) {
    return useQuery({
        queryKey: queryKeys.gift(id),
        queryFn: () => giftsApi.getById(id),
        enabled: !!id,
    })
}

export function useCreateGift() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            wishlistId,
            data,
        }: {
            wishlistId: string
            data: {
                name: string
                picture?: string
                link?: string
                isQualified?: boolean
            }
        }) => giftsApi.create(wishlistId, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.gifts(variables.wishlistId),
            })
        },
    })
}

export function useUpdateGift() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: {
                name?: string
                picture?: string
                link?: string
                isQualified?: boolean
            }
        }) => giftsApi.update(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.gift(variables.id),
            })
        },
    })
}

export function useDeleteGift() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => giftsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: queryKeys.gifts })
        },
    })
}

// Hooks for Gift Assignments
export function useGiftAssignments(giftId: string) {
    return useQuery({
        queryKey: queryKeys.giftAssignments(giftId),
        queryFn: () => giftAssignmentsApi.getByGift(giftId),
        enabled: !!giftId,
    })
}

export function useCreateGiftAssignment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            giftId,
            assignedToUserId,
        }: {
            giftId: string
            assignedToUserId: string
        }) => giftAssignmentsApi.create(giftId, assignedToUserId),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.giftAssignments(variables.giftId),
            })
        },
    })
}

export function useUpdateGiftAssignment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string
            data: { isPurchased?: boolean; purchasedAt?: number }
        }) => giftAssignmentsApi.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.giftAssignments,
            })
        },
    })
}

export function useDeleteGiftAssignment() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (id: string) => giftAssignmentsApi.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({
                queryKey: queryKeys.giftAssignments,
            })
        },
    })
}
