import CircularProgress from "./circular-progress";
import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";

interface CategoryProps {
	name: string;
	amount: number;
	transactions: number;
	progress: number;
	color?: string;
	icon?: React.ReactNode;
}

function Category({ name, amount, transactions, progress, color, icon }: CategoryProps) {
	const resolvedColor = `var(--category-${color ?? "red"})`;
	const pct = Math.max(0, Math.min(100, progress));

	return (
		<button
			onClick={() => console.log(`Clicked on ${name}`)}
			className="group w-full transition-transform outline-none hover:scale-[1.02]"
		>
			<Card
				className={cn([
					"cursor-pointer py-4 transition-all",
					"group-focus-visible:border-ring group-focus-visible:ring-ring/50 group-focus-visible:ring-[3px]",
				])}
			>
				<CardContent className="flex gap-4 px-4">
					<CircularProgress
						progress={pct}
						size="4.5rem"
						color={resolvedColor}
						className="text-muted-foreground/70 text-3xl"
					>
						{icon}
					</CircularProgress>
					<div className="flex w-full flex-col justify-center">
						<div className="flex justify-between font-bold">
							<span>{name}</span>
							<span>₱{amount}</span>
						</div>
						<div className="text-muted-foreground flex justify-between text-sm">
							<span>{transactions} transactions</span>
							<span>{Math.trunc(pct)}%</span>
						</div>
					</div>
				</CardContent>
			</Card>
		</button>
	);
}

export { Category };
