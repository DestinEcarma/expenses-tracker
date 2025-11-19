import { Password } from "@/components/password";
import { AnimatedLink } from "@/components/ui/animated-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/auth-provider";
import type { ApiError } from "@/services";
import { type AuthResponse, signIn } from "@/services/auth";
import { StorageType } from "@/services/auth-service";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { UserRound } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { BsPersonFillDown } from "react-icons/bs";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({
	username: z.string().trim().nonempty("Username is required"),
	password: z.string().trim().nonempty("Password is required"),
	remember: z.boolean().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export default () => {
	const navigate = useNavigate();
	const location = useLocation();
	const { setAuth, setStoreAt } = useAuth();

	const form = useForm<FormValues>({
		resolver: zodResolver(FormSchema),
		defaultValues: { username: "", password: "", remember: false },
	});

	const { mutate, isPending, isSuccess } = useMutation<
		AuthResponse,
		ApiError<{ username?: string; password?: string }>,
		FormValues
	>({
		mutationFn: (data: FormValues) => signIn(data.username, data.password),
		onSuccess: (data) => {
			const remember = form.getValues("remember");
			const to = (location.state as { from: string } | undefined)?.from ?? "/";

			setAuth(data);
			setStoreAt(remember ? StorageType.Local : StorageType.Session);
			setTimeout(() => navigate(to, { replace: true }), 1000);

			toast.success("Signed in successfully!");
		},
		onError: ({ title, status, details, error }) => {
			if (error) {
				if (error.username) {
					form.setError("username", { message: error.username as string });
				}

				if (error.password) {
					form.setError("password", { message: error.password as string });
				}
			} else {
				toast.error(`${status} ${title}`, { description: details });
			}
		},
	});

	return (
		<div className="flex h-dvh items-center justify-center px-4">
			<Card className="w-full max-w-sm">
				<CardHeader>
					<h1 className="text-primary flex justify-center text-8xl drop-shadow-md">
						<BsPersonFillDown />
					</h1>
					<h2 className="text-center text-2xl font-bold">Sign In</h2>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(mutate as SubmitHandler<FormValues>)} className="space-y-8">
							<FormField
								control={form.control}
								name="username"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Username</FormLabel>
										<InputGroup className="not-dark:border-border overflow-hidden">
											<InputGroupAddon>
												<UserRound />
											</InputGroupAddon>
											<FormControl>
												<InputGroupInput autoCorrect="off" autoCapitalize="off" autoComplete="username" {...field} />
											</FormControl>
										</InputGroup>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="password"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Password</FormLabel>
										<Password autoComplete="current-password" className="not-dark:border-border" {...field} />
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex flex-row justify-between">
								<FormField
									control={form.control}
									name="remember"
									render={({ field: { value, ...field } }) => (
										<FormItem className="flex flex-row items-center gap-2">
											<FormControl>
												<Checkbox
													checked={value}
													onCheckedChange={(v) => field.onChange(Boolean(v))}
													className="not-dark:border-border"
													{...field}
												/>
											</FormControl>
											<FormLabel>Remember me</FormLabel>
										</FormItem>
									)}
								/>
								<AnimatedLink to="/forgot-password" size="sm">
									Forgot password
								</AnimatedLink>
							</div>
							<Button type="submit" className="w-full" disabled={isPending || isSuccess}>
								{isPending && <Spinner />} {isSuccess ? "Sign In Successful!" : "Sign In"}
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="flex justify-center space-x-2 text-sm">
					<p>Don't have an account?</p>
					<AnimatedLink to="/sign-up" size="sm">
						Sign up
					</AnimatedLink>
				</CardFooter>
			</Card>
		</div>
	);
};
