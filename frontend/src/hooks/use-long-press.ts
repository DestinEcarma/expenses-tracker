import { useCallback, useRef } from "react";

interface UseLongPressOptions {
	onClick?: (e: React.MouseEvent) => void;
	threshold?: number;
}

export function useLongPress(
	onLongPress: (e: React.MouseEvent | React.TouchEvent) => void,
	{ threshold = 500, onClick }: UseLongPressOptions = {},
) {
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const handleClick = useCallback(
		(e: React.MouseEvent) => {
			if (!timerRef.current) {
				onClick?.(e);
			}
		},
		[onClick],
	);

	const start = useCallback(
		(e: React.MouseEvent | React.TouchEvent) => {
			timerRef.current = setTimeout(() => {
				timerRef.current = null;
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

	const onMouseDown = (e: React.MouseEvent) => start(e);
	const onMouseUp = () => clear();
	const onMouseLeave = () => clear();

	const onTouchStart = (e: React.TouchEvent) => start(e);
	const onTouchEnd = () => clear();
	const onTouchMove = () => clear();

	return {
		onClick: handleClick,
		onMouseDown,
		onMouseUp,
		onMouseLeave,
		onTouchStart,
		onTouchEnd,
		onTouchMove,
	};
}
