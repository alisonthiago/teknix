import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  plugins: [
    {
      name: 'strip-legacy-elementor-charset',
      enforce: 'pre',
      transform(code, id) {
        if (id.split('?')[0].endsWith('/elementor-core-widgets.css')) {
          return code.replace(/@charset\s+["']UTF-8["'];?/g, '')
        }
        return null
      },
    },
    react(),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
})
