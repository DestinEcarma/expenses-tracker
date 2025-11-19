import { Textarea } from "./ui/textarea";

function BioField({ max = 500, ...props }: React.ComponentProps<"textarea"> & { max?: number }) {
	const value = props.value ? props.value.toString() : "";

	return (
		<div className="relative">
			<Textarea {...props} />
			<span
				data-error={value.length > max}
				className="text-muted-foreground data-[error='true']:text-destructive absolute right-3 bottom-2 text-xs tabular-nums"
			>
				{value.length}/{max}
			</span>
		</div>
	);
}

export { BioField };
