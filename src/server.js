require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const dataRoutes = require('./routes/dataRoutes');
const habitRoutes = require('./routes/habitRoutes');
const logRoutes = require('./routes/logRoutes');
const groqRoutes = require('./routes/groqRoutes');
const aiInsightsRoutes = require('./routes/aiInsightsRoutes');
const templateRoutes = require('./routes/templateRoutes');
const moodRoutes = require('./routes/moodRoutes');
const journalRoutes = require('./routes/journalRoutes');
const identityRoutes = require('./routes/identityRoutes');
const { authMiddleware } = require('./middleware/auth');
const { startAIWorker } = require('./workers/aiWorker');

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

app.get('/api/health', (_request, response) => {
  response.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authMiddleware, dashboardRoutes);
app.use('/api/data', authMiddleware, dataRoutes);
app.use('/api/habits', authMiddleware, habitRoutes);
app.use('/api/logs', authMiddleware, logRoutes);
app.use('/api/ai', authMiddleware, groqRoutes);
app.use('/api/ai', authMiddleware, aiInsightsRoutes);
app.use('/api/templates', authMiddleware, templateRoutes);
app.use('/api/mood', authMiddleware, moodRoutes);
app.use('/api/journal', authMiddleware, journalRoutes);
app.use('/api/identity', authMiddleware, identityRoutes);

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
