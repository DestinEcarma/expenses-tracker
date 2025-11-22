import { Button } from "./ui/button";
import { ChartContainer } from "./ui/chart";
import { formatMonth, formatNumber } from "@/lib/utils";
import { subMonths } from "date-fns";
import { useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useSearchParams } from "react-router-dom";
import { Area, AreaChart } from "recharts";

interface TotalGraphProps {
	month: Date;
	total?: number;
	data: { date: string; amount?: number }[];
}

function TotalGraph({ month, total, data }: TotalGraphProps) {
	const [searchParams, setSearchParams] = useSearchParams();

	total = useMemo(() => (total ? total : data.reduce((acc, curr) => acc + (curr.amount ?? 0), 0)), [total, data]);

	const prevMonth = subMonths(month, 1);
	const nextMonth = subMonths(month, -1);

	function goToPrevMonth() {
		const newParams = new URLSearchParams(searchParams);
		newParams.set("month", prevMonth.getTime().toString());
		setSearchParams(newParams);
	}

	function goToNextMonth() {
		const newParams = new URLSearchParams(searchParams);
		newParams.set("month", nextMonth.getTime().toString());
		setSearchParams(newParams);
	}

	return (
		<div className="relative">
			<div className="relative mb-10 flex w-full items-center justify-center gap-4">
				<Button variant="outline" size="icon" onClick={goToPrevMonth}>
					<FaChevronLeft />
				</Button>
				<div className="w-min">
					<span className="text-muted-foreground self-start font-bold">{formatMonth(month)}</span>
					<h2 className="dark:text-shadow-foreground/10 text-4xl leading-none text-shadow-lg">
						₱{formatNumber(total)}
					</h2>
				</div>
				<Button variant="outline" size="icon" disabled={nextMonth > new Date()} onClick={goToNextMonth}>
					<FaChevronRight />
				</Button>
			</div>
			<ChartContainer config={{}} className="absolute top-0 -z-10 h-full w-full">
				<AreaChart accessibilityLayer data={data}>
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
	);
}

export { TotalGraph };
