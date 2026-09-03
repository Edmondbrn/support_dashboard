/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from "path"

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        "@": path.resolve(import.meta.dirname, "./src"),
      },
    },
    test: {
      include: ["tests/integration/**/*.test.ts"],
      testTimeout: 20_000,
      hookTimeout: 20_000,
      silent: 'passed-only',
      fileParallelism: false, // avoid race condition for integration tests
    },
    server: {
      allowedHosts: [env.VITE_ALLOWED_HOSTS]
    }
}})
