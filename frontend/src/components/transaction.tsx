import { EditTransaction } from "./edit-transaction";
import { Card, CardContent } from "./ui/card";
import { cn, formatNumber } from "@/lib/utils";
import type { Transaction as ITransaction } from "@/services/expenses";
import { useState } from "react";

interface TransactionProps extends Omit<ITransaction, "id"> {
	categoryId: string;
	transactionId: string;
	onSave?: (editedTransaction: ITransaction) => void;
	onDelete?: () => void;
}

function Transaction({ amount, note, date, ...props }: TransactionProps) {
	const [openEdit, setOpenEdit] = useState(false);

	return (
		<>
			<button onClick={() => setOpenEdit(true)} className="hover:cursor-pointer">
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
						<div className="flex flex-col truncate text-left">
							<span className="font-bold">₱{formatNumber(amount)}</span>
							<p className="truncate">{note || "..."}</p>
						</div>
					</CardContent>
				</Card>
			</button>
			<EditTransaction amount={amount} note={note} date={date} open={openEdit} setOpen={setOpenEdit} {...props} />
		</>
	);
}

export { Transaction };
