import { z } from 'zod'

// User Schema
const UserSchema = z.preprocess(
    (data: {
        email?: string | null
        createdAt?: string | number
        [key: string]: unknown
    }) => {
        const processed: {
            email: string
            createdAt: number
            [key: string]: unknown
        } = {
            ...data,
            // Handle email: ensure it's a string
            email:
                data.email &&
                typeof data.email === 'string' &&
                data.email.trim()
                    ? data.email.trim()
                    : '',
        }

        // Convert createdAt from ISO string to timestamp if needed
        if (data.createdAt) {
            if (typeof data.createdAt === 'string') {
                const timestamp = new Date(data.createdAt).getTime()
                processed.createdAt = Number.isNaN(timestamp)
                    ? Date.now()
                    : timestamp
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
