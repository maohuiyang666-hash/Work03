import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = 4173

export default defineConfig({
  plugins: [react()],
  server: {
    host: '127.0.0.1',
    port,
    strictPort: true,
    open: false,
  },
  preview: {
    host: '127.0.0.1',
    port,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/App.tsx'],
    },
  },
} as never)
