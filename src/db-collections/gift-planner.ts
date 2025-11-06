import {
	createCollection,
	localOnlyCollectionOptions,
} from "@tanstack/react-db";
import { z } from "zod";

// User Schema
const UserSchema = z.preprocess(
	(data: { email?: string; [key: string]: unknown }) => ({
		...data,
		email: data.email?.trim() || undefined,
	}),
	z.object({
		id: z.string(),
		name: z.string(),
		email: z.string().email().optional(),
		createdAt: z.number(),
	}),
);

export type User = z.infer<typeof UserSchema>;

// Group Schema
const GroupSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	createdAt: z.number(),
	createdBy: z.string(), // userId
});

export type Group = z.infer<typeof GroupSchema>;

// GroupMember Schema (join table)
const GroupMemberSchema = z.object({
	id: z.string(),
	groupId: z.string(),
	userId: z.string(),
	joinedAt: z.number(),
});

export type GroupMember = z.infer<typeof GroupMemberSchema>;

// Event Schema
const EventSchema = z.object({
	id: z.string(),
	groupId: z.string(),
	name: z.string(),
	description: z.string().optional(),
	date: z.number().optional(), // timestamp
	createdAt: z.number(),
	createdBy: z.string(), // userId
});

export type Event = z.infer<typeof EventSchema>;

// Receiver Schema
const ReceiverSchema = z.object({
	id: z.string(),
	eventId: z.string(),
	name: z.string(),
	createdAt: z.number(),
	createdBy: z.string(), // userId
});

export type Receiver = z.infer<typeof ReceiverSchema>;

// Wishlist Schema
const WishlistSchema = z.object({
	id: z.string(),
	receiverId: z.string(),
	eventId: z.string().optional(), // if null, it's a general wishlist
	name: z.string().optional(), // optional name for the wishlist
	createdAt: z.number(),
	createdBy: z.string(), // userId
});

export type Wishlist = z.infer<typeof WishlistSchema>;

// Gift Schema
const GiftSchema = z.object({
	id: z.string(),
	wishlistId: z.string(),
	name: z.string(),
	picture: z.string().url().optional(),
	link: z.string().url().optional(),
	createdAt: z.number(),
	createdBy: z.string(), // userId
});

export type Gift = z.infer<typeof GiftSchema>;

// GiftAssignment Schema
const GiftAssignmentSchema = z.object({
	id: z.string(),
	giftId: z.string(),
	assignedToUserId: z.string(),
	assignedAt: z.number(),
	assignedBy: z.string(), // userId
	isPurchased: z.boolean().default(false),
	purchasedAt: z.number().optional(),
});

export type GiftAssignment = z.infer<typeof GiftAssignmentSchema>;

// Collections
export const usersCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (user) => user.id,
		schema: UserSchema,
	}),
);

export const groupsCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (group) => group.id,
		schema: GroupSchema,
	}),
);

export const groupMembersCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (member) => member.id,
		schema: GroupMemberSchema,
	}),
);

export const eventsCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (event) => event.id,
		schema: EventSchema,
	}),
);

export const receiversCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (receiver) => receiver.id,
		schema: ReceiverSchema,
	}),
);

export const wishlistsCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (wishlist) => wishlist.id,
		schema: WishlistSchema,
	}),
);

export const giftsCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (gift) => gift.id,
		schema: GiftSchema,
	}),
);

export const giftAssignmentsCollection = createCollection(
	localOnlyCollectionOptions({
		getKey: (assignment) => assignment.id,
		schema: GiftAssignmentSchema,
	}),
);
