import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'node:path'

// Relative base lets the build run on GitHub Pages at any path
// (user-site, project-site, custom domain) without rebuilding.
export default defineConfig({
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), 'src'),
    },
  },
  plugins: [react()],
});
