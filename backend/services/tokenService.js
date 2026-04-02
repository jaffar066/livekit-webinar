import dotenv from 'dotenv';
import { AccessToken } from 'livekit-server-sdk';

dotenv.config();

const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

const roomHostById = new Map();

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

export const createToken = async (req, res) => {
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

  const grant = {
    room,
    roomJoin: true,
    canPublish: true,
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
