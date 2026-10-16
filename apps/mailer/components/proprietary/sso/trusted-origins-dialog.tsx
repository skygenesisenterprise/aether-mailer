"use client";

import { Pencil, Plus, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DialogAction } from "@/components/shared/dialog-action";
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
import { api } from "@/utils/api";

interface Props {
	children: React.ReactNode;
}

export const TrustedOriginsDialog = ({ children }: Props) => {
	const utils = api.useUtils();
	const [open, setOpen] = useState(false);
	const [editingOrigin, setEditingOrigin] = useState<string | null>(null);
	const [editingValue, setEditingValue] = useState("");
	const [newOriginInput, setNewOriginInput] = useState("");

	const { data: trustedOrigins = [] } = api.sso.getTrustedOrigins.useQuery(
		undefined,
		{ enabled: open },
	);
	const { mutateAsync: addTrustedOrigin, isPending: isAddingOrigin } =
		api.sso.addTrustedOrigin.useMutation();
	const { mutateAsync: removeTrustedOrigin, isPending: isRemovingOrigin } =
		api.sso.removeTrustedOrigin.useMutation();
	const { mutateAsync: updateTrustedOrigin, isPending: isUpdatingOrigin } =
		api.sso.updateTrustedOrigin.useMutation();

	const handleAddOrigin = async () => {
		const value = newOriginInput.trim();
		if (!value) return;
		try {
			await addTrustedOrigin({ origin: value });
			toast.success("Trusted origin added");
			setNewOriginInput("");
			await utils.sso.getTrustedOrigins.invalidate();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to add trusted origin",
			);
		}
	};

	const handleRemoveOrigin = async (origin: string) => {
		try {
			await removeTrustedOrigin({ origin });
			toast.success("Trusted origin removed");
			if (editingOrigin === origin) setEditingOrigin(null);
			await utils.sso.getTrustedOrigins.invalidate();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to remove trusted origin",
			);
		}
	};

	const handleSaveEdit = async () => {
		if (editingOrigin == null || !editingValue.trim()) {
			setEditingOrigin(null);
			return;
		}
		try {
			await updateTrustedOrigin({
				oldOrigin: editingOrigin,
				newOrigin: editingValue.trim(),
			});
			toast.success("Trusted origin updated");
			setEditingOrigin(null);
			setEditingValue("");
			await utils.sso.getTrustedOrigins.invalidate();
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : "Failed to update trusted origin",
			);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>{children}</DialogTrigger>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Shield className="size-5" />
						Trusted origins
					</DialogTitle>
					<DialogDescription>
						Manage allowed origins for SSO callbacks. Add, edit, or remove
						origins for your account.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<span className="text-sm font-medium">Current origins</span>
						{trustedOrigins.length === 0 ? (
							<p className="rounded-md border border-dashed bg-muted/30 px-3 py-4 text-center text-sm text-muted-foreground">
								No trusted origins yet. Add one below.
							</p>
						) : (
							<ul className="flex flex-col gap-2">
								{trustedOrigins.map((origin) => (
									<li
										key={origin}
										className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2"
									>
										{editingOrigin === origin ? (
											<>
												<Input
													value={editingValue}
													onChange={(e) => setEditingValue(e.target.value)}
													placeholder="https://..."
													className="flex-1 font-mono text-sm"
													autoFocus
												/>
												<Button
													size="sm"
													onClick={handleSaveEdit}
													disabled={!editingValue.trim() || isUpdatingOrigin}
												>
													Save
												</Button>
												<Button
													size="sm"
													variant="ghost"
													onClick={() => {
														setEditingOrigin(null);
														setEditingValue("");
													}}
												>
													Cancel
												</Button>
											</>
										) : (
											<>
												<span className="flex-1 break-all font-mono text-sm">
													{origin}
												</span>
												<Button
													variant="ghost"
													size="icon"
													className="size-8 shrink-0"
													onClick={() => {
														setEditingOrigin(origin);
														setEditingValue(origin);
													}}
												>
													<Pencil className="size-3.5" />
												</Button>
												<DialogAction
													title="Remove trusted origin"
													description={`Remove "${origin}" from trusted origins?`}
													type="destructive"
													onClick={async () => handleRemoveOrigin(origin)}
												>
													<Button
														variant="ghost"
														size="icon"
														className="size-8 shrink-0 text-destructive hover:text-destructive"
														disabled={isRemovingOrigin}
													>
														<Trash2 className="size-3.5" />
													</Button>
												</DialogAction>
											</>
										)}
									</li>
								))}
							</ul>
						)}
					</div>
					<div className="space-y-2">
						<span className="text-sm font-medium">Add trusted origin</span>
						<div className="flex gap-2">
							<Input
								value={newOriginInput}
								onChange={(e) => setNewOriginInput(e.target.value)}
								placeholder="https://example.com"
								className="font-mono text-sm"
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										void handleAddOrigin();
									}
								}}
							/>
							<Button
								size="sm"
								onClick={handleAddOrigin}
								disabled={!newOriginInput.trim() || isAddingOrigin}
							>
								<Plus className="mr-1 size-4" />
								Add
							</Button>
						</div>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						Close
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
