import { Store } from '@tanstack/store'
import { z } from 'zod'

// User Schema
const UserSchema = z.preprocess(
    (data: { email?: string | null; createdAt?: string | number; [key: string]: unknown }) => {
        const processed: { email: string; createdAt: number; [key: string]: unknown } = {
            ...data,
            // Handle email: ensure it's a string
            email: data.email && typeof data.email === 'string' && data.email.trim() 
                ? data.email.trim() 
                : '',
        }
        
        // Convert createdAt from ISO string to timestamp if needed
        if (data.createdAt) {
            if (typeof data.createdAt === 'string') {
                const timestamp = new Date(data.createdAt).getTime()
                processed.createdAt = isNaN(timestamp) ? Date.now() : timestamp
            } else {
                processed.createdAt = data.createdAt
            }
        } else {
            processed.createdAt = Date.now()
        }
        
        return processed
    },
    z.object({
        id: z.string(),
        name: z.string(),
        email: z.string().email(),
        createdAt: z.number(),
    }),
)

export type User = z.infer<typeof UserSchema>

// Export schema for validation
export { UserSchema }

// Group Schema
const GroupSchema = z.object({
    id: z.string(),
    name: z.string(),
    description: z.string().optional(),
    createdAt: z.number(),
    createdBy: z.string(), // userId
})

export type Group = z.infer<typeof GroupSchema>

// GroupMember Schema (join table)
const GroupMemberSchema = z.object({
    id: z.string(),
    groupId: z.string(),
    userId: z.string(),
    joinedAt: z.number(),
})

export type GroupMember = z.infer<typeof GroupMemberSchema>

// Event Schema
const EventSchema = z.object({
    id: z.string(),
    groupId: z.string(),
    name: z.string(),
    description: z.string().optional(),
    date: z.number().optional(), // timestamp
    createdAt: z.number(),
    createdBy: z.string(), // userId
})

export type Event = z.infer<typeof EventSchema>

// Receiver Schema
const ReceiverSchema = z.object({
    id: z.string(),
    eventId: z.string(),
    name: z.string(),
    createdAt: z.number(),
    createdBy: z.string(), // userId
})

export type Receiver = z.infer<typeof ReceiverSchema>

// Wishlist Schema
const WishlistSchema = z.object({
    id: z.string(),
    receiverId: z.string(),
    eventId: z.string().optional(), // if null, it's a general wishlist
    name: z.string().optional(), // optional name for the wishlist
    createdAt: z.number(),
    createdBy: z.string(), // userId
})

export type Wishlist = z.infer<typeof WishlistSchema>

// Gift Schema
const GiftSchema = z.object({
    id: z.string(),
    wishlistId: z.string(),
    name: z.string(),
    picture: z
        .string()
        .refine(
            (val) =>
                !val ||
                val.startsWith('data:') ||
                z.string().url().safeParse(val).success,
            { message: 'Must be a valid URL or data URL' },
        )
        .optional(),
    link: z.string().url().optional(),
    isQualified: z.boolean().default(false),
    createdAt: z.number(),
    createdBy: z.string(), // userId
})

export type Gift = z.infer<typeof GiftSchema>

// GiftAssignment Schema
const GiftAssignmentSchema = z.object({
    id: z.string(),
    giftId: z.string(),
    assignedToUserId: z.string(),
    assignedAt: z.number(),
    assignedBy: z.string(), // userId
    isPurchased: z.boolean().default(false),
    purchasedAt: z.number().optional(),
})

export type GiftAssignment = z.infer<typeof GiftAssignmentSchema>

// Store types
type StoreData<T> = {
    items: Map<string, T>
}

// Create stores
export const usersStore = new Store<StoreData<User>>({ items: new Map() })
export const groupsStore = new Store<StoreData<Group>>({ items: new Map() })
export const groupMembersStore = new Store<StoreData<GroupMember>>({
    items: new Map(),
})
export const eventsStore = new Store<StoreData<Event>>({ items: new Map() })
export const receiversStore = new Store<StoreData<Receiver>>({
    items: new Map(),
})
export const wishlistsStore = new Store<StoreData<Wishlist>>({
    items: new Map(),
})
export const giftsStore = new Store<StoreData<Gift>>({ items: new Map() })
export const giftAssignmentsStore = new Store<StoreData<GiftAssignment>>({
    items: new Map(),
})

// Collection-like API for compatibility
export const usersCollection = {
    insert: (user: User) => {
        usersStore.setState((state) => {
            const newItems = new Map(state.items)
            newItems.set(user.id, user)
            return { items: newItems }
        })
    },
    get: (id: string) => {
        return usersStore.state.items.get(id)
    },
    getAll: () => {
        return Array.from(usersStore.state.items.values())
    },
}

export const groupsCollection = {
    insert: (group: Group) => {
        groupsStore.setState((state) => {
            const newItems = new Map(state.items)
            newItems.set(group.id, group)
            return { items: newItems }
        })
    },
    update: (id: string, updater: (draft: Group) => void) => {
        groupsStore.setState((state) => {
            const item = state.items.get(id)
            if (!item) return state
            const draft = { ...item }
            updater(draft)
            const newItems = new Map(state.items)
            newItems.set(id, draft)
            return { items: newItems }
        })
    },
    get: (id: string) => {
        return groupsStore.state.items.get(id)
    },
    getAll: () => {
        return Array.from(groupsStore.state.items.values())
    },
}

export const groupMembersCollection = {
    insert: (member: GroupMember) => {
        groupMembersStore.setState((state) => {
            const newItems = new Map(state.items)
            newItems.set(member.id, member)
            return { items: newItems }
        })
    },
    get: (id: string) => {
        return groupMembersStore.state.items.get(id)
    },
    getAll: () => {
        return Array.from(groupMembersStore.state.items.values())
    },
}

export const eventsCollection = {
    insert: (event: Event) => {
        eventsStore.setState((state) => {
            const newItems = new Map(state.items)
            newItems.set(event.id, event)
            return { items: newItems }
        })
    },
    update: (id: string, updater: (draft: Event) => void) => {
        eventsStore.setState((state) => {
            const item = state.items.get(id)
            if (!item) return state
            const draft = { ...item }
            updater(draft)
            const newItems = new Map(state.items)
            newItems.set(id, draft)
            return { items: newItems }
        })
    },
    get: (id: string) => {
        return eventsStore.state.items.get(id)
    },
    getAll: () => {
        return Array.from(eventsStore.state.items.values())
    },
}

export const receiversCollection = {
    insert: (receiver: Receiver) => {
        receiversStore.setState((state) => {
            const newItems = new Map(state.items)
            newItems.set(receiver.id, receiver)
            return { items: newItems }
        })
    },
    update: (id: string, updater: (draft: Receiver) => void) => {
        receiversStore.setState((state) => {
            const item = state.items.get(id)
            if (!item) return state
            const draft = { ...item }
            updater(draft)
            const newItems = new Map(state.items)
            newItems.set(id, draft)
            return { items: newItems }
        })
    },
    get: (id: string) => {
        return receiversStore.state.items.get(id)
    },
    getAll: () => {
        return Array.from(receiversStore.state.items.values())
    },
}

export const wishlistsCollection = {
    insert: (wishlist: Wishlist) => {
        wishlistsStore.setState((state) => {
            const newItems = new Map(state.items)
            newItems.set(wishlist.id, wishlist)
            return { items: newItems }
        })
    },
    update: (id: string, updater: (draft: Wishlist) => void) => {
        wishlistsStore.setState((state) => {
            const item = state.items.get(id)
            if (!item) return state
            const draft = { ...item }
            updater(draft)
            const newItems = new Map(state.items)
            newItems.set(id, draft)
            return { items: newItems }
        })
    },
    get: (id: string) => {
        return wishlistsStore.state.items.get(id)
    },
    getAll: () => {
        return Array.from(wishlistsStore.state.items.values())
    },
}

export const giftsCollection = {
    insert: (gift: Gift) => {
        giftsStore.setState((state) => {
            const newItems = new Map(state.items)
            newItems.set(gift.id, gift)
            return { items: newItems }
        })
    },
    update: (id: string, updater: (draft: Gift) => void) => {
        giftsStore.setState((state) => {
            const item = state.items.get(id)
            if (!item) return state
            const draft = { ...item }
            updater(draft)
            const newItems = new Map(state.items)
            newItems.set(id, draft)
            return { items: newItems }
        })
    },
    get: (id: string) => {
        return giftsStore.state.items.get(id)
    },
    getAll: () => {
        return Array.from(giftsStore.state.items.values())
    },
}

export const giftAssignmentsCollection = {
    insert: (assignment: GiftAssignment) => {
        giftAssignmentsStore.setState((state) => {
            const newItems = new Map(state.items)
            newItems.set(assignment.id, assignment)
            return { items: newItems }
        })
    },
    update: (id: string, updater: (draft: GiftAssignment) => void) => {
        giftAssignmentsStore.setState((state) => {
            const item = state.items.get(id)
            if (!item) return state
            const draft = { ...item }
            updater(draft)
            const newItems = new Map(state.items)
            newItems.set(id, draft)
            return { items: newItems }
        })
    },
    delete: (id: string) => {
        giftAssignmentsStore.setState((state) => {
            const newItems = new Map(state.items)
            newItems.delete(id)
            return { items: newItems }
        })
    },
    get: (id: string) => {
        return giftAssignmentsStore.state.items.get(id)
    },
    getAll: () => {
        return Array.from(giftAssignmentsStore.state.items.values())
    },
}
