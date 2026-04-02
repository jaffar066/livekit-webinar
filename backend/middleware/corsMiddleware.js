import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

export const corsOptions = {
  origin: ['http://localhost:5173', process.env.CORS_ORIGIN].filter(Boolean),
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
};

export default cors(corsOptions);
