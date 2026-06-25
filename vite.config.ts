import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

function makeCsp(mode: string, backendUrl: string): string {
  const base = `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: ${backendUrl}; font-src 'self' data:; connect-src 'self' ${backendUrl}`;
  if (mode === 'development') {
    return base.replace("script-src 'self' 'unsafe-inline'", "script-src 'self' 'unsafe-inline' 'unsafe-eval'");
  }
  return base;
}

export default defineConfig(({ mode }) => {
  // آدرس بک‌اند — دقیقاً منطبق با src/lib/constants.ts
  const backendUrl = mode === 'development'
    ? 'http://127.0.0.1:8000'
    : 'http://172.16.10.10:8080';

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      headers: {
        'Content-Security-Policy': makeCsp(mode, backendUrl),
      },
      proxy: {
        '/certificate': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
