import { Button } from "./ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "./ui/card";
import { useNavigate } from "react-router-dom";

function ErrorComponent() {
	const navigate = useNavigate();

	return (
		<div className="flex h-dvh items-center justify-center">
			<Card className="w-full max-w-md">
				<CardHeader>
					<h1 className="text-destructive mb-4 text-center text-4xl font-bold">Oops!</h1>
				</CardHeader>
				<CardContent>
					<p className="mb-6 text-lg">Something went wrong. Please try again later.</p>
				</CardContent>
				<CardFooter>
					<Button variant="destructive" className="w-full" onClick={() => navigate("/")}>
						Retry
					</Button>
				</CardFooter>
			</Card>
		</div>
	);
}

export { ErrorComponent };
