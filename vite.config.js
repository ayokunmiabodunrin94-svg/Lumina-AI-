import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Set VITE_BASE=/your-repo/ when deploying to a GitHub Pages sub-path.
export default defineConfig({
  base: process.env.VITE_BASE || '/',
  plugins: [react()],
});
