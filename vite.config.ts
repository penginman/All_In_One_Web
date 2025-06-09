import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist'
  },
  server: {
    proxy: {
      '/webdav-proxy': {
        target: '',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/webdav-proxy/, ''),
        configure: (proxy, options) => {
          // 动态代理配置
        }
      }
    }
  }
})
