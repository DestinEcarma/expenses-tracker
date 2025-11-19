import { AddCategory } from "@/components/add-category";
import { Category } from "@/components/category";
import { ChartContainer } from "@/components/ui/chart";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatMonth, formatNumber } from "@/lib/utils";
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
import { Area, AreaChart } from "recharts";
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

	const lastDateOnData = data.length > 0 ? new Date(data[data.length - 1]?.date ?? 0) : new Date();

	const byDate = new Map(data.map((item) => [item.date, item]));

	return Array.from({ length: days }, (_, i) => {
		const date = addDays(start, i);
		const key = formatISO(date, { representation: "date" });

		if (byDate.has(key)) {
			return byDate.get(key) as Expense;
		}

		if (date < lastDateOnData) {
			return { date: key, amount: 0 };
		}

		return { date: key } as Expense;
	});
}

export default () => {
	const navigate = useNavigate();
	const [searchParams] = useSearchParams();

	const [month, start, end] = (() => {
		const monthParams = searchParams.get("month");
		const month = monthParams ? new Date(monthParams) : new Date();

		return [month, startOfMonth(month), endOfMonth(month)];
	})();

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
			<div className="relative">
				<div className="relative mx-auto mb-10 w-min">
					<span className="text-muted-foreground self-start font-bold">{formatMonth(month)}</span>
					<h2 className="dark:text-shadow-foreground/10 text-4xl leading-none text-shadow-lg">
						₱{formatNumber(total)}
					</h2>
				</div>
				<ChartContainer config={{}} className="absolute top-0 -z-10 h-full w-full">
					<AreaChart accessibilityLayer data={expenses}>
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
