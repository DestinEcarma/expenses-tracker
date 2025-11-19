import { Card, CardContent } from "./ui/card";
import { cn } from "@/lib/utils";
import type { Transaction as ITransaction } from "@/services/expenses";

function Transaction({ amount, note, date }: ITransaction) {
	return (
		<Card
			className={cn([
				"py-4 transition-all",
				"group-focus-visible:border-ring group-focus-visible:ring-ring/50 group-focus-visible:ring-[3px]",
			])}
		>
			<CardContent className="flex items-center gap-4 px-4">
				<div className="border-primary flex aspect-square h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full border-[8px] text-2xl font-bold">
					{date.toLocaleString("en-US", { day: "2-digit" })}
				</div>
				<div className="flex flex-col truncate">
					<span className="font-bold">₱{amount.toFixed(2)}</span>
					<p className="truncate text-left">{note || "..."}</p>
				</div>
			</CardContent>
		</Card>
	);
}

export { Transaction };
