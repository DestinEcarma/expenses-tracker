import { BioField } from "./BioField";
import { DateTimePicker } from "./date-time-picker";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Spinner } from "./ui/spinner";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/services";
import { deleteTransaction, editTransaction } from "@/services/expenses";
import type { Transaction } from "@/services/expenses";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useForm, type SubmitHandler } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

interface EditTransactionProps extends Omit<Transaction, "id"> {
	categoryId: string;
	transactionId: string;
	open?: boolean;
	setOpen?: (open: boolean) => void;
	onSave?: (editedTransaction: Transaction) => void;
	onDelete?: () => void;
}

const FormSchema = z.object({
	amount: z.coerce.number().positive("Please enter a valid amount").min(0.01, "Amount must be at least 0.01"),
	note: z.string().trim().max(150, "Note must be at most 150 characters").optional(),
	date: z.string().nonempty("Please select a date"),
});

type FormValues = z.infer<typeof FormSchema>;

function DeleteTransactionDialog({
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
						This action cannot be undone. This will permanently delete your transaction and remove it from our server.
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

function EditTransaction({
	categoryId,
	transactionId,
	amount,
	note,
	date,
	open,
	setOpen,
	onSave,
	onDelete,
}: EditTransactionProps) {
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const form = useForm<FormValues>({
		resolver: zodResolver(
			FormSchema as unknown as z.ZodObject<{
				amount: z.ZodNumber;
				note: z.ZodOptional<z.ZodString>;
				date: z.ZodString;
			}>,
		),
		defaultValues: { amount, note, date: date.toISOString() },
		reValidateMode: "onSubmit",
	});

	const { mutate: performEdit, isPending: isEditing } = useMutation<Transaction, ApiError, FormValues>({
		mutationFn: (data) => editTransaction(categoryId, transactionId, data.amount, new Date(data.date), data.note),
		onSuccess: (data) => {
			onSave?.(data);
			setOpen?.(false);
			toast.success("Transaction edited successfully!");
		},
		onError: ({ title, details, status }) => {
			toast.error(`${status} ${title}`, { description: details });
		},
	});

	const { mutate: performDelete, isPending: isDeleting } = useMutation<
		void,
		ApiError,
		{ categoryId: string; transactionId: string }
	>({
		mutationFn: ({ categoryId, transactionId }) => deleteTransaction(categoryId, transactionId),
		onSuccess: () => {
			onDelete?.();
			setOpen?.(false);
			toast.success("Transaction deleted successfully!");
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
		<DeleteTransactionDialog
			deleteButton={
				<Button type="button" variant="destructive" disabled={isDeleting || isEditing}>
					{isDeleting && <Spinner />} Delete
				</Button>
			}
			onDelete={() => performDelete({ categoryId, transactionId })}
		/>
	);

	return (
		<UI.Container open={open} onOpenChange={setOpen}>
			<UI.Content>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(performEdit as SubmitHandler<FormValues>)}
						className={!isDesktop ? "mx-auto w-full max-w-sm" : ""}
					>
						<UI.Header>
							<UI.Title>Edit Transaction</UI.Title>
							<UI.Description>Make changes to your transaction details and save them when you're done.</UI.Description>
						</UI.Header>
						<div className={cn(["space-y-4 py-8", !isDesktop ? "px-4" : ""])}>
							<FormField
								control={form.control}
								name="amount"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Amount</FormLabel>
										<FormControl>
											<Input placeholder="0.00" type="number" step="0.01" {...field} />
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="date"
								render={({ field }) => {
									return (
										<FormItem className="w-full">
											<FormLabel>Date</FormLabel>
											<FormControl>
												<DateTimePicker calendarProps={{ disabled: (date) => date > new Date() }} {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									);
								}}
							/>
							<FormField
								control={form.control}
								name="note"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Note</FormLabel>
										<FormControl>
											<BioField max={150} placeholder="Optional note" className="h-24 resize-none" {...field} />
										</FormControl>
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

export { EditTransaction };
