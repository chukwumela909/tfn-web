// :\Users\God's d greatest\Desktop\new-tfn\models\Stream.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IStream extends Document {
  title: string;
  userId: string;
  muxStreamId: string;
  muxPlaybackId: string;
  rtmpUrl: string;
  streamKey: string;
  status: 'idle' | 'active' | 'ended';
  recordingAssetId?: string;
  currentViewers: string[]; // Array of active viewer IDs
  viewerCount: number; // Current count of active viewers
  createdAt: Date;
  updatedAt: Date;
}

const StreamSchema = new Schema<IStream>(
  {
    title: { type: String, required: true },
    userId: { type: String, required: true, index: true },
    muxStreamId: { type: String, required: true, unique: true },
    muxPlaybackId: { type: String, required: true },
    rtmpUrl: { type: String, required: true },
    streamKey: { type: String, required: true },
    status: { 
      type: String, 
      enum: ['idle', 'active', 'ended'], 
      default: 'idle' 
    },
    recordingAssetId: { type: String, required: false },
    currentViewers: { type: [String], default: [] }, // Array of viewer IDs
    viewerCount: { type: Number, default: 0 }, // Current viewer count
  },
  { timestamps: true }
);

export default mongoose.models.Stream || mongoose.model<IStream>('Stream', StreamSchema);