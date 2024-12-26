import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
 
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        audit: 'index.html'  // This will become audit.html
      },
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  server: {
    proxy: {
      '/api': {
        target: 'https://server.smartlead.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/pipl': {
        target: 'https://api.pipl.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/pipl/, '')
      },
      '/instantly': {
        target: 'https://api.instantly.ai',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/instantly/, '')
      }
    }
  }
})