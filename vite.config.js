import { defineConfig } from 'vite';

// https://vite.dev/guide/build.html#library-mode
export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'leaflet-better-filelayer',
      formats: ['es', 'umd'],
      cssFileName: 'leaflet.betterfilelayer',
      fileName: (format) =>
        ({
          es: `leaflet.betterfilelayer.modern.js`,
          umd: `leaflet.betterfilelayer.js`,
        })[format],
    },
    sourcemap: true,
    rollupOptions: {
      external: ['leaflet'],
      output: {
        globals: {
          leaflet: 'L',
        },
      },
    },
  },
});
