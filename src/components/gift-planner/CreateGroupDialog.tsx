import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Plus } from "lucide-react";
import { useLiveQuery } from "@tanstack/react-db";

import {
	groupsCollection,
	groupMembersCollection,
	usersCollection,
} from "@/db-collections";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
	generateId,
	getCurrentTimestamp,
	getCurrentUserId,
} from "@/utils/gift-planner";

export function CreateGroupDialog() {
	const [open, setOpen] = useState(false);
	const currentUserId = getCurrentUserId();
	const users = useLiveQuery(usersCollection, () => ({
		filter: {},
	}));

	const form = useForm({
		defaultValues: {
			name: "",
			description: "",
		},
		onSubmit: async ({ value }) => {
			const now = getCurrentTimestamp();

			// Ensure current user exists
			const existingUser = users.data?.find((u) => u.id === currentUserId);
			if (!existingUser) {
				usersCollection.insert({
					id: currentUserId,
					name: "You",
					createdAt: now,
				});
			}

			// Create group
			const groupId = generateId();
			groupsCollection.insert({
				id: groupId,
				name: value.name,
				description: value.description || undefined,
				createdAt: now,
				createdBy: currentUserId,
			});

			// Add creator as member
			groupMembersCollection.insert({
				id: generateId(),
				groupId,
				userId: currentUserId,
				joinedAt: now,
			});

			setOpen(false);
			form.reset();
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>
					<Plus className="w-4 h-4 mr-2" />
					Create Group
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create New Group</DialogTitle>
					<DialogDescription>
						Create a new group to start planning gifts together
					</DialogDescription>
				</DialogHeader>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						e.stopPropagation();
						form.handleSubmit();
					}}
				>
					<div className="grid gap-4 py-4">
						<form.Field
							name="name"
							validators={{
								onChange: ({ value }) =>
									!value ? "Group name is required" : undefined,
							}}
						>
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Group Name</Label>
									<Input
										id={field.name}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
									{field.state.meta.errors && (
										<p className="text-sm text-destructive">
											{field.state.meta.errors[0]}
										</p>
									)}
								</div>
							)}
						</form.Field>
						<form.Field name="description">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Description (optional)</Label>
									<Textarea
										id={field.name}
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
								</div>
							)}
						</form.Field>
					</div>
					<DialogFooter>
						<Button type="submit">Create Group</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
