/// <reference types="vitest" />
import path from 'path'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    exclude: ['e2e/**', '**/node_modules/**'],
    coverage: {
      reporter: ['text', 'html'],
      thresholds: {
        lines: 95,
        branches: 85,
        functions: 92,
        statements: 92,
      },
    },
  },
})
