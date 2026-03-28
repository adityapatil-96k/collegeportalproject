import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const devApiTarget = env.VITE_DEV_API_TARGET || 'http://localhost:5000'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/resources': devApiTarget,
        '/login': devApiTarget,
        '/logout': devApiTarget,
        '/register': devApiTarget,
        '/student-dashboard': devApiTarget,
        '/teacher-dashboard': devApiTarget,
        '/student-profile': devApiTarget,
        '/bookmarks': devApiTarget,
        '/notifications': devApiTarget,
        '/api': devApiTarget,
      },
    },
  }
})
