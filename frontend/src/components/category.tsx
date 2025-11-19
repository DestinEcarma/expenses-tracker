import CircularProgress from "./circular-progress";
import { EditCategory } from "./edit-category";
import { Icon } from "./icon";
import { RippleButton } from "./ripple-button";
import { Card, CardContent } from "./ui/card";
import { useLongPress } from "@/hooks/use-long-press";
import { cn } from "@/lib/utils";
import type { EditedCategory, Category as ICategory } from "@/services/expenses";
import { useState } from "react";
import { FaExclamation } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

interface CategoryProps extends ICategory {
	progress: number;
	color?: string;
	onSave?: (editedCategory: EditedCategory) => void;
	onDelete?: () => void;
}

function Category({ id, name, amount, transactions, progress, color, icon, onSave, onDelete }: CategoryProps) {
	const navigate = useNavigate();
	const [openEdit, setOpenEdit] = useState(false);

	const resolvedColor = `var(--category-${color ?? "red"})`;
	const pct = Math.max(0, Math.min(100, progress));

	const longPressAttrs = useLongPress(() => setOpenEdit(true), {
		onClick: () => navigate(`/expenses/${id}`),
	});

	const iconComp = <Icon name={icon} defaultIcon={FaExclamation} />;

	return (
		<>
			<RippleButton
				onContextMenu={(e) => {
					e.preventDefault();
					setOpenEdit(true);
				}}
				{...longPressAttrs}
				className="group transition-transform outline-none select-none hover:scale-[1.02]"
			>
				<Card
					className={cn([
						"cursor-pointer py-4 transition-all",
						"group-focus-visible:border-ring group-focus-visible:ring-ring/50 group-focus-visible:ring-[3px]",
					])}
				>
					<CardContent className="flex gap-4 px-4">
						<CircularProgress
							progress={pct}
							size="4.5rem"
							color={resolvedColor}
							className="text-muted-foreground/70 text-3xl"
						>
							{iconComp}
						</CircularProgress>
						<div className="flex w-full flex-col justify-center">
							<div className="flex justify-between font-bold">
								<span>{name}</span>
								<span>₱{amount.toFixed(2)}</span>
							</div>
							<div className="text-muted-foreground flex justify-between text-sm">
								<span>{transactions} transactions</span>
								<span>{Math.trunc(pct)}%</span>
							</div>
						</div>
					</CardContent>
				</Card>
			</RippleButton>
			<EditCategory
				id={id}
				name={name}
				icon={icon}
				open={openEdit}
				setOpen={setOpenEdit}
				onSave={onSave}
				onDelete={onDelete}
			/>
		</>
	);
}

export { Category };
