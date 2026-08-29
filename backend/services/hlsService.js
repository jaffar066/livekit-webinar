import dotenv from "dotenv";
import { EgressClient } from "livekit-server-sdk";

const LIVEKIT_URL = process.env.LIVEKIT_URL || "ws://localhost:7880";
const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || "devkey";
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || "secret";

const egressClient = new EgressClient(
  LIVEKIT_URL.replace("ws", "http"),
  LIVEKIT_API_KEY,
  LIVEKIT_API_SECRET
);

const RTMP_URL = process.env.RTMP_URL || "rtmp://localhost/live/stream";

export const startHlsStream = async (req, res) => {
  try {
    const { room } = req.body;
    console.log("Room:", room);
    if (!room) {
      return res
        .status(400)
        .json({ error: "Room is required" });
    }
    const streamKey = `${room}-${Date.now()}`;
    const egress = await egressClient.startRoomCompositeEgress(
      room,
      {
        streamOutputs: [
          {
            urls: [
              `${RTMP_URL}/${streamKey}`,
            ],
          },
        ],
      }
     );
      
    const hlsUrl = `http://103.149.9.39:8888/live/${streamKey}/index.m3u8`;
    return res.json({
      success: true,
      egressId: egress.egressId,
      streamKey,
      hlsUrl,
    });
  } catch (error) {
    console.error("HLS Start Error:", error);
    return res.status(500).json({
      error: "Failed to start HLS stream",
    });
  }
};

export const stopHlsStream = async (req, res) => {
  try {
    const { egressId } = req.body;
    if (!egressId) {
      return res.status(400).json({ error: "egressId is required" });
    }
    await egressClient.stopEgress(egressId);
    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("HLS Stop Error:", error);
    return res.status(500).json({
      error: "Failed to stop HLS stream",
    });
  }
};