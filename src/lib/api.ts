// API functions for gift planner entities using Firestore

import {
    addDoc,
    collection,
    type DocumentData,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    setDoc,
    Timestamp,
    updateDoc,
    where,
} from 'firebase/firestore'
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
import { auth, db } from './firebase'

// Helper to transform Firestore timestamps to numbers
function transformTimestamp(
    value: Timestamp | string | number | null | undefined,
): number {
    if (!value) return Date.now()
    if (typeof value === 'number') return value
    if (value instanceof Timestamp) return value.toMillis()
    if (typeof value === 'string') {
        const timestamp = new Date(value).getTime()
        return Number.isNaN(timestamp) ? Date.now() : timestamp
    }
    return Date.now()
}

// Helper to transform Firestore document to app type
function transformDoc<T>(docData: DocumentData, id: string): T {
    return {
        ...docData,
        id,
        createdAt: transformTimestamp(docData.createdAt || docData.created_at),
        updatedAt: transformTimestamp(docData.updatedAt || docData.updated_at),
    } as T
}

// Helper to transform user document
function transformUser(docData: DocumentData, id: string): User {
    try {
        const user = {
            id,
            name: docData.name || '',
            email: docData.email || '',
            createdAt: transformTimestamp(
                docData.createdAt || docData.created_at,
            ),
        }
        return UserSchema.parse(user)
    } catch (error) {
        console.error('User validation error:', error)
        throw new Error(
            `Invalid user data: ${error instanceof Error ? error.message : String(error)}`,
        )
    }
}

// Users API
export const usersApi = {
    getAll: async (): Promise<User[]> => {
        const q = query(collection(db, 'users'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) => transformUser(doc.data(), doc.id))
    },

    getById: async (id: string): Promise<User> => {
        const docRef = doc(db, 'users', id)
        const docSnap = await getDoc(docRef)
        if (!docSnap.exists()) throw new Error('User not found')
        return transformUser(docSnap.data(), docSnap.id)
    },

    create: async (data: {
        id: string
        name: string
        email?: string
    }): Promise<User> => {
        const userData = {
            name: data.name,
            email: data.email || null,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }
        await setDoc(doc(db, 'users', data.id), userData)
        return transformUser(userData, data.id)
    },

    update: async (
        id: string,
        data: { name?: string; email?: string },
    ): Promise<User> => {
        const docRef = doc(db, 'users', id)
        const updateData: DocumentData = {
            updatedAt: Timestamp.now(),
        }
        if (data.name) updateData.name = data.name
        if (data.email !== undefined) updateData.email = data.email || null
        await updateDoc(docRef, updateData)
        const updated = await getDoc(docRef)
        if (!updated.exists()) throw new Error('User not found after update')
        return transformUser(updated.data(), updated.id)
    },
}

// Groups API
export const groupsApi = {
    getAll: async (): Promise<Group[]> => {
        const q = query(collection(db, 'groups'), orderBy('createdAt', 'desc'))
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) =>
            transformDoc<Group>(
                {
                    ...doc.data(),
                    createdBy: doc.data().createdBy,
                },
                doc.id,
            ),
        )
    },

    getById: async (id: string): Promise<Group> => {
        const docRef = doc(db, 'groups', id)
        const docSnap = await getDoc(docRef)
        if (!docSnap.exists()) throw new Error('Group not found')
        return transformDoc<Group>(
            {
                ...docSnap.data(),
                createdBy: docSnap.data().createdBy,
            },
            docSnap.id,
        )
    },

    create: async (data: {
        name: string
        description?: string
    }): Promise<Group> => {
        const user = auth.currentUser
        if (!user) throw new Error('User not authenticated')

        const groupData = {
            name: data.name,
            description: data.description || null,
            createdBy: user.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }
        const docRef = await addDoc(collection(db, 'groups'), groupData)
        return transformDoc<Group>(groupData, docRef.id)
    },

    update: async (
        id: string,
        data: { name?: string; description?: string },
    ): Promise<Group> => {
        const docRef = doc(db, 'groups', id)
        const updateData: DocumentData = {
            updatedAt: Timestamp.now(),
        }
        if (data.name) updateData.name = data.name
        if (data.description !== undefined)
            updateData.description = data.description || null
        await updateDoc(docRef, updateData)
        const updated = await getDoc(docRef)
        if (!updated.exists()) throw new Error('Group not found after update')
        return transformDoc<Group>(updated.data(), updated.id)
    },

    delete: async (id: string): Promise<{ message: string }> => {
        await deleteDoc(doc(db, 'groups', id))
        return { message: 'Group deleted successfully' }
    },
}

// Group Members API
export const groupMembersApi = {
    getByGroup: async (groupId: string): Promise<GroupMember[]> => {
        const q = query(
            collection(db, 'groupMembers'),
            where('groupId', '==', groupId),
            orderBy('joinedAt', 'desc'),
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) =>
            transformDoc<GroupMember>(
                {
                    groupId: doc.data().groupId,
                    userId: doc.data().userId,
                    joinedAt: doc.data().joinedAt,
                },
                doc.id,
            ),
        )
    },

    add: async (groupId: string, userId: string): Promise<GroupMember> => {
        const memberData = {
            groupId,
            userId,
            joinedAt: Timestamp.now(),
        }
        const docRef = await addDoc(collection(db, 'groupMembers'), memberData)
        return transformDoc<GroupMember>(memberData, docRef.id)
    },

    remove: async (
        _groupId: string,
        memberId: string,
    ): Promise<{ message: string }> => {
        await deleteDoc(doc(db, 'groupMembers', memberId))
        return { message: 'Member removed successfully' }
    },
}

// Events API
export const eventsApi = {
    getByGroup: async (groupId: string): Promise<Event[]> => {
        const q = query(
            collection(db, 'events'),
            where('groupId', '==', groupId),
            orderBy('createdAt', 'desc'),
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) =>
            transformDoc<Event>(
                {
                    ...doc.data(),
                    groupId: doc.data().groupId,
                    createdBy: doc.data().createdBy,
                    date: doc.data().date,
                },
                doc.id,
            ),
        )
    },

    getById: async (id: string): Promise<Event> => {
        const docRef = doc(db, 'events', id)
        const docSnap = await getDoc(docRef)
        if (!docSnap.exists()) throw new Error('Event not found')
        return transformDoc<Event>(
            {
                ...docSnap.data(),
                groupId: docSnap.data().groupId,
                createdBy: docSnap.data().createdBy,
                date: docSnap.data().date,
            },
            docSnap.id,
        )
    },

    create: async (
        groupId: string,
        data: { name: string; description?: string; date?: number },
    ): Promise<Event> => {
        const user = auth.currentUser
        if (!user) throw new Error('User not authenticated')

        const eventData = {
            groupId,
            name: data.name,
            description: data.description || null,
            date: data.date ? Timestamp.fromMillis(data.date) : null,
            createdBy: user.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }
        const docRef = await addDoc(collection(db, 'events'), eventData)
        return transformDoc<Event>(eventData, docRef.id)
    },

    update: async (
        id: string,
        data: { name?: string; description?: string; date?: number },
    ): Promise<Event> => {
        const docRef = doc(db, 'events', id)
        const updateData: DocumentData = {
            updatedAt: Timestamp.now(),
        }
        if (data.name) updateData.name = data.name
        if (data.description !== undefined)
            updateData.description = data.description || null
        if (data.date !== undefined)
            updateData.date = data.date ? Timestamp.fromMillis(data.date) : null
        await updateDoc(docRef, updateData)
        const updated = await getDoc(docRef)
        if (!updated.exists()) throw new Error('Event not found after update')
        return transformDoc<Event>(updated.data(), updated.id)
    },

    delete: async (id: string): Promise<{ message: string }> => {
        await deleteDoc(doc(db, 'events', id))
        return { message: 'Event deleted successfully' }
    },
}

// Receivers API
export const receiversApi = {
    getByEvent: async (eventId: string): Promise<Receiver[]> => {
        const q = query(
            collection(db, 'receivers'),
            where('eventId', '==', eventId),
            orderBy('createdAt', 'desc'),
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) =>
            transformDoc<Receiver>(
                {
                    ...doc.data(),
                    eventId: doc.data().eventId,
                    createdBy: doc.data().createdBy,
                },
                doc.id,
            ),
        )
    },

    getById: async (id: string): Promise<Receiver> => {
        const docRef = doc(db, 'receivers', id)
        const docSnap = await getDoc(docRef)
        if (!docSnap.exists()) throw new Error('Receiver not found')
        return transformDoc<Receiver>(
            {
                ...docSnap.data(),
                eventId: docSnap.data().eventId,
                createdBy: docSnap.data().createdBy,
            },
            docSnap.id,
        )
    },

    create: async (
        eventId: string,
        data: { name: string },
    ): Promise<Receiver> => {
        const user = auth.currentUser
        if (!user) throw new Error('User not authenticated')

        const receiverData = {
            eventId,
            name: data.name,
            createdBy: user.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }
        const docRef = await addDoc(collection(db, 'receivers'), receiverData)
        return transformDoc<Receiver>(receiverData, docRef.id)
    },

    update: async (id: string, data: { name?: string }): Promise<Receiver> => {
        const docRef = doc(db, 'receivers', id)
        const updateData: DocumentData = {
            updatedAt: Timestamp.now(),
        }
        if (data.name) updateData.name = data.name
        await updateDoc(docRef, updateData)
        const updated = await getDoc(docRef)
        if (!updated.exists())
            throw new Error('Receiver not found after update')
        return transformDoc<Receiver>(updated.data(), updated.id)
    },

    delete: async (id: string): Promise<{ message: string }> => {
        await deleteDoc(doc(db, 'receivers', id))
        return { message: 'Receiver deleted successfully' }
    },
}

// Wishlists API
export const wishlistsApi = {
    getByReceiver: async (receiverId: string): Promise<Wishlist[]> => {
        const q = query(
            collection(db, 'wishlists'),
            where('receiverId', '==', receiverId),
            orderBy('createdAt', 'desc'),
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) =>
            transformDoc<Wishlist>(
                {
                    ...doc.data(),
                    receiverId: doc.data().receiverId,
                    eventId: doc.data().eventId || undefined,
                    createdBy: doc.data().createdBy,
                },
                doc.id,
            ),
        )
    },

    getById: async (id: string): Promise<Wishlist> => {
        const docRef = doc(db, 'wishlists', id)
        const docSnap = await getDoc(docRef)
        if (!docSnap.exists()) throw new Error('Wishlist not found')
        return transformDoc<Wishlist>(
            {
                ...docSnap.data(),
                receiverId: docSnap.data().receiverId,
                eventId: docSnap.data().eventId || undefined,
                createdBy: docSnap.data().createdBy,
            },
            docSnap.id,
        )
    },

    create: async (
        receiverId: string,
        data: { eventId?: string; name?: string },
    ): Promise<Wishlist> => {
        const user = auth.currentUser
        if (!user) throw new Error('User not authenticated')

        const wishlistData = {
            receiverId,
            eventId: data.eventId || null,
            name: data.name || null,
            createdBy: user.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }
        const docRef = await addDoc(collection(db, 'wishlists'), wishlistData)
        return transformDoc<Wishlist>(wishlistData, docRef.id)
    },

    update: async (
        id: string,
        data: { eventId?: string; name?: string },
    ): Promise<Wishlist> => {
        const docRef = doc(db, 'wishlists', id)
        const updateData: DocumentData = {
            updatedAt: Timestamp.now(),
        }
        if (data.eventId !== undefined)
            updateData.eventId = data.eventId || null
        if (data.name !== undefined) updateData.name = data.name || null
        await updateDoc(docRef, updateData)
        const updated = await getDoc(docRef)
        if (!updated.exists())
            throw new Error('Wishlist not found after update')
        return transformDoc<Wishlist>(updated.data(), updated.id)
    },

    delete: async (id: string): Promise<{ message: string }> => {
        await deleteDoc(doc(db, 'wishlists', id))
        return { message: 'Wishlist deleted successfully' }
    },
}

// Gifts API
export const giftsApi = {
    getByWishlist: async (wishlistId: string): Promise<Gift[]> => {
        const q = query(
            collection(db, 'gifts'),
            where('wishlistId', '==', wishlistId),
            orderBy('createdAt', 'desc'),
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) =>
            transformDoc<Gift>(
                {
                    ...doc.data(),
                    wishlistId: doc.data().wishlistId,
                    createdBy: doc.data().createdBy,
                    isQualified: doc.data().isQualified ?? false,
                },
                doc.id,
            ),
        )
    },

    getById: async (id: string): Promise<Gift> => {
        const docRef = doc(db, 'gifts', id)
        const docSnap = await getDoc(docRef)
        if (!docSnap.exists()) throw new Error('Gift not found')
        return transformDoc<Gift>(
            {
                ...docSnap.data(),
                wishlistId: docSnap.data().wishlistId,
                createdBy: docSnap.data().createdBy,
                isQualified: docSnap.data().isQualified ?? false,
            },
            docSnap.id,
        )
    },

    create: async (
        wishlistId: string,
        data: {
            name: string
            picture?: string
            link?: string
            isQualified?: boolean
        },
    ): Promise<Gift> => {
        const user = auth.currentUser
        if (!user) throw new Error('User not authenticated')

        const giftData = {
            wishlistId,
            name: data.name,
            picture: data.picture || null,
            link: data.link || null,
            isQualified: data.isQualified ?? false,
            createdBy: user.uid,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
        }
        const docRef = await addDoc(collection(db, 'gifts'), giftData)
        return transformDoc<Gift>(giftData, docRef.id)
    },

    update: async (
        id: string,
        data: {
            name?: string
            picture?: string
            link?: string
            isQualified?: boolean
        },
    ): Promise<Gift> => {
        const docRef = doc(db, 'gifts', id)
        const updateData: DocumentData = {
            updatedAt: Timestamp.now(),
        }
        if (data.name) updateData.name = data.name
        if (data.picture !== undefined)
            updateData.picture = data.picture || null
        if (data.link !== undefined) updateData.link = data.link || null
        if (data.isQualified !== undefined)
            updateData.isQualified = data.isQualified
        await updateDoc(docRef, updateData)
        const updated = await getDoc(docRef)
        if (!updated.exists()) throw new Error('Gift not found after update')
        return transformDoc<Gift>(updated.data(), updated.id)
    },

    delete: async (id: string): Promise<{ message: string }> => {
        await deleteDoc(doc(db, 'gifts', id))
        return { message: 'Gift deleted successfully' }
    },
}

// Gift Assignments API
export const giftAssignmentsApi = {
    getByGift: async (giftId: string): Promise<GiftAssignment[]> => {
        const q = query(
            collection(db, 'giftAssignments'),
            where('giftId', '==', giftId),
            orderBy('assignedAt', 'desc'),
        )
        const snapshot = await getDocs(q)
        return snapshot.docs.map((doc) =>
            transformDoc<GiftAssignment>(
                {
                    ...doc.data(),
                    giftId: doc.data().giftId,
                    assignedToUserId: doc.data().assignedToUserId,
                    assignedAt: doc.data().assignedAt,
                    assignedBy: doc.data().assignedBy,
                    isPurchased: doc.data().isPurchased ?? false,
                    purchasedAt: doc.data().purchasedAt,
                },
                doc.id,
            ),
        )
    },

    create: async (
        giftId: string,
        assignedToUserId: string,
    ): Promise<GiftAssignment> => {
        const user = auth.currentUser
        if (!user) throw new Error('User not authenticated')

        const assignmentData = {
            giftId,
            assignedToUserId,
            assignedBy: user.uid,
            assignedAt: Timestamp.now(),
            isPurchased: false,
            purchasedAt: null,
            updatedAt: Timestamp.now(),
        }
        const docRef = await addDoc(
            collection(db, 'giftAssignments'),
            assignmentData,
        )
        return transformDoc<GiftAssignment>(assignmentData, docRef.id)
    },

    update: async (
        id: string,
        data: { isPurchased?: boolean; purchasedAt?: number },
    ): Promise<GiftAssignment> => {
        const docRef = doc(db, 'giftAssignments', id)
        const updateData: DocumentData = {
            updatedAt: Timestamp.now(),
        }
        if (data.isPurchased !== undefined)
            updateData.isPurchased = data.isPurchased
        if (data.purchasedAt !== undefined)
            updateData.purchasedAt = data.purchasedAt
                ? Timestamp.fromMillis(data.purchasedAt)
                : null
        await updateDoc(docRef, updateData)
        const updated = await getDoc(docRef)
        if (!updated.exists())
            throw new Error('Gift assignment not found after update')
        return transformDoc<GiftAssignment>(updated.data(), updated.id)
    },

    delete: async (id: string): Promise<{ message: string }> => {
        await deleteDoc(doc(db, 'giftAssignments', id))
        return { message: 'Assignment deleted successfully' }
    },
}
