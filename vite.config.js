import { defineConfig } from 'vite';

export default defineConfig({
    root: 'public',
    base: '/vaynhanh8/',
    server: { host: true, port: 5173, open: '/vaynhanh8/' },
    build: { outDir: '../dist', emptyOutDir: true },
    plugins: [{
        name: 'redirect-trailing-slash',
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                if (req.url === '/vaynhanh8') {
                    res.statusCode = 301;
                    res.setHeader('Location', '/vaynhanh8/');
                    res.end();
                    return;
                }
                next();
            });
        }
    }]
});