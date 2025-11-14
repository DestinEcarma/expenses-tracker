import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
} from "./ui/dialog";
import {
	Drawer,
	DrawerTrigger,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
	DrawerDescription,
	DrawerFooter,
	DrawerClose,
} from "./ui/drawer";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

type OverlayUI = {
	Container: React.ComponentType<React.PropsWithChildren<{ open?: boolean; onOpenChange?: (open: boolean) => void }>>;
	Trigger: React.ComponentType<React.PropsWithChildren<{ asChild?: boolean }>>;
	Content: React.ComponentType<
		React.PropsWithChildren<{ onWheel?: (e: React.WheelEvent) => void; onTouchMove?: (e: React.TouchEvent) => void }>
	>;
	Header: React.ComponentType<React.PropsWithChildren>;
	Title: React.ComponentType<React.PropsWithChildren>;
	Description: React.ComponentType<React.PropsWithChildren>;
	Footer: React.ComponentType<React.PropsWithChildren>;
	Close: React.ComponentType<React.PropsWithChildren<{ asChild?: boolean }>>;
};

const DialogUI: OverlayUI = {
	Container: Dialog,
	Trigger: DialogTrigger,
	Content: DialogContent,
	Header: DialogHeader,
	Title: DialogTitle,
	Description: DialogDescription,
	Footer: DialogFooter,
	Close: DialogClose,
};

const DrawerUI: OverlayUI = {
	Container: Drawer,
	Trigger: DrawerTrigger,
	Content: DrawerContent,
	Header: DrawerHeader,
	Title: DrawerTitle,
	Description: DrawerDescription,
	Footer: DrawerFooter,
	Close: DrawerClose,
};

const PopoverUI: OverlayUI = {
	Container: Popover,
	Trigger: PopoverTrigger,
	Content: PopoverContent,
	Header: ({ children }) => <div>{children}</div>,
	Title: ({ children }) => <div>{children}</div>,
	Description: ({ children }) => <div>{children}</div>,
	Footer: ({ children }) => <div>{children}</div>,
	Close: ({ children, asChild }) => (asChild ? <>{children}</> : <div>{children}</div>),
};

export { DialogUI, DrawerUI, PopoverUI, type OverlayUI };
