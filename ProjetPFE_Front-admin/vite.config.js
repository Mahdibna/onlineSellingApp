import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // To exclude specific polyfills, add them to this list
      exclude: [
        'fs', // Example: exclude the Node 'fs' polyfill
      ],
      // Whether to polyfill specific globals
      globals: {
        global: true,
        process: true,
        Buffer: true,
      },
    }),
  ],
});