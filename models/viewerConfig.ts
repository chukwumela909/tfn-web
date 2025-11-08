import mongoose, { Schema, Document } from 'mongoose';

export interface IViewerConfig extends Document {
  streamId: string; // 'global' for site-wide or specific stream ID
  minViewers: number;
  maxViewers: number;
  variationSpeed: number; // milliseconds between updates (500-2000ms)
  isActive: boolean;
  updatedAt: Date;
  createdAt: Date;
}

const ViewerConfigSchema = new Schema<IViewerConfig>({
  streamId: {
    type: String,
    required: true,
    unique: true,
    default: 'global',
  },
  minViewers: {
    type: Number,
    required: true,
    default: 900000,
    min: 0,
  },
  maxViewers: {
    type: Number,
    required: true,
    default: 1000000,
    min: 0,
  },
  variationSpeed: {
    type: Number,
    default: 1000, // 1 second
    min: 500,
    max: 5000,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Ensure maxViewers is always greater than minViewers
ViewerConfigSchema.pre('save', function(next) {
  if (this.maxViewers <= this.minViewers) {
    next(new Error('maxViewers must be greater than minViewers'));
  } else {
    next();
  }
});

const ViewerConfig = mongoose.models.ViewerConfig || mongoose.model<IViewerConfig>('ViewerConfig', ViewerConfigSchema);

export default ViewerConfig;
