import { Loading } from "@/components/loading";
import { ThemeMenu } from "@/components/theme-toggle";
import { withAuth } from "@/components/with-auth";
import { AuthProvider } from "@/contexts/auth-provider";
import { ThemeProvider } from "@/contexts/theme-provider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const SignIn = lazy(() => import("@/pages/sign-in"));
const SignUp = lazy(() => import("@/pages/sign-up"));
const Expenses = withAuth(lazy(() => import("@/pages/expenses")));
const WorkInProgress = lazy(() => import("@/pages/wip"));

const ProtectedPage = withAuth(WorkInProgress);

const queryClient = new QueryClient();

function App() {
	return (
		<BrowserRouter>
			<ThemeProvider>
				<div className="absolute top-4 right-4">
					<ThemeMenu />
				</div>
				<Suspense fallback={<Loading />}>
					<QueryClientProvider client={queryClient}>
						<AuthProvider>
							<Routes>
								<Route path="/" element={<Expenses />} />
								<Route path="/sign-in" element={<SignIn />} />
								<Route path="/sign-up" element={<SignUp />} />
								<Route path="/forgot-password" element={<WorkInProgress />} />
								<Route path="/profile" element={<ProtectedPage />} />
								<Route path="/expenses" element={<Expenses />} />
								<Route path="/loading" element={<Loading />} />
								<Route path="*" element={<WorkInProgress />} />
							</Routes>
						</AuthProvider>
					</QueryClientProvider>
				</Suspense>
			</ThemeProvider>
		</BrowserRouter>
	);
}

export default App;
