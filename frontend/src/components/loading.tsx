function Loading() {
	return (
		<div className="flex h-dvh items-center justify-center gap-2">
			<div className="animate-expand-y bg-primary h-10 w-4" />
			<div className="animate-expand-y bg-primary h-10 w-4 delay-100" />
			<div className="animate-expand-y bg-primary h-10 w-4 delay-200" />
			<div className="animate-expand-y bg-primary h-10 w-4 delay-300" />
			<div className="animate-expand-y bg-primary h-10 w-4 delay-400" />
		</div>
	);
}

export { Loading };
