import dotenv from 'dotenv';
import { EgressClient } from 'livekit-server-sdk';
import fs from 'fs';
import path from 'path';
import Recording from '../models/Recording.js';

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

    await Recording.create({
      room,
      egressId: response.egressId,
      fileName,
      downloadUrl: `/recordings/${fileName}`,
      startedBy: req.user.id,
    });

    res.json({
      success: true,
      egressId: response.egressId,
      fileName,
      downloadUrl: `/recordings/${fileName}`,
      startedBy: req.user.id,
    });
  } catch (err) {
    console.error('Egress Error:', err);
    res.status(500).json({ error: 'Failed to start recording' });
  }
};

export const stopRecording = async (req, res) => {
  try {
    const { egressId } = req.body;
    if (!egressId) return res.status(400).json({ error: 'egressId is required' });
    await egressClient.stopEgress(egressId);
    await Recording.findOneAndUpdate(
      { egressId },
      {
        status: 'stopped',
        stoppedAt: new Date(),
      }
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to stop recording' });
  }
};

export const deleteRecording = async (req, res) => {
  const filename = req.params.filename;
  if (!filename || !/^[\w\-. ]+\.mp4$/i.test(filename)) {
    return res.status(400).json({ error: 'Invalid filename' });
  }

  const record = await Recording.findOne({ fileName: filename, startedBy: req.user.id });
  if (!record) return res.status(403).json({ error: 'Not found or access denied' });

  const filepath = path.join(RECORDINGS_DIR, filename);
  if (!filepath.startsWith(RECORDINGS_DIR + path.sep) && filepath !== RECORDINGS_DIR) {
    return res.status(400).json({ error: 'Invalid path' });
  }

  fs.unlink(filepath, async (err) => {
    if (err && err.code !== 'ENOENT') {
      console.error('Delete error:', err);
      return res.status(500).json({ error: 'Failed to delete recording' });
    }
    await Recording.deleteOne({ _id: record._id });
    res.json({ success: true });
  });
};

export const listRecordings = async (req, res) => {
  try {
    const records = await Recording.find({ startedBy: req.user.id }).sort({ createdAt: -1 });
    res.json({ recordings: records.map((r) => r.fileName) });
  } catch (err) {
    console.error('List error:', err);
    res.json({ recordings: [] });
  }
};
