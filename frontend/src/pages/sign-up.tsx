import { Password } from "@/components/password";
import { AnimatedLink } from "@/components/ui/animated-link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/contexts/auth-provider";
import type { ApiError } from "@/services";
import { signUp, type AuthResponse } from "@/services/auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Mail, UserRound } from "lucide-react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { BsPersonFillDown } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";

const FormSchema = z.object({
	email: z.email("Please enter a valid email address"),
	username: z
		.string()
		.min(3, "Username must be at least 3 characters")
		.regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
	password: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof FormSchema>;

export default () => {
	const navigate = useNavigate();
	const { setAuth } = useAuth();

	const form = useForm<FormValues>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			email: "",
			username: "",
			password: "",
		},
	});

	const { mutate, isPending, isSuccess } = useMutation<
		AuthResponse,
		ApiError<{ email: string; username: string }>,
		FormValues
	>({
		mutationFn: (data: FormValues) => signUp(data.email, data.username, data.password),
		onSuccess: (data) => {
			toast.success("Signed up successfully!");

			setAuth(data);
			setTimeout(() => navigate("/", { replace: true }), 1000);
		},
		onError: ({ title, details, status, error }) => {
			if (error) {
				if (error.email) {
					form.setError("email", { message: error.email });
				}

				if (error.username) {
					form.setError("username", { message: error.username });
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
					<h2 className="text-center text-2xl font-bold">Sign Up</h2>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form onSubmit={form.handleSubmit(mutate as SubmitHandler<FormValues>)} className="space-y-8">
							<FormField
								control={form.control}
								name="email"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Email</FormLabel>
										<InputGroup className="not-dark:border-border overflow-hidden">
											<InputGroupAddon>
												<Mail />
											</InputGroupAddon>
											<FormControl>
												<InputGroupInput autoCorrect="off" autoCapitalize="off" autoComplete="email" {...field} />
											</FormControl>
										</InputGroup>
										<FormMessage />
									</FormItem>
								)}
							/>
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
										<Password autoComplete="new-password" className="not-dark:border-border" {...field} />
										<FormMessage />
									</FormItem>
								)}
							/>
							<Button type="submit" className="w-full" disabled={isPending || isSuccess}>
								{isPending && <Spinner />} {isSuccess ? "Sign Up Successful!" : "Sign Up"}
							</Button>
						</form>
					</Form>
				</CardContent>
				<CardFooter className="flex justify-center space-x-2 text-sm">
					<p>Already have an account?</p>
					<AnimatedLink to="/sign-in" size="sm">
						Sign in
					</AnimatedLink>
				</CardFooter>
			</Card>
		</div>
	);
};
