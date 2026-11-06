import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // P3 FIX: Disable source maps in production — prevents source code exposure.
    sourcemap: false,
    rollupOptions: {
      output: {
        // P3 FIX: Manual chunk splitting keeps initial bundle small.
        // Vite 6 (Rolldown) requires manualChunks as a function, not an object.
        manualChunks(id) {
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3') || id.includes('node_modules/victory')) {
            return 'charts';
          }
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react-router') || id.includes('node_modules/react/')) {
            return 'vendor';
          }
        },
      },
    },
  },
})
