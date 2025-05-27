import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

console.log('⚡ Vite config is being loaded');

export default defineConfig({
  plugins: [    {
      name: 'log-proxy-setup',
      configureServer(server) {
        console.log('Proxy middleware installed.');
      }
    },
    react()
  ],
  server: {
    proxy: {
      '/vehicles': {
        target: 'http://backend:3001',
        changeOrigin: true,
        configure: (proxyServer) => {
          proxyServer.on('proxyReq', (proxyReq, req, res) => {
            console.log('Proxying request:', req.url);
          });
        },
      },
      '/availability': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
      '/schedule': {
        target: 'http://backend:3001',
        changeOrigin: true,
      },
    }
  }
});