import { isBrowser } from "./defs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const monthFormatter = new Intl.DateTimeFormat("en-US", { month: "long" });

const numberFormatter = new Intl.NumberFormat("en-US", {
	minimumFractionDigits: 2,
	maximumFractionDigits: 2,
	useGrouping: true,
});

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

function parseSizeToPx(size: string) {
	if (!isBrowser) {
		return 0;
	}

	if (size.endsWith("rem")) {
		return parseFloat(size) * parseFloat(getComputedStyle(document.documentElement).fontSize);
	}

	if (size.endsWith("em")) {
		return parseFloat(size) * parseFloat(getComputedStyle(document.body).fontSize);
	}

	if (size.endsWith("vw")) {
		return (parseFloat(size) / 100) * window.innerWidth;
	}

	if (size.endsWith("vh")) {
		return (parseFloat(size) / 100) * window.innerHeight;
	}

	return parseFloat(size);
}

function formatMonth(date: Date) {
	return monthFormatter.format(date);
}

function formatNumber(number: number) {
	return numberFormatter.format(number);
}

export { cn, parseSizeToPx, formatMonth, formatNumber };
