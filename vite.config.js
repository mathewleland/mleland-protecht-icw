import { defineConfig } from 'vite'

export default defineConfig({
    root: '.',
    build: {
        outDir: 'dist'
    },
    server: {
        open: '/partner.html'
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['src/test/setup.ts'],
    }
}) 