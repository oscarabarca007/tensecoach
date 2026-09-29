import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base "./" keeps asset paths relative so the build works from any sub-path
// (GitHub Pages, Netlify, etc.).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
