import mongoose, { Schema, Document } from 'mongoose';

export interface ICommentQueue extends Document {
  comments: {
    _id: mongoose.Types.ObjectId;
    username: string;
    text: string;
  }[];
  streamId: string;
  status: 'pending' | 'approved' | 'posted';
  generatedAt: Date;
  customPrompt?: string;
  batchSize: number;
}

const CommentQueueSchema = new Schema({
  comments: [
    {
      username: { type: String, required: true },
      text: { type: String, required: true },
    },
  ],
  streamId: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'approved', 'posted'],
    default: 'pending',
  },
  generatedAt: { type: Date, default: Date.now },
  customPrompt: { type: String },
  batchSize: { type: Number, required: true },
});

export default mongoose.models.CommentQueue ||
  mongoose.model<ICommentQueue>('CommentQueue', CommentQueueSchema);
