import dotenv from 'dotenv';
import { EgressClient } from 'livekit-server-sdk';
import fs from 'fs';
import path from 'path';

dotenv.config();

const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

export const RECORDINGS_DIR = '/home/azureuser/recordings';

const egressClient = new EgressClient(
  LIVEKIT_URL.replace('ws', 'http'),
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

export const startRecording = async (req, res) => {
  try {
    const { room } = req.body;
    if (!room) return res.status(400).json({ error: 'Room is required' });

    const fileName = `${room}-${Date.now()}.mp4`;
    const filepath = `/out/${fileName}`;

    const response = await egressClient.startRoomCompositeEgress(room, {
      file: { filepath },
    });

    res.json({
      success: true,
      egressId: response.egressId,
      fileName,
      downloadUrl: `/recordings/${fileName}`,
    });
  } catch (err) {
    console.error('Egress Error:', err);
    res.status(500).json({ error: 'Failed to start recording' });
  }
};

export const stopRecording = async (req, res) => {
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
};

export const deleteRecording = (req, res) => {
  const filename = req.params.filename;
  if (!filename || !/^[\w\-. ]+\.mp4$/i.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }
  const filepath = path.join(RECORDINGS_DIR, filename);
  if (!filepath.startsWith(RECORDINGS_DIR + path.sep) && filepath !== RECORDINGS_DIR) {
    return res.status(400).json({ error: 'Invalid path' });
  }
  fs.unlink(filepath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') return res.status(404).json({ error: 'File not found' });
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Failed to delete recording' });
    }
    res.json({ success: true });
  });
};

export const listRecordings = (req, res) => {
  fs.readdir(RECORDINGS_DIR, (err, files) => {
    if (err) {
      console.error('FS Error:', err);
      return res.json({ recordings: [] });
    }
    const mp4Files = files.filter((file) => file.endsWith('.mp4'));
    const recordings = mp4Files.map((name) => {
      try {
        const stat = fs.statSync(path.join(RECORDINGS_DIR, name));
        return { name, size: stat.size };
      } catch {
        return { name, size: 0 };
      }
    });
    res.json({ recordings });
  });
};
