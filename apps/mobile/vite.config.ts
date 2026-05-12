import { defineConfig } from 'vite';
import uniModule from '@dcloudio/vite-plugin-uni';

const uni = ((uniModule as unknown as { default?: typeof uniModule }).default || uniModule) as typeof uniModule;

export default defineConfig({
  plugins: [uni()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
