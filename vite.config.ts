import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  // GitHub Pages 同时兼容「项目子路径 /WordDNA/」与「自定义域名根路径」：
  // 生产构建用相对 base（'./'），资源/路由在任意挂载路径下都能正确解析；开发态保持 '/'。
  base: process.env.NODE_ENV === 'production' ? './' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 5273,
    host: true,
  },
  preview: {
    port: 4173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
  },
});
