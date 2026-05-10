import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    // Warn if any single chunk exceeds 400 KB
    chunkSizeWarningLimit: 400,

    rollupOptions: {
      output: {
        manualChunks: {
          // Core React — cached aggressively, changes rarely
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charting — only loaded on Dashboard / Results
          'vendor-charts': ['recharts'],
          // Animation — shared but heavy; separate so pages without it stay light
          'vendor-motion': ['framer-motion'],
        },
      },
    },

    // Remove console.* and debugger statements from production build
    minify: 'esbuild',
    target: 'es2020',
  },

  // Pre-bundle large deps so the dev server doesn't re-transform them every HMR
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'recharts', 'axios'],
  },
})
