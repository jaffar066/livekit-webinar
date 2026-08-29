import express from "express";
import { startHlsStream, stopHlsStream, } from "../services/hlsService.js";

const router = express.Router();

router.post("/start", startHlsStream);
router.post("/stop", stopHlsStream);

export default router;