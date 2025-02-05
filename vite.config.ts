import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    target: 'esnext',
    outDir: 'dist',
    lib: {
      entry: 'src/main.tsx',
      name: 'MediaUI',
      formats: ['es'],
    },
  },
  define: {
    'process.env': {}
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    }
  },
  server: {
    host: true,
    port: 5173,
  }
})
