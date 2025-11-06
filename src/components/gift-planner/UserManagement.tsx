import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { UserPlus, Users } from "lucide-react";
import { useLiveQuery } from "@tanstack/react-db";

import {
	usersCollection,
	groupMembersCollection,
	groupsCollection,
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	generateId,
	getCurrentTimestamp,
	getCurrentUserId,
} from "@/utils/gift-planner";

export function AddUserDialog() {
	const [open, setOpen] = useState(false);
	const form = useForm({
		defaultValues: {
			name: "",
			email: "",
		},
		onSubmit: async ({ value }) => {
			const now = getCurrentTimestamp();

			try {
				usersCollection.insert({
					id: generateId(),
					name: value.name,
					email:
						value.email && value.email.trim() ? value.email.trim() : undefined,
					createdAt: now,
				});

				setOpen(false);
				form.reset();
			} catch (error) {
				console.error("Error adding user:", error);
				// You might want to show an error message to the user here
			}
		},
	});

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">
					<UserPlus className="w-4 h-4 mr-2" />
					Add User
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add User</DialogTitle>
					<DialogDescription>Add a new user to the system</DialogDescription>
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
									!value ? "Name is required" : undefined,
							}}
						>
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Name</Label>
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
						<form.Field name="email">
							{(field) => (
								<div className="grid gap-2">
									<Label htmlFor={field.name}>Email (optional)</Label>
									<Input
										id={field.name}
										type="email"
										value={field.state.value}
										onChange={(e) => field.handleChange(e.target.value)}
										onBlur={field.handleBlur}
									/>
								</div>
							)}
						</form.Field>
					</div>
					<DialogFooter>
						<Button type="submit">Add User</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

export function JoinGroupDialog({ groupId }: { groupId: string }) {
	const [open, setOpen] = useState(false);
	const users = useLiveQuery(usersCollection, () => ({
		filter: {},
	}));
	const groupMembers = useLiveQuery(groupMembersCollection, () => ({
		filter: { groupId },
	}));
	const [selectedUserId, setSelectedUserId] = useState<string>("");

	const handleJoin = () => {
		if (!selectedUserId) return;

		const now = getCurrentTimestamp();
		const existingMember = groupMembers.data?.find(
			(m) => m.userId === selectedUserId,
		);

		if (!existingMember) {
			groupMembersCollection.insert({
				id: generateId(),
				groupId,
				userId: selectedUserId,
				joinedAt: now,
			});
		}

		setOpen(false);
		setSelectedUserId("");
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant="outline">
					<Users className="w-4 h-4 mr-2" />
					Join Group
				</Button>
			</DialogTrigger>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Join Group</DialogTitle>
					<DialogDescription>
						Select a user to join this group
					</DialogDescription>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="grid gap-2">
						<Label>Select User</Label>
						<Select value={selectedUserId} onValueChange={setSelectedUserId}>
							<SelectTrigger>
								<SelectValue placeholder="Choose a user" />
							</SelectTrigger>
							<SelectContent>
								{users.data?.map((user) => (
									<SelectItem key={user.id} value={user.id}>
										{user.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleJoin} disabled={!selectedUserId}>
						Join Group
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
