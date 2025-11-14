import { isBrowser } from "./defs";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const formatter = new Intl.DateTimeFormat("en-US", { month: "long" });

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

function parseSizeToPx(size: string): number {
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

function formatMonth(date: Date): string {
	return formatter.format(date);
}

export { cn, parseSizeToPx, formatMonth };
