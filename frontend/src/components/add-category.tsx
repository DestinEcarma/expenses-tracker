import { Icon } from "./icon";
import { IconSelector } from "./icon-selector";
import { DialogUI, DrawerUI } from "./responsive-overlay";
import { Button } from "./ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form";
import { Input } from "./ui/input";
import { Spinner } from "./ui/spinner";
import { cn } from "@/lib/utils";
import type { ApiError } from "@/services";
import { addCategory, type Category } from "@/services/expenses";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useState } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { FaPlus } from "react-icons/fa";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({
	name: z.string().trim().nonempty("Please enter a category name").max(16, "Name must be at most 16 characters"),
	icon: z.string().trim().nonempty("Please select an icon"),
});

type FormValues = z.infer<typeof FormSchema>;

function AddCategory({ onAdd }: { onAdd?: (category: Category) => void }) {
	const [open, setOpen] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const form = useForm<FormValues>({
		resolver: zodResolver(FormSchema),
		defaultValues: { name: "", icon: "FaHamburger" },
		reValidateMode: "onSubmit",
	});

	const { mutate, isPending } = useMutation<Category, ApiError<{ name: string }>, FormValues>({
		mutationFn: (data: FormValues) => addCategory(data.name, data.icon),
		onSuccess: (data) => {
			onAdd?.(data);
			setOpen(false);
			toast.success("Category added successfully!");
			form.reset();
		},
		onError: ({ title, details, status, error }) => {
			if (error?.name) {
				form.setError("name", { message: error.name });
			} else {
				toast.error(`${status} ${title}`, { description: details });
			}
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
						onSubmit={form.handleSubmit(mutate as SubmitHandler<FormValues>)}
						className={!isDesktop ? "mx-auto w-full max-w-sm" : ""}
					>
						<UI.Header>
							<UI.Title>Add Category</UI.Title>
							<UI.Description>Add a new category to track your expenses.</UI.Description>
						</UI.Header>
						<div className={cn(["py-8", !isDesktop && "px-4"])}>
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

export { AddCategory };
