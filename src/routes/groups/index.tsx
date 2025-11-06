import { createFileRoute, Link } from "@tanstack/react-router";
import { useLiveQuery } from "@tanstack/react-db";
import { Plus, Users } from "lucide-react";

import {
	groupsCollection,
	groupMembersCollection,
	usersCollection,
	type Group,
} from "@/db-collections";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { getCurrentUserId } from "@/utils/gift-planner";
import { CreateGroupDialog } from "@/components/gift-planner/CreateGroupDialog";
import { usePersistCollection } from "@/utils/persistence";

export const Route = createFileRoute("/groups/")({
	ssr: false,
	component: GroupsPage,
});

function GroupsPage() {
	const currentUserId = getCurrentUserId();

	const groups = useLiveQuery(groupsCollection, () => ({
		filter: {},
	}));
	const groupMembers = useLiveQuery(groupMembersCollection, () => ({
		filter: {},
	}));
	const users = useLiveQuery(usersCollection, () => ({
		filter: {},
	}));

	// Persist collections to localStorage
	usePersistCollection(usersCollection, "users", users.data);
	usePersistCollection(groupsCollection, "groups", groups.data);
	usePersistCollection(
		groupMembersCollection,
		"groupMembers",
		groupMembers.data,
	);

	// Get groups the current user is a member of
	const userGroups = groups.data?.filter((group) => {
		return groupMembers.data?.some(
			(member) =>
				member.groupId === group.id && member.userId === currentUserId,
		);
	});

	return (
		<div className="container mx-auto py-8 px-4 max-w-6xl">
			<div className="flex items-center justify-between mb-8">
				<div>
					<h1 className="text-3xl font-bold">My Groups</h1>
					<p className="text-muted-foreground mt-2">
						Manage your gift planning groups
					</p>
				</div>
				<CreateGroupDialog />
			</div>

			{userGroups && userGroups.length > 0 ? (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
					{userGroups.map((group) => (
						<GroupCard key={group.id} group={group} />
					))}
				</div>
			) : (
				<Card className="text-center py-12">
					<CardContent>
						<Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
						<CardTitle className="mb-2">No groups yet</CardTitle>
						<CardDescription className="mb-6">
							Create your first group to start planning gifts
						</CardDescription>
						<CreateGroupDialog />
					</CardContent>
				</Card>
			)}
		</div>
	);
}

function GroupCard({ group }: { group: Group }) {
	const groupMembers = useLiveQuery(groupMembersCollection, () => ({
		filter: { groupId: group.id },
	}));
	const users = useLiveQuery(usersCollection, () => ({
		filter: {},
	}));

	const memberCount = groupMembers.data?.length ?? 0;
	const memberNames = groupMembers.data
		?.map((member) => {
			const user = users.data?.find((u) => u.id === member.userId);
			return user?.name ?? "Unknown";
		})
		.slice(0, 3);

	return (
		<Card className="hover:shadow-lg transition-shadow">
			<CardHeader>
				<CardTitle>{group.name}</CardTitle>
				{group.description && (
					<CardDescription>{group.description}</CardDescription>
				)}
			</CardHeader>
			<CardContent>
				<div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
					<Users className="w-4 h-4" />
					<span>
						{memberCount} {memberCount === 1 ? "member" : "members"}
						{memberNames && memberNames.length > 0 && (
							<span> • {memberNames.join(", ")}</span>
						)}
					</span>
				</div>
				<Link to="/groups/$groupId" params={{ groupId: group.id }}>
					<Button className="w-full">View Group</Button>
				</Link>
			</CardContent>
		</Card>
	);
}
