import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    proxy: {
      // 将 /api 开头的请求代理到后端服务器
      '/api': {
        target: process.env.BACKEND_URL || 'http://localhost:3000', // 使用环境变量或默认值
        changeOrigin: true, // 需要虚拟主机站点
        // 可选：如果后端 API 路径没有 /api 前缀，可以重写路径
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
    },
  },
});
