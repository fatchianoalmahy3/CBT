import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { MODULE_REGISTRY } from './src/core/registry';

const app = express();
const PORT = 3000;

// Body parser
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Route: Schema Registry definition (Cached with stale-while-revalidate)
app.get('/api/v1/schemas', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=600');
  res.json({
    success: true,
    data: MODULE_REGISTRY
  });
});

// Vite Middleware for Full Stack Dev & Prod Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Starter Kit Backend] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
