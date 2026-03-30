import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path'; // Added for path handling
import { AccessToken, EgressClient } from 'livekit-server-sdk';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Update this to the actual folder where your recordings are stored on the VM
const RECORDINGS_DIR = '/home/azureuser/recordings';

app.use(cors({
   origin: [ 'http://localhost:5173', process.env.CORS_ORIGIN ].filter(Boolean),
   methods: ['GET', 'POST', 'OPTIONS'],
   allowedHeaders: ['Content-Type', 'Authorization'],
   credentials: true,
}));

app.options('*', cors());
app.use(express.json());

// 1. Serve the recordings folder as a static route
// This allows you to access videos at http://your-ip:port/recordings/filename.mp4
app.use('/recordings', express.static(RECORDINGS_DIR));

const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

const egressClient = new EgressClient(
  LIVEKIT_URL.replace('ws', 'http'),
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

// Endpoint to start recording a room
app.post('/start-recording', async (req, res) => {
  try {
    const { room } = req.body;
    if (!room) return res.status(400).json({ error: 'Room is required' });

    // The filename for the .mp4
    const fileName = `${room}-${Date.now()}.mp4`;
    
    // '/out/' is the internal path inside the Egress Docker container
    const filepath = `/out/${fileName}`; 

    const response = await egressClient.startRoomCompositeEgress(room, {
      file: { filepath },
    });

    res.json({
      success: true,
      egressId: response.egressId,
      fileName: fileName,
      // This is the URL your frontend can use to play the video later
      downloadUrl: `/recordings/${fileName}` 
    });
  } catch (err) {
    console.error('Egress Error:', err);
    res.status(500).json({ error: 'Failed to start recording' });
  }
});

// Endpoint to stop recording
app.post('/stop-recording', async (req, res) => {
  try {
    const { egressId } = req.body;
    if (!egressId) {
      return res.status(400).json({ error: 'egressId is required' });
    }
    await egressClient.stopEgress(egressId);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop recording' });
  }
});

// New Endpoint: List all recordings (Optional but helpful)
app.get('/recordings-list', (req, res) => {
  // Use the fs we imported at the top
  fs.readdir(RECORDINGS_DIR, (err, files) => {
    if (err) {
      console.error('FS Error:', err);
      // Return an empty array instead of 500 so the frontend doesn't crash
      return res.json({ recordings: [] }); 
    }
    const mp4Files = files.filter(file => file.endsWith('.mp4'));
    res.json({ recordings: mp4Files });
  });
});

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

app.post('/get-token', createTokenResponse);
app.get('/get-token', createTokenResponse);

app.listen(PORT, () => {
  console.log(`LiveKit token server listening on http://localhost:${PORT}`);
});