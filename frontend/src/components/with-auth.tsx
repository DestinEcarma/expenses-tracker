import { ErrorComponent } from "./error-component";
import { Loading } from "./loading";
import { useAuth } from "@/contexts/auth-provider";
import type { ApiError } from "@/services";
import { me } from "@/services/auth";
import { useQuery } from "@tanstack/react-query";
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

		return <Wrapped {...props} />;
	};
}

export { withAuth };
