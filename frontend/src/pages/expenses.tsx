import { AddCategory } from "@/components/add-category";
import { Category } from "@/components/category";
import { TotalGraph } from "@/components/total-graph";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ApiError } from "@/services";
import {
	type Expense,
	getExpensesOverview,
	type ExpenseOverview,
	type Category as ICategory,
} from "@/services/expenses";
import "@/styles/category-colors.css";
import { useQuery } from "@tanstack/react-query";
import { useList } from "@uidotdev/usehooks";
import { addDays, endOfMonth, formatISO, startOfMonth } from "date-fns";
import { useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const defaultColors = [
	"red",
	"orange",
	"amber",
	"yellow",
	"lime",
	"green",
	"emerald",
	"teal",
	"cyan",
	"sky",
	"blue",
	"indigo",
	"violet",
	"purple",
	"fuchsia",
	"pink",
	"rose",
	"slate",
	"gray",
];

function fillMonth(data: Expense[], month: Date): Expense[] {
	const start = startOfMonth(month);
	const days = endOfMonth(month).getDate();

	const now = new Date();
	const byDate = new Map(data.map((item) => [item.date, item]));

	return Array.from({ length: days }, (_, i) => {
		const date = addDays(start, i);
		const key = formatISO(date, { representation: "date" });

		if (byDate.has(key)) {
			return byDate.get(key) as Expense;
		}

		if (date < now) {
			return { date: key, amount: 0 };
		}

		return { date: key } as Expense;
	});
}

export default () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [month, start, end] = useMemo(() => {
		const monthParams = searchParams.get("month");
		const time = parseInt(monthParams ?? "");
		const month = time ? new Date(time) : new Date();

		return [month, startOfMonth(month), endOfMonth(month)];
	}, [searchParams]);

	const { data, refetch, error } = useQuery<ExpenseOverview, ApiError>({
		queryKey: ["expense overview", { start: +start, end: +end }],
		queryFn: () => getExpensesOverview(start, end),
		retry: false,
	});

	const expenses = useMemo(() => fillMonth(data?.dailyExpense ?? [], month), [data?.dailyExpense, month]);
	const categories = useList<ICategory>();
	const setCategories = categories[1].set;

	const total = useMemo(() => categories[0].reduce((acc, category) => acc + category.amount, 0) || 0, [categories]);

	useEffect(() => {
		setCategories((data?.categories ?? []).sort((a, b) => b.amount - a.amount));
	}, [data?.categories, setCategories]);

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
		<div className="mx-auto flex h-dvh max-w-2xl flex-col overflow-hidden pt-4">
			<h1 className="mb-4 text-center font-bold">Expenses</h1>
			<TotalGraph month={month} total={total} data={expenses} />
			<div className="min-h-0">
				<ScrollArea className="h-full">
					<div className="flex flex-col gap-4 px-4 py-4">
						{categories[0].map((props, index) => {
							return (
								<Category
									key={props.id}
									color={defaultColors[index % defaultColors.length]}
									progress={(props.amount / (total || 1)) * 100}
									onSave={(updated) => categories[1].updateAt(index, { ...props, ...updated })}
									onDelete={() => {
										refetch();
										categories[1].removeAt(index);
									}}
									{...props}
								/>
							);
						})}
					</div>
				</ScrollArea>
			</div>
			<AddCategory
				onAdd={(category) => {
					categories[1].push(category);
				}}
			/>
		</div>
	);
};
