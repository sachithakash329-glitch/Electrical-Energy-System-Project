import dns from 'node:dns';
import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app.js';
import { connectDatabase } from './database.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

try {
  await connectDatabase(process.env.MONGODB_URI);
  const port = Number(process.env.PORT || 5000);
  const server = app.listen(port, '127.0.0.1', () => {
    console.log('MongoDB connected.');
    console.log(`API ready at http://127.0.0.1:${port}`);
  });
  server.on('error', async () => {
    console.error('Could not start API. Check whether PORT is already in use.');
    await mongoose.disconnect();
    process.exit(1);
  });
  for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    }));
  }
} catch (error) {
  const details = String(error.message).replace(
    /mongodb(?:\+srv)?:\/\/\S+/gi,
    '[connection string hidden]'
  );

  console.error('Database error:', error.name);
  console.error('Error code:', error.code ?? 'Not provided');
  console.error('Details:', details);

  await mongoose.disconnect();
  process.exit(1);
}
