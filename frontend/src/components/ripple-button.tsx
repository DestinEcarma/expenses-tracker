import { cn } from "@/lib/utils";
import { type HTMLMotionProps, motion, type Transition } from "motion/react";
import * as React from "react";
import { useCallback, useImperativeHandle, useRef, useState } from "react";

interface Ripple {
	id: number;
	x: number;
	y: number;
	width: number;
	height: number;
}

interface RippleButtonProps extends HTMLMotionProps<"button"> {
	children: React.ReactNode;
	rippleClassName?: string;
	transition?: Transition;
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
	transition = { duration: 0.5, ease: "easeOut" },
	...props
}: RippleButtonProps) {
	const [ripples, setRipples] = useState<Ripple[]>([]);
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

			const newRipple: Ripple = {
				id: Date.now(),
				x: x - r,
				y: y - r,
				width: size,
				height: size,
			};

			setRipples((prev) => [...prev, newRipple]);
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
			setRipples([]);

			if (onMouseUp && event.type === "mouseup") onMouseUp(event as React.MouseEvent<HTMLButtonElement>);
			if (onMouseLeave && event.type === "mouseleave") onMouseLeave(event as React.MouseEvent<HTMLButtonElement>);
			if (onTouchEnd && event.type === "touchend") onTouchEnd(event as React.TouchEvent<HTMLButtonElement>);
			if (onTouchMove && event.type === "touchmove") onTouchMove(event as React.TouchEvent<HTMLButtonElement>);
		},
		[onMouseUp, onMouseLeave, onTouchEnd, onTouchMove],
	);

	return (
		<motion.button
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
				{ripples.map((ripple) => (
					<motion.span
						key={ripple.id}
						initial={{ scale: 0, opacity: 0.1 }}
						animate={{ scale: 1 }}
						transition={transition}
						className={cn(
							"dark:bg-primary-foreground bg-muted-foreground absolute h-full w-full rounded-full",
							rippleClassName,
						)}
						style={{
							top: ripple.y,
							left: ripple.x,
							width: ripple.width,
							height: ripple.height,
						}}
					/>
				))}
			</div>
		</motion.button>
	);
}

export { RippleButton, type RippleButtonProps };
