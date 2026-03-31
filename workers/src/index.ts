import { Hono } from 'hono';

const app = new Hono();

// Health check
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    message: 'Psikotest API is running on Workers'
  });
});

// Simple test endpoint
app.get('/api/test', (c) => {
  return c.json({
    message: 'API is working!',
    env: c.env ? 'Bindings available' : 'No bindings',
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ 
    error: 'Internal Server Error',
    message: err.message 
  }, 500);
});

export default app;