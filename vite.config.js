import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    base: '/se-tailoring-app/',
    server: {
        port: 5173,
        open: false
    },
    build: {
        outDir: 'dist'
    }
});
