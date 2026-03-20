import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
    methods: ['GET', 'POST'],
  })
);
app.use(express.json());

const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

if (!process.env.LIVEKIT_URL || !process.env.LIVEKIT_API_KEY || !process.env.LIVEKIT_API_SECRET) {
  console.warn(
    'Using default LiveKit credentials. For production, set LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET in backend/.env'
  );
}

const getParam = (req, ...names) => {
  for (const name of names) {
    if (req.body && typeof req.body === 'object' && req.body[name] != null) {
      return req.body[name];
    }
    if (req.query && req.query[name] != null) {
      return req.query[name];
    }
  }
  return undefined;
};

// Track which identity is the host for each room.
const roomHostById = new Map();

const createTokenResponse = async (req, res) => {
  const identity = getParam(req, 'identity', 'participantIdentity', 'participant_name') ?? '';
  const room = getParam(req, 'room', 'roomName', 'room_name') ?? '';

  if (!identity || !room) {
    return res.status(400).json({ error: 'Missing required fields: identity and room' });
  }

  const existingHost = roomHostById.get(room);
  const requestedRole = (getParam(req, 'role') || '').toString();
  const isValidRole = ['host', 'cohost', 'viewer'].includes(requestedRole);
  const role = isValidRole
    ? requestedRole
    : existingHost
    ? existingHost === identity
      ? 'host'
      : 'viewer'
    : 'host';

  if (!existingHost && role === 'host') {
    roomHostById.set(room, identity);
  }

  const canPublish = role === 'host' || role === 'cohost';
  const grant = {
    room,
    roomJoin: true,
    canPublish,
    canSubscribe: true,
    participantAttributes: { role },
  };
  const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity: identity.toString(),
  });
  at.addGrant(grant);

  const participantToken = await at.toJwt();
  res.json({
    server_url: LIVEKIT_URL,
    participant_token: participantToken,
    role,
  });
};

app.post('/get-token', createTokenResponse);
app.get('/get-token', createTokenResponse);

app.listen(PORT, () => {
  console.log(`LiveKit token server listening on http://localhost:${PORT}`);
});
