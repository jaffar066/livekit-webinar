import mongoose from 'mongoose';

const recordingSchema = new mongoose.Schema(
  {
    room: {
      type: String,
      required: [true, 'Room name is required'],
      trim: true,
    },
    egressId: {
      type: String,
      required: [true, 'Egress ID is required'],
      unique: true,
    },
    fileName: {
      type: String,
      required: [true, 'File name is required'],
    },
    downloadUrl: {
      type: String,
      required: [true, 'Download URL is required'],
    },
    status: {
      type: String,
      enum: ['recording', 'stopped', 'completed', 'failed'],
      default: 'recording',
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    stoppedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: 0,
    },
    fileSize: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Recording', recordingSchema);