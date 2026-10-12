import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps the built asset URLs relative, so the same `dist/` works
// on a GitHub Pages project site (`/<repo>/`), a Vercel root deploy, or a
// local `npm run preview` — no rebuild per host.
export default defineConfig({
  plugins: [react()],
  base: './',
});
