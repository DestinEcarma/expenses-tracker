import { ErrorComponent } from "./error-component";
import { Loading } from "./loading";
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
import { useAuth } from "@/contexts/auth-provider";
import { TopBarItem } from "@/contexts/use-top-bar";
import type { ApiError } from "@/services";
import { me, signOut } from "@/services/auth";
import { useQuery } from "@tanstack/react-query";
import { TbLogout } from "react-icons/tb";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

function withAuth<P extends object>(Wrapped: React.ComponentType<P>) {
	return (props: P) => {
		const navigate = useNavigate();
		const location = useLocation();
		const { auth } = useAuth();

		if (!auth) {
			setTimeout(() => {
				toast.warning("401 Unauthenticated", { description: "You are not signed in. Please sign in to continue." });
				navigate("/sign-in", { replace: true, state: { from: location.pathname + location.search } });
			}, 50);

			return <Loading />;
		}

		const { isLoading, error } = useQuery<unknown, ApiError<string>>({
			queryKey: ["me", auth?.accessToken],
			queryFn: () => me(),
			retry: false,
		});

		if (isLoading) {
			return <Loading />;
		}

		if (error) {
			if (error.status === 401) {
				toast.error("401 Session Expired", { description: "Please sign in again." });
				return <Navigate to="/sign-in" replace state={{ from: location.pathname + location.search }} />;
			} else {
				toast.error(`${error.status} ${error.title}`, { description: error.details });
				return <ErrorComponent />;
			}
		}

		return (
			<>
				<TopBarItem side="right" id="sign-out-button">
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Button variant="outline" size="icon">
								<TbLogout />
							</Button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
								<AlertDialogDescription>
									You will be logged out of your account and will need to sign in again to access your data.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>Cancel</AlertDialogCancel>
								<AlertDialogAction
									onClick={() => {
										navigate("/sign-in", { replace: true });
										setTimeout(() => signOut(), 50);
										toast.success("Signed out successfully");
									}}
								>
									Continue
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</TopBarItem>
				<Wrapped {...props} />
			</>
		);
	};
}

export { withAuth };
