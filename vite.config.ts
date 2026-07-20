import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      '://onrender.com'
    ],
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // تأكد أن هذا هو نفس المنفذ (PORT) المكتوب في ملف server.ts
        changeOrigin: true,
        secure: false,
      }
    }
  }
});
