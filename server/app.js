import express from 'express';
import mongoose from 'mongoose';
import appliances from './routes/appliances.js';
import settings from './routes/settings.js';
import Room from './models/Room.js';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '10kb' }));

app.get('/api/health', (req, res) => {
  const connected = mongoose.connection.readyState === 1;
  res.status(connected ? 200 : 503).json({ database: connected ? 'connected' : 'disconnected' });
});

// Fail promptly if the database connection is lost during the demonstration.
app.use('/api', (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ message: 'Database unavailable. Please try again shortly.' });
  }
  next();
});
app.get('/api/rooms', async (req, res) => res.json(await Room.find().sort({ name: 1 })));
app.use('/api/appliances', appliances);
app.use('/api/settings', settings);
app.use((req, res) => res.status(404).json({ message: 'API route not found.' }));

// Express 5 sends rejected async route promises to this error handler.
app.use((error, req, res, next) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      message: Object.values(error.errors).map(item => item.message).join(' ')
    });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Invalid JSON request.' });
  }
  if (error.status && error.status < 500) {
    return res.status(error.status).json({ message: error.status === 413 ? 'Request too large.' : error.message });
  }
  console.error('Request failed:', error.name);
  res.status(500).json({ message: 'Could not complete the request. Please try again.' });
});

export default app;
