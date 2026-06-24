import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

/** CSP for production build — stricter, no unsafe-eval */
export const PRODUCTION_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: http://localhost:8000; font-src 'self' data:; connect-src 'self' http://localhost:8000";

/** CSP for development — unsafe-eval needed for Vite HMR */
const DEV_CSP = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: http://localhost:8000; font-src 'self' data:; connect-src 'self' http://localhost:8000";

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      headers: {
        'Content-Security-Policy': mode === 'production' ? PRODUCTION_CSP : DEV_CSP,
      },
    },
  };
});
