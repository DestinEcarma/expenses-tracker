import { Icon } from "./icon";
import { IconSelector } from "./icon-selector";
import { DialogUI, DrawerUI } from "./responsive-overlay";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Spinner } from "./ui/spinner";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/services";
import { deleteCategory, editCategory, type Category, type EditedCategory } from "@/services/expenses";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface CategoryProps extends Omit<Category, "amount" | "transactions"> {
	open?: boolean;
	setOpen?: (open: boolean) => void;
	onSave?: (editedCategory: EditedCategory) => void;
	onDelete?: () => void;
}

const FormSchema = z.object({
	name: z
		.string()
		.trim()
		.nonempty({ message: "Please enter a category name" })
		.max(16, { message: "Name must be at most 16 characters" }),
	icon: z.string().trim().min(1, { message: "Please select an icon" }),
});

type FormValues = z.infer<typeof FormSchema>;

function DeleteCategoryDialog({
	deleteButton: deleteChildren,
	onDelete,
}: {
	deleteButton?: React.ReactNode;
	onDelete?: () => void;
}) {
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>{deleteChildren ?? <Button variant="destructive">Delete</Button>}</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
					<AlertDialogDescription>
						This action cannot be undone. This will permanently delete your category and remove it from our server.
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>Cancel</AlertDialogCancel>
					<AlertDialogAction onClick={onDelete}>Continue</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}

function EditCategory({ id, name, icon, open, setOpen, onSave, onDelete }: CategoryProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const form = useForm<FormValues>({
		resolver: zodResolver(FormSchema),
		defaultValues: { name, icon },
		reValidateMode: "onSubmit",
	});

	const { mutate: performEdit, isPending: isEditing } = useMutation<
		EditedCategory,
		ApiError<{ name: string }>,
		FormValues
	>({
		mutationFn: (data: FormValues) => editCategory(id, data.name, data.icon),
		onSuccess: (data) => {
			onSave?.(data);
			setOpen?.(false);
			toast.success("Category edited successfully!");
		},
		onError: ({ title, details, status, error }) => {
			if (error?.name) {
				form.setError("name", { message: error.name });
			} else {
				toast.error(`${status} ${title}`, { description: details });
			}
		},
	});

	const { mutate: performDelete, isPending: isDeleting } = useMutation<void, ApiError, string>({
		mutationFn: (categoryId: string) => deleteCategory(categoryId),
		onSuccess: () => {
			onDelete?.();
			setOpen?.(false);
			toast.success("Category deleted successfully!");
		},
		onError: ({ title, details, status }) => {
			toast.error(`${status} ${title}`, { description: details });
		},
	});

	const UI = isDesktop ? DialogUI : DrawerUI;

	const editButton = (
		<Button type="submit" disabled={isEditing || isDeleting}>
			{isEditing && <Spinner />} Submit
		</Button>
	);

	const deleteButton = (
		<DeleteCategoryDialog
			deleteButton={
				<Button type="button" variant="destructive" disabled={isDeleting || isEditing}>
					{isDeleting && <Spinner />} Delete
				</Button>
			}
			onDelete={() => performDelete(id)}
		/>
	);

	return (
		<UI.Container open={open} onOpenChange={setOpen}>
			<UI.Content onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(performEdit as SubmitHandler<FormValues>)}
						className={!isDesktop ? "mx-auto w-full max-w-sm" : ""}
					>
						<UI.Header>
							<UI.Title>Edit Category</UI.Title>
							<UI.Description>Make changes to your category and submit when you're done.</UI.Description>
						</UI.Header>
						<div className={cn(["py-8", !isDesktop ? "px-4" : ""])}>
							<FormField
								control={form.control}
								name="name"
								render={({ field }) => (
									<FormItem className="w-full">
										<div className="flex gap-4">
											<FormControl>
												<Input placeholder="Category Name" {...field} />
											</FormControl>
											<FormField
												control={form.control}
												name="icon"
												render={({ field: { value, onChange } }) => {
													return (
														<FormItem>
															<FormControl>
																<IconSelector
																	value={value}
																	onChange={onChange}
																	defaultIcon={() => <Icon name={value} />}
																/>
															</FormControl>
														</FormItem>
													);
												}}
											/>
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>
						<UI.Footer>
							{!isDesktop && editButton}
							{isDesktop && deleteButton}
							<UI.Close asChild>
								<Button variant="outline" onClick={() => form.reset()}>
									Cancel
								</Button>
							</UI.Close>
							{!isDesktop && deleteButton}
							{isDesktop && editButton}
						</UI.Footer>
					</form>
				</Form>
			</UI.Content>
		</UI.Container>
	);
}

export { EditCategory };
