import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import apiRouter from './api/index.js';
import { startAIWorker } from './workers/aiWorker.js';

const app = express();
const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aura_habit_tracker';

app.use(
  cors({
    origin: CLIENT_URL,
  })
);
app.use(express.json());

// API Routes
app.use('/api', apiRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(500).json({
    message: error.message || 'Unexpected server error.',
  });
});

async function startServer() {
  await connectDB(MONGODB_URI);
  await startAIWorker();

  app.listen(PORT, () => {
    console.log(`Habit tracker API listening on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error('Server failed to start.');
  console.error(error.message);
  process.exit(1);
});
