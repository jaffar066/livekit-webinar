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
      enum: ['recording', 'stopped', 'failed'],
      default: 'recording',
    },
    startedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    stoppedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model('Recording', recordingSchema);
