import { useIsomorphicLayoutEffect } from "@/hooks";
import { useLocalStorage, useMediaQuery } from "@uidotdev/usehooks";
import { createContext, useContext, useEffect, useState } from "react";

type ActiveTheme = "dark" | "light";
type Theme = ActiveTheme | "system";

interface ThemeProviderProps extends React.PropsWithChildren {
	defaultTheme?: Theme;
	storageKey?: string;
}

interface ThemeProviderState {
	theme: Theme;
	activeTheme: Theme;
	saveTheme: (theme: Theme) => void;
}

const THEME_STORAGE = "theme";

const ThemeProviderContext = createContext<ThemeProviderState>({
	theme: "system",
	activeTheme: "light",
	saveTheme: () => null,
});

function ThemeProvider({ defaultTheme = "system", storageKey = THEME_STORAGE, ...props }: ThemeProviderProps) {
	const [theme, saveTheme] = useLocalStorage<Theme>(storageKey, defaultTheme);
	const [activeTheme, setActiveTheme] = useState<ActiveTheme>(theme === "system" ? "light" : theme);
	const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");

	useIsomorphicLayoutEffect(() => {
		const root = window.document.body;

		root.classList.remove("light", "dark");
		root.classList.add(activeTheme);
	}, [activeTheme]);

	useEffect(() => {
		if (theme === "system") {
			setActiveTheme(prefersDark ? "dark" : "light");
		} else {
			setActiveTheme(theme);
		}
	}, [theme, prefersDark]);

	const value = {
		theme,
		activeTheme,
		saveTheme,
	};

	return <ThemeProviderContext.Provider {...props} value={value} />;
}

function useTheme() {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) throw new Error("useTheme must be used within a ThemeProvider");

	return context;
}

export { ThemeProvider, useTheme };
