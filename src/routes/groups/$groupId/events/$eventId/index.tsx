import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "@tanstack/react-db";
import { ArrowLeft, Gift, UserPlus } from "lucide-react";

import {
	eventsCollection,
	receiversCollection,
	wishlistsCollection,
	giftsCollection,
	giftAssignmentsCollection,
	usersCollection,
} from "@/db-collections";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreateReceiverDialog } from "@/components/gift-planner/CreateReceiverDialog";
import { ReceiverCard } from "@/components/gift-planner/ReceiverCard";
import { usePersistCollection } from "@/utils/persistence";

export const Route = createFileRoute("/groups/$groupId/events/$eventId/")({
	ssr: false,
	component: EventDetailPage,
});

function EventDetailPage() {
	const { groupId, eventId } = Route.useParams();
	const event = useLiveQuery(eventsCollection, () => ({
		filter: { id: eventId },
		single: true,
	}));
	const receivers = useLiveQuery(receiversCollection, () => ({
		filter: { eventId },
	}));
	const wishlists = useLiveQuery(wishlistsCollection, () => ({
		filter: {},
	}));
	const gifts = useLiveQuery(giftsCollection, () => ({
		filter: {},
	}));
	const assignments = useLiveQuery(giftAssignmentsCollection, () => ({
		filter: {},
	}));
	const users = useLiveQuery(usersCollection, () => ({
		filter: {},
	}));

	// Persist all collections
	// Note: For events, we need to get all events, not just the single one
	const allEvents = useLiveQuery(eventsCollection, () => ({
		filter: {},
	}));
	usePersistCollection(eventsCollection, "events", allEvents.data);
	usePersistCollection(receiversCollection, "receivers", receivers.data);
	usePersistCollection(wishlistsCollection, "wishlists", wishlists.data);
	usePersistCollection(giftsCollection, "gifts", gifts.data);
	usePersistCollection(
		giftAssignmentsCollection,
		"giftAssignments",
		assignments.data,
	);
	usePersistCollection(usersCollection, "users", users.data);

	if (!event.data) {
		return (
			<div className="container mx-auto py-8 px-4">
				<p>Event not found</p>
			</div>
		);
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="mb-6">
				<Link to="/groups/$groupId" params={{ groupId }}>
					<Button variant="ghost" size="sm" className="mb-4">
						<ArrowLeft className="w-4 h-4 mr-2" />
						Back to Group
					</Button>
				</Link>
				<div className="flex items-start justify-between">
					<div>
						<h1 className="text-3xl font-bold">{event.data.name}</h1>
						{event.data.description && (
							<p className="text-muted-foreground mt-2">
								{event.data.description}
							</p>
						)}
						{event.data.date && (
							<p className="text-muted-foreground mt-2">
								{new Date(event.data.date).toLocaleDateString()}
							</p>
						)}
					</div>
					<CreateReceiverDialog eventId={eventId} />
				</div>
			</div>

			<Separator className="my-6" />

			<div>
				<h2 className="text-2xl font-semibold mb-4">Gift Receivers</h2>
				{receivers.data && receivers.data.length > 0 ? (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{receivers.data.map((receiver) => (
							<ReceiverCard
								key={receiver.id}
								receiver={receiver}
								eventId={eventId}
								wishlists={wishlists.data ?? []}
								gifts={gifts.data ?? []}
								assignments={assignments.data ?? []}
								users={users.data ?? []}
							/>
						))}
					</div>
				) : (
					<Card className="text-center py-12">
						<CardContent>
							<Gift className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
							<CardTitle className="mb-2">No receivers yet</CardTitle>
							<CardDescription className="mb-6">
								Add gift receivers to start managing wishlists
							</CardDescription>
							<CreateReceiverDialog eventId={eventId} />
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
