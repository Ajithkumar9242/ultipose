import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      // any request starting with /pos-api will be proxied
      "/pos-api": {
        target: "http://ultipos.local:8000",
        changeOrigin: true,
        secure: false
      }
    }
  },
})
