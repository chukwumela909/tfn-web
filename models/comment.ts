import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  streamId: string; // muxStreamId
  userId: string;
  username: string;
  text: string;
  createdAt: Date;
}

const CommentSchema = new Schema<IComment>({
  streamId: {
    type: String,
    required: true,
    index: true, // Index for faster queries
  },
  userId: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
    maxlength: 500, // Limit comment length
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true, // Index for sorting
  },
});

// Create indexes for efficient queries
CommentSchema.index({ streamId: 1, createdAt: -1 });

const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;
