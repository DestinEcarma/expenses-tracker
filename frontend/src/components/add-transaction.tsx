import { BioField } from "./BioField";
import { DateTimePicker } from "./date-time-picker";
import { DialogUI, DrawerUI } from "./responsive-overlay";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Spinner } from "./ui/spinner";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/services";
import { addTransaction, type Transaction } from "@/services/expenses";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { FaPlus } from "react-icons/fa";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({
	amount: z.coerce.number().positive("Please enter a valid amount").min(0.01, "Amount must be at least 0.01"),
	note: z.string().trim().max(150, "Note must be at most 150 characters").optional(),
	date: z.string().nonempty("Please select a date"),
});

type FormValues = z.infer<typeof FormSchema>;

function AddTransaction({ id, onAdd }: { id: string; onAdd?: (transaction: Transaction) => void }) {
	const [open, setOpen] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const form = useForm<FormValues>({
		resolver: zodResolver(
			FormSchema as unknown as z.ZodObject<{
				amount: z.ZodNumber;
				note: z.ZodOptional<z.ZodString>;
				date: z.ZodString;
			}>,
		),
		defaultValues: { amount: 0, note: "", date: new Date().toISOString() },
		reValidateMode: "onSubmit",
	});

	const { mutate, isPending } = useMutation<Transaction, ApiError, FormValues>({
		mutationFn: (data) => addTransaction(id, data.amount, new Date(data.date), data.note),
		onSuccess: (data) => {
			onAdd?.(data);
			setOpen(false);
			toast.success("Transaction added successfully!");
			form.reset();
		},
		onError: ({ title, details, status }) => {
			toast.error(`${status} ${title}`, { description: details });
		},
	});

	const UI = isDesktop ? DialogUI : DrawerUI;

	const addButton = (
		<Button type="submit" disabled={isPending}>
			{isPending && <Spinner />} Submit
		</Button>
	);

	return (
		<UI.Container open={open} onOpenChange={setOpen}>
			<UI.Trigger asChild>
				<Button size="icon-lg" className="absolute right-1/2 bottom-4 translate-x-1/2">
					<FaPlus className="size-8" />
				</Button>
			</UI.Trigger>
			<UI.Content onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
				<Form {...form}>
					<form
						noValidate
						onSubmit={form.handleSubmit(mutate as SubmitHandler<FormValues>)}
						className={!isDesktop ? "mx-auto w-full max-w-sm" : ""}
					>
						<UI.Header>
							<UI.Title>Add Transaction</UI.Title>
							<UI.Description>Fill in the details to add a new transaction.</UI.Description>
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
							{!isDesktop && addButton}
							<UI.Close asChild>
								<Button variant="outline" onClick={() => form.reset()}>
									Cancel
								</Button>
							</UI.Close>
							{isDesktop && addButton}
						</UI.Footer>
					</form>
				</Form>
			</UI.Content>
		</UI.Container>
	);
}

export { AddTransaction };
