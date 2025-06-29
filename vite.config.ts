import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // GitHub Pages 部署配置 - 这个路径必须与你的仓库名一致
  base: process.env.NODE_ENV === 'production' ? '/All_In_One_Web/' : '/',
  build: {
    outDir: 'dist',
    // 确保资源正确引用
    assetsDir: 'assets',
    // 生成 source map 便于调试
    sourcemap: false,
    // 优化构建
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          crypto: ['crypto-js']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  preview: {
    port: 4173,
    open: true
  }
})
