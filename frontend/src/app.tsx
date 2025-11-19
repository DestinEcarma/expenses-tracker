import { TopBarItem, TopBarProvider } from "./contexts/use-top-bar";
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
const Transactions = withAuth(lazy(() => import("@/pages/transactions")));
const WorkInProgress = lazy(() => import("@/pages/wip"));

const ProtectedPage = withAuth(WorkInProgress);

const queryClient = new QueryClient();

function App() {
	return (
		<BrowserRouter>
			<TopBarProvider>
				<ThemeProvider>
					<Suspense fallback={<Loading />}>
						<QueryClientProvider client={queryClient}>
							<AuthProvider>
								<TopBarItem side="right" id="theme-menu">
									<ThemeMenu />
								</TopBarItem>
								<Routes>
									<Route path="/" element={<Expenses />} />
									<Route path="/sign-in" element={<SignIn />} />
									<Route path="/sign-up" element={<SignUp />} />
									<Route path="/forgot-password" element={<WorkInProgress />} />
									<Route path="/profile" element={<ProtectedPage />} />
									<Route path="/expenses" element={<Expenses />} />
									<Route path="/expenses/:id" element={<Transactions />} />
									<Route path="*" element={<WorkInProgress />} />
								</Routes>
							</AuthProvider>
						</QueryClientProvider>
					</Suspense>
				</ThemeProvider>
			</TopBarProvider>
		</BrowserRouter>
	);
}

export default App;
