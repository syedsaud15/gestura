import tailwindcss from '@tailwindcss/postcss';
import vinext from 'vinext';
import { defineConfig } from 'vite';
export default defineConfig({
  resolve: { preserveSymlinks: true },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [vinext()],
});
