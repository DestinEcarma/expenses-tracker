import { cn } from "@/lib/utils";
import * as React from "react";
import { useCallback, useImperativeHandle, useRef, useState } from "react";

interface Ripple {
	id: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

interface TransitionProps {
	duration?: number;
	easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
}

interface RippleButtonProps extends React.ComponentProps<"button"> {
	children: React.ReactNode;
	rippleClassName?: string;
	transition?: TransitionProps;
}

function RippleButton({
	ref,
	children,
	onMouseDown,
	onMouseUp,
	onMouseLeave,
	onTouchStart,
	onTouchEnd,
	onTouchMove,
	className,
	rippleClassName,
	transition = { duration: 500, easing: "ease-out" },
	...props
}: RippleButtonProps) {
	const [ripple, setRipples] = useState<Ripple>();
	const [active, setActive] = useState(false);
	const buttonRef = useRef<HTMLButtonElement>(null);

	useImperativeHandle(ref, () => buttonRef.current as HTMLButtonElement);

	const createRipple = useCallback(
		(event: React.MouseEvent | React.TouchEvent) => {
			const button = buttonRef.current;
			if (!button || active) return;
			setActive(true);

			const rect = button.getBoundingClientRect();

			const clientX = "clientX" in event ? event.clientX : event.touches[0].clientX;
			const clientY = "clientY" in event ? event.clientY : event.touches[0].clientY;
			const x = clientX - rect.left;
			const y = clientY - rect.top;
			const rightX = rect.width - x;
			const bottomY = rect.height - y;

			const r = Math.max(Math.hypot(x, y), Math.hypot(rightX, y), Math.hypot(x, bottomY), Math.hypot(rightX, bottomY));
			const size = r * 2;

			setRipples({
				id: Date.now(),
				x: x - r,
				y: y - r,
				width: size,
				height: size,
			});
		},
		[active],
	);

	const handleLongPress = useCallback(
		(event: React.MouseEvent | React.TouchEvent) => {
			createRipple(event);
			if (onMouseDown && event.type === "mousedown") onMouseDown(event as React.MouseEvent<HTMLButtonElement>);
			if (onTouchStart && event.type === "touchstart") onTouchStart(event as React.TouchEvent<HTMLButtonElement>);
		},
		[createRipple, onMouseDown, onTouchStart],
	);

	const handleRelease = useCallback(
		(event: React.MouseEvent | React.TouchEvent) => {
			setActive(false);
			setRipples(undefined);

			if (onMouseUp && event.type === "mouseup") onMouseUp(event as React.MouseEvent<HTMLButtonElement>);
			if (onMouseLeave && event.type === "mouseleave") onMouseLeave(event as React.MouseEvent<HTMLButtonElement>);
			if (onTouchEnd && event.type === "touchend") onTouchEnd(event as React.TouchEvent<HTMLButtonElement>);
			if (onTouchMove && event.type === "touchmove") onTouchMove(event as React.TouchEvent<HTMLButtonElement>);
		},
		[onMouseUp, onMouseLeave, onTouchEnd, onTouchMove],
	);

	return (
		<button
			ref={buttonRef}
			data-slot="ripple-button"
			onMouseDown={handleLongPress}
			onMouseUp={handleRelease}
			onMouseLeave={handleRelease}
			onTouchStart={handleLongPress}
			onTouchEnd={handleRelease}
			onTouchMove={handleRelease}
			className={cn("relative", className)}
			{...props}
		>
			{children}
			<div className="absolute inset-0 h-full w-full overflow-hidden rounded-xl">
				<span
					style={
						{
							top: ripple && `${ripple.y}px`,
							left: ripple && `${ripple.x}px`,
							width: ripple && `${ripple.width}px`,
							height: ripple && `${ripple.height}px`,
							"--ripple-duration": `${transition.duration}ms`,
							"--ripple-easing": transition.easing,
						} as React.CSSProperties
					}
					className={cn(
						ripple && [
							`animate-ripple dark:bg-primary-foreground bg-muted-foreground absolute h-full w-full rounded-full opacity-10`,
							rippleClassName,
						],
					)}
				></span>
			</div>
		</button>
	);
}

export { RippleButton, type RippleButtonProps };
