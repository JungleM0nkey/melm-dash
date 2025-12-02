import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Listen on all network interfaces (required for Docker)
    host: '0.0.0.0',
    port: 5173,
    // Enable WebSocket HMR in Docker
    hmr: {
      clientPort: 5173,
    },
  },
})