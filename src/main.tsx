import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initNativeApp } from "@/lib/native";

// Native bootstrap no-ops in the browser; only runs inside the Capacitor shell.
initNativeApp();

createRoot(document.getElementById("root")!).render(<App />);
