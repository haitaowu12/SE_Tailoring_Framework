import { defineConfig } from 'vite';

export default defineConfig({
    root: '.',
    base: '/SE_Tailoring_Framework/',
    server: {
        port: 5173,
        open: false
    },
    build: {
        outDir: 'dist'
    }
});
