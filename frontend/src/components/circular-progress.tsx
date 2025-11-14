import { useTheme } from "@/contexts/theme-provider";
import { useIsomorphicLayoutEffect } from "@/hooks";
import { cn, parseSizeToPx } from "@/lib/utils";
import { useState } from "react";

interface CircularProgressProps extends React.ComponentProps<"div"> {
	progress: number;
	size?: string;
	strokeWidth?: number;
	color?: string;
}

export default function CircularProgress({
	size = "100",
	strokeWidth = 8,
	progress,
	color = "var(--text-red-400)",
	className,
	children,
	...props
}: CircularProgressProps) {
	const [sizePx, setSizePx] = useState(() => parseSizeToPx(size));
	const { activeTheme } = useTheme();

	useIsomorphicLayoutEffect(() => {
		const handleResize = () => {
			setSizePx(parseSizeToPx(size));
		};

		window.addEventListener("resize", handleResize);
		return () => window.removeEventListener("resize", handleResize);
	}, [size]);

	const radius = (sizePx - strokeWidth) / 2 - 1;
	const halfSize = sizePx / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference - (progress / 100) * circumference;

	return (
		<div
			style={{
				width: sizePx,
				height: sizePx,
			}}
			className={cn("relative", className)}
			{...props}
		>
			<svg width={sizePx} height={sizePx} className="-rotate-90">
				<circle
					r={radius}
					cx={halfSize}
					cy={halfSize}
					strokeWidth={strokeWidth}
					stroke={`color-mix(in oklab, ${color} ${activeTheme === "dark" ? 30 : 10}%, transparent)`}
					className="fill-transparent"
				/>
				<circle
					stroke={color}
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					r={radius}
					cx={halfSize}
					cy={halfSize}
					className="stroke-round fill-transparent transition-all duration-[350ms] ease-in-out"
				/>
			</svg>
			<div className="absolute top-1/2 left-1/2 -translate-1/2">{children}</div>
		</div>
	);
}
