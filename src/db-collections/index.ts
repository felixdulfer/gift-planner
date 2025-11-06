import { Store } from '@tanstack/store'
import { z } from 'zod'

const MessageSchema = z.object({
	id: z.number(),
	text: z.string(),
	user: z.string(),
})

export type Message = z.infer<typeof MessageSchema>

type StoreData<T> = {
	items: Map<string | number, T>
}

export const messagesStore = new Store<StoreData<Message>>({ items: new Map() })

export const messagesCollection = {
	insert: (message: Message) => {
		messagesStore.setState((state) => {
			const newItems = new Map(state.items)
			newItems.set(message.id, message)
			return { items: newItems }
		})
	},
	get: (id: number) => {
		return messagesStore.state.items.get(id)
	},
	getAll: () => {
		return Array.from(messagesStore.state.items.values())
	},
}

// Export gift planner collections
export * from './gift-planner'
