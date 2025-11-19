import { AddTransaction } from "@/components/add-transaction";
import { Transaction } from "@/components/transaction";
import { ChartContainer } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatMonth } from "@/lib/utils";
import type { ApiError } from "@/services";
import { getTransactions, type Transaction as ITransaction } from "@/services/expenses";
import { useQuery } from "@tanstack/react-query";
import { useList } from "@uidotdev/usehooks";
import { addDays, endOfMonth, formatISO, startOfMonth } from "date-fns";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Area, AreaChart } from "recharts";
import { toast } from "sonner";

function fillMonth(data: ITransaction[], month: Date): { date: string; amount?: number }[] {
	const start = startOfMonth(month);
	const days = endOfMonth(month).getDate();

	const lastDateOnData =
		data.length > 0
			? data.reduce((latest, transaction) => {
					const transactionDate = new Date(transaction.date);
					return transactionDate > latest ? transactionDate : latest;
				}, new Date(0))
			: new Date();

	const byDate = new Map();

	data.forEach((transaction) => {
		const key = formatISO(new Date(transaction.date), { representation: "date" });

		if (byDate.has(key)) {
			byDate.get(key)!.amount += transaction.amount;
		} else {
			byDate.set(key, { date: key, amount: transaction.amount });
		}
	});

	return Array.from({ length: days }, (_, i) => {
		const date = addDays(start, i);
		const key = formatISO(date, { representation: "date" });

		if (byDate.has(key)) {
			return byDate.get(key)!;
		}

		if (date < lastDateOnData) {
			return { date: key, amount: 0 };
		}

		return { date: key };
	});
}

export default () => {
	const { id } = useParams();
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [month, start, end] = (() => {
		const monthParams = searchParams.get("month");
		const month = monthParams ? new Date(monthParams) : new Date();

		return [month, startOfMonth(month), endOfMonth(month)];
	})();

	const { data, error } = useQuery<ITransaction[], ApiError>({
		queryKey: ["transactions", { start: +start, end: +end }],
		queryFn: () => getTransactions(id!, start, end),
		enabled: !!id,
		retry: false,
	});

	useEffect(() => {
		if (error) {
			toast.error(`${error.status} ${error.title}`, {
				description: error.details,
			});

			if (error.status === 401) {
				setTimeout(() => navigate("/sign-in", { replace: true }), 50);
			}
		}
	}, [error, navigate]);

	const transactions = useList<ITransaction>();
	const sortedTransactions = useMemo(
		() => transactions[0].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
		[transactions],
	);
	const setTransactions = transactions[1].set;

	useEffect(() => {
		setTransactions((data ?? []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
	}, [data, setTransactions]);

	const transactionsGrouped = useMemo(() => fillMonth(transactions[0], month), [transactions, month]);
	const total = useMemo(() => transactions[0].reduce((acc, category) => acc + category.amount, 0) || 0, [transactions]);

	return (
		<div className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden pt-4">
			<h1 className="mb-4 text-center font-bold">Transactions</h1>
			<div className="relative">
				<div className="relative mx-auto mb-10 w-min">
					<span className="text-muted-foreground self-start font-bold">{formatMonth(month)}</span>
					<h2 className="dark:text-shadow-foreground/10 text-4xl leading-none text-shadow-lg">₱{total.toFixed(2)}</h2>
				</div>
				<ChartContainer config={{}} className="absolute top-0 -z-10 h-full w-full">
					<AreaChart accessibilityLayer data={transactionsGrouped}>
						<defs>
							<linearGradient id="amount" x1="0" y1="0" x2="0" y2="1">
								<stop offset="0%" stopColor="var(--accent-foreground)" stopOpacity={0.25} />
								<stop offset="50%" stopColor="var(--accent-foreground)" stopOpacity={0} />
							</linearGradient>
						</defs>
						<Area
							dataKey="amount"
							fill="url(#amount)"
							type="basis"
							strokeWidth={2}
							className="stroke-accent-foreground"
						/>
					</AreaChart>
				</ChartContainer>
			</div>

			<div className="min-h-0">
				<ScrollArea className="h-full">
					<div className="flex w-full flex-col gap-4 p-4">
						{sortedTransactions.map((props) => (
							<Transaction key={props.id} {...props} />
						))}
					</div>
				</ScrollArea>
			</div>
			{id && <AddTransaction id={id} onAdd={(transaction) => transactions[1].push(transaction)} />}
		</div>
	);
};
