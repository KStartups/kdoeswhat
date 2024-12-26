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
    sourcemap: true
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