import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

type Side = "left" | "right";

interface Item {
	id: string;
	node: React.ReactNode;
	order: number;
	sequence: number;
}

interface TopBarProviderState {
	register: (side: Side, item: Omit<Item, "sequence">) => void;
	unregister: (side: Side, id: string) => void;
}

const TopBarContext = createContext<TopBarProviderState | null>(null);

function TopBarProvider({ children }: React.PropsWithChildren) {
	const [left, setLeft] = useState<Map<string, Item>>(() => new Map());
	const [right, setRight] = useState<Map<string, Item>>(() => new Map());
	const seqRef = useRef(0);

	const register = useCallback<TopBarProviderState["register"]>((side, { id, node, order = 0 }) => {
		const setMap = side === "left" ? setLeft : setRight;

		setMap((prev) => {
			const next = new Map(prev);
			const existing = next.get(id);

			if (existing) {
				next.set(id, { ...existing, node, order });
			} else {
				next.set(id, { id, node, order, sequence: seqRef.current++ });
			}

			return next;
		});
	}, []);

	const unregister = useCallback<TopBarProviderState["unregister"]>((side, id) => {
		const setMap = side === "left" ? setLeft : setRight;

		setMap((prev) => {
			if (!prev.has(id)) return prev;

			const next = new Map(prev);
			next.delete(id);

			return next;
		});
	}, []);

	const value = useMemo(() => ({ register, unregister }), [register, unregister]);

	const renderSide = (map: Map<string, Item>) =>
		Array.from(map.values())
			.sort((a, b) => a.order - b.order || a.sequence - b.sequence)
			.map((item) => <div key={item.id}>{item.node}</div>);

	return (
		<TopBarContext.Provider value={value}>
			<div className="absolute top-0 left-0 flex w-full justify-between p-4">
				<div className="flex space-x-4">{renderSide(left)}</div>
				<div className="flex space-x-4">{renderSide(right)}</div>
			</div>
			{children}
		</TopBarContext.Provider>
	);
}

function useTopBar() {
	const context = useContext(TopBarContext);

	if (context === undefined) throw new Error("useTopBar must be used within a TopBarProvider");

	return context!;
}

function TopBarItem({
	side = "left",
	id,
	order = 0,
	children,
}: React.PropsWithChildren<{
	side?: Side;
	id: string;
	order?: number;
}>) {
	const { register, unregister } = useTopBar();

	useEffect(() => {
		register(side, { id, node: children, order });
		return () => unregister(side, id);
	}, [register, unregister, side, id, order, children]);

	return null;
}
export { TopBarProvider, useTopBar, TopBarItem };
