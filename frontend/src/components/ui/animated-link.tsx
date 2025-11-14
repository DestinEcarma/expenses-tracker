import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { Link } from "react-router-dom";

const animatedLinkVariants = cva(
	"text-primary before:bg-primary relative outline-none before:absolute before:bottom-0 before:left-[50%] before:h-[1px] before:w-[0%] before:-translate-x-1/2 before:transition-[width] hover:before:w-[100%] focus-visible:before:w-[100%]",
	{
		variants: {
			size: {
				default: "text-base",
				sm: "text-sm",
				lg: "text-lg",
				xl: "text-xl",
			},
		},
		defaultVariants: {
			size: "default",
		},
	},
);

function AnimatedLink({
	size,
	className,
	asChild = false,
	...props
}: React.ComponentProps<typeof Link> &
	VariantProps<typeof animatedLinkVariants> & {
		asChild?: boolean;
	}) {
	const Comp = (asChild ? Slot : Link) as React.ElementType;
	return <Comp className={cn(animatedLinkVariants({ size, className }))} {...props} />;
}

export { AnimatedLink, animatedLinkVariants };
