// INPUT: frontend build and test configuration
// OUTPUT: Vite and Vitest config
// EFFECT: Defines how the planner frontend is served, bundled, and tested
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    globals: true,
  },
})
