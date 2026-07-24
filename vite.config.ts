import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    // MapLibre v6 ships its own worker ESM; Vite's dep optimizer breaks the worker path.
    exclude: ['maplibre-gl'],
  },
  build: {
    target: 'es2022',
  },
})
