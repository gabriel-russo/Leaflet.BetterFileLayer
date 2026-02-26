import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/leaflet.control.ts'),
      name: 'leaflet.betterfilelayer',
      formats: ['es'],
      cssFileName: 'leaflet.betterfilelayer',
      minify: true,
      sourcemap: true,
      fileName: () => 'leaflet.betterfilelayer.js',
    },
    sourcemap: true,
    rollupOptions: {
      external: ['leaflet'],
      output: {
        globals: {
          leaflet: 'leaflet',
        },
      },
    },
  },
});
