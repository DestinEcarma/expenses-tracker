import App from "./app.tsx";
import "./index.css";
import { Toaster } from "@/components/ui/sonner.tsx";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Toaster />
		<App />
	</StrictMode>,
);
