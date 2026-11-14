import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/v2-2perspectives/" : "/",
  plugins: [react(), tailwindcss()],
}));
