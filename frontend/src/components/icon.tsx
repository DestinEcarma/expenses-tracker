import { Spinner } from "./ui/spinner";
import { lazy, Suspense } from "react";
import type { IconBaseProps, IconType } from "react-icons/lib";

const iconCache = new Map<string, IconType>();

function loadIcon(name: string, DefaultIcon?: React.FC) {
	return lazy(() =>
		import("react-icons/fa").then((module) => {
			if (iconCache.has(name)) {
				return { default: iconCache.get(name) as IconType };
			}

			const Component = module[name] as IconType | undefined;

			if (!Component) {
				return { default: DefaultIcon || module["FaExclamationTriangle"] };
			}

			iconCache.set(name, Component);

			return { default: Component };
		}),
	);
}

async function getAllIcons() {
	if (iconCache.size < 1611) {
		const icons = await import("react-icons/fa");

		for (const [name, Component] of Object.entries(icons)) {
			if (iconCache.has(name)) {
				continue;
			}

			iconCache.set(name, Component as IconType);
		}
	}

	return iconCache;
}

function Icon({ name, defaultIcon: DefaultIcon }: { name: string; defaultIcon?: React.FC } & IconBaseProps) {
	if (iconCache.has(name)) {
		const CachedComponent = iconCache.get(name) as IconType;
		return <CachedComponent />;
	}

	const Component = loadIcon(name, DefaultIcon);

	return (
		<Suspense fallback={<Spinner />}>
			<Component />
		</Suspense>
	);
}

export { Icon, loadIcon, getAllIcons };
