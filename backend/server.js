import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

import corsMiddleware, { corsOptions } from './middleware/corsMiddleware.js';
import tokenRoutes from './routes/tokenRoutes.js';
import recordingRoutes from './routes/recordingRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { RECORDINGS_DIR } from './services/recordingService.js';

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const MONGO_URI = process.env.MONGO_URI;

// Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(() => console.log('MongoDB connected:', MONGO_URI))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(corsMiddleware);
app.options('*', cors(corsOptions));
app.use(express.json());
app.use('/recordings', express.static(RECORDINGS_DIR));

app.use('/auth', authRoutes);
app.use(tokenRoutes);
app.use(recordingRoutes);

app.listen(PORT, () => {
  console.log(`LiveKit token server listening on http://localhost:${PORT}`);
});