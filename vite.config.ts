import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/hzs': {
        target: 'https://www.hzspa.cz',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hzs/, '/vyjezdy'),
        secure: false, // Bypass SSL errors if hzspa.cz has any
      }
    }
  }
});
