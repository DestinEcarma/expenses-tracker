import { Icon, getAllIcons } from "./icon";
import { DrawerUI, PopoverUI } from "./responsive-overlay";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { useMediaQuery } from "@uidotdev/usehooks";
import { useGrid, Grid } from "@virtual-grid/react";
import { useEffect, useMemo, useRef, useState } from "react";

function useIconSelector() {
	const [icons, setIcons] = useState<{ name: string; Component: React.FC; friendlyName: string }[]>([]);
	const [search, setSearch] = useState("");

	useEffect(() => {
		(async () =>
			setIcons(
				[...(await getAllIcons())]
					.map(([name, IconComponent]) => {
						return {
							name: name,
							friendlyName:
								name
									.slice(2)
									.match(/[A-Z][a-z]+/g)
									?.join(" ") ?? name,
							Component: IconComponent,
						};
					})
					.sort((a, b) => a.name.localeCompare(b.name)),
			))();
	}, []);

	const filteredIcons = useMemo(() => {
		return icons.filter(({ name }) => {
			if (search === "" || search.length < 3) {
				return true;
			} else if (name.toLowerCase().includes(search.toLowerCase())) {
				return true;
			} else {
				return false;
			}
		});
	}, [icons, search]);

	return {
		search,
		setSearch,
		icons: filteredIcons,
	};
}

function IconPicker({ value, onChange }: { value?: string; onChange?: (icon: string) => void }) {
	const { search, setSearch, icons } = useIconSelector();
	const scrollRef = useRef<HTMLDivElement>(null);

	const grid = useGrid({
		scrollRef: scrollRef as React.RefObject<HTMLElement>,
		count: icons.length,
		columns: 6,
	});

	return (
		<div className="relative">
			<Input
				type="search"
				placeholder="Search..."
				value={search}
				onChange={(e) => setSearch(e.target.value)}
				className="mb-4"
			/>
			<div ref={scrollRef} className="max-h-[250px] overflow-x-hidden overflow-y-scroll">
				<Grid grid={grid}>
					{(i) => {
						const { name, friendlyName, Component } = icons[i];

						return (
							<Tooltip>
								<TooltipTrigger asChild>
									<Button
										key={name}
										size="icon"
										variant={value === icons[i].name ? "default" : "ghost"}
										value={icons[i].name}
										onClick={() => onChange?.(icons[i].name)}
									>
										<Component />
									</Button>
								</TooltipTrigger>
								<TooltipContent>{friendlyName}</TooltipContent>
							</Tooltip>
						);
					}}
				</Grid>
				{icons.length === 0 && <div className="text-muted-foreground p-4 text-center text-sm">No icons found</div>}
			</div>
		</div>
	);
}

function IconSelector({
	defaultIcon,
	value = "",
	onChange,
}: {
	defaultIcon?: React.FC;
	value?: string;
	onChange?: (icon: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const isDesktop = useMediaQuery("(min-width: 768px)");

	const UI = isDesktop ? PopoverUI : DrawerUI;

	return (
		<UI.Container open={open} onOpenChange={setOpen}>
			<UI.Trigger asChild>
				<Button type="button" variant="outline" size="icon">
					<Icon name={value} defaultIcon={defaultIcon} />
				</Button>
			</UI.Trigger>
			<UI.Content>
				<div className={!isDesktop ? "px-4 pt-4" : ""}>
					<IconPicker value={value} onChange={onChange} />
				</div>
			</UI.Content>
		</UI.Container>
	);
}

export { IconSelector };
