import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleLogin,
  handleSession,
  handleLogout,
  handleChangePassword,
} from './src/server/authHandler.js';
import {
  handleGetConfig,
  handleSaveConfig,
} from './src/server/supabaseServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(cookieParser());

// Serverless API route endpoints
app.post('/api/login', handleLogin);
app.get('/api/session', handleSession);
app.post('/api/logout', handleLogout);
app.post('/api/change-password', handleChangePassword);
app.get('/api/config', handleGetConfig);
app.post('/api/config', handleSaveConfig);

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve production build
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // Development mode with Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
