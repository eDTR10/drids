import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Relative assets support both repository Pages sites and custom domains.
export default defineConfig({ plugins: [react()], base: "./" });
