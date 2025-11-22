import { AddTransaction } from "@/components/add-transaction";
import { TotalGraph } from "@/components/total-graph";
import { Transaction } from "@/components/transaction";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TopBarItem } from "@/contexts/use-top-bar";
import type { ApiError } from "@/services";
import { getTransactions, type Transaction as ITransaction } from "@/services/expenses";
import { useQuery } from "@tanstack/react-query";
import { useList } from "@uidotdev/usehooks";
import { addDays, endOfMonth, formatISO, startOfMonth } from "date-fns";
import { useEffect, useMemo } from "react";
import { TiArrowBack } from "react-icons/ti";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
		const time = parseInt(monthParams ?? "");
		const month = time ? new Date(time) : new Date();

		return [month, startOfMonth(month), endOfMonth(month)];
	})();

	const { data, error } = useQuery<ITransaction[], ApiError>({
		queryKey: ["transactions", { start: +start, end: +end }],
		queryFn: () => getTransactions(id!, start, end),
		enabled: !!id,
		retry: false,
	});

	const transactions = useList<ITransaction>();
	const sortedTransactions = useMemo(
		() => transactions[0].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
		[transactions],
	);
	const setTransactions = transactions[1].set;

	const transactionsGrouped = useMemo(() => fillMonth(transactions[0], month), [transactions, month]);

	useEffect(() => {
		setTransactions((data ?? []).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
	}, [data, setTransactions]);

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

	return (
		<>
			<TopBarItem side="left" id="back-button">
				<Button
					variant="outline"
					size="icon"
					onClick={() =>
						navigate.length > 1
							? navigate(-1)
							: navigate({
									pathname: "/",
									search: searchParams.toString(),
								})
					}
				>
					<TiArrowBack />
				</Button>
			</TopBarItem>
			<div className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden pt-4">
				<h1 className="mb-4 text-center font-bold">Transactions</h1>
				<TotalGraph month={month} data={transactionsGrouped} />
				<div className="min-h-0">
					<ScrollArea className="h-full">
						<div className="flex w-full flex-col gap-4 p-4">
							{sortedTransactions.map(({ id: transactionId, ...props }, index) => (
								<Transaction
									key={transactionId}
									categoryId={id!}
									transactionId={transactionId}
									onSave={(updated) => transactions[1].updateAt(index, { ...props, ...updated })}
									onDelete={() => transactions[1].removeAt(index)}
									{...props}
								/>
							))}
						</div>
					</ScrollArea>
				</div>
				{id && <AddTransaction id={id} onAdd={(transaction) => transactions[1].push(transaction)} />}
			</div>
		</>
	);
};
