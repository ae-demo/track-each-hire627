import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { astryxStylex } from "@astryxdesign/build/vite";
import { mockMode } from "./mock/plugin";

export default defineConfig(({ mode }) => ({
  plugins: [...astryxStylex(), react(), ...(mode === "mock" ? [mockMode()] : [])],
}));
