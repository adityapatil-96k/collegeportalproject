import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/resources': 'http://localhost:5000',
      '/login': 'http://localhost:5000',
      '/logout': 'http://localhost:5000',
      '/register': 'http://localhost:5000',
      '/student-dashboard': 'http://localhost:5000',
      '/teacher-dashboard': 'http://localhost:5000',
      '/student-profile': 'http://localhost:5000',
      '/bookmarks': 'http://localhost:5000',
      '/notifications': 'http://localhost:5000',
      '/api': 'http://localhost:5000',
    },
  },
})
