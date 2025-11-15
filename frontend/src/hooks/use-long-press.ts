import { useCallback, useRef } from "react";

interface UseLongPressOptions {
	onClick?: (e: React.MouseEvent) => void;
	threshold?: number;
	moveThreshold?: number;
}

export function useLongPress(
	onLongPress: (e: React.MouseEvent | React.TouchEvent) => void,
	{ threshold = 500, moveThreshold = 10, onClick }: UseLongPressOptions = {},
) {
	const timerRef = useRef<NodeJS.Timeout | null>(null);
	const startPos = useRef({ x: 0, y: 0 });
	const isLongPress = useRef(false);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			if (!isLongPress.current) {
				onClick?.(e);
			}
		},
		[onClick],
	);

	const start = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			isLongPress.current = false;

			const point = "touches" in e ? e.touches[0] : e;
			startPos.current = { x: point.clientX, y: point.clientY };

			timerRef.current = setTimeout(() => {
				isLongPress.current = true;
				onLongPress?.(e);
			}, threshold);
		},
		[onLongPress, threshold],
	);

	const clear = useCallback(() => {
		if (timerRef.current) {
			clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const onMove = (e: React.TouchEvent) => {
		const point = e.touches[0];
		const dx = Math.abs(point.clientX - startPos.current.x);
		const dy = Math.abs(point.clientY - startPos.current.y);

		if (dx > moveThreshold || dy > moveThreshold) {
			clear();
		}
	};

	return {
		onClick: handleClick,
		onMouseDown: start,
		onMouseUp: clear,
		onMouseLeave: clear,
		onTouchStart: start,
		onTouchEnd: clear,
		onTouchMove: onMove,
	};
}
