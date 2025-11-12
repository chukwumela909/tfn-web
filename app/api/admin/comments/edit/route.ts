// PATCH /api/admin/comments/edit
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommentQueue from '@/models/commentQueue';

export async function PATCH(req: NextRequest) {
  try {
    const { queueId, commentId, newText } = await req.json();

    if (!queueId || !commentId || !newText) {
      return NextResponse.json(
        { error: 'queueId, commentId, and newText are required' },
        { status: 400 }
      );
    }

    if (newText.length > 500) {
      return NextResponse.json(
        { error: 'Comment text cannot exceed 500 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and update the comment in the queue
    const queue = await CommentQueue.findById(queueId);
    if (!queue) {
      return NextResponse.json(
        { error: 'Queue not found' },
        { status: 404 }
      );
    }

    const comment = queue.comments.find((c: any) => c._id.toString() === commentId);
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment not found in queue' },
        { status: 404 }
      );
    }

    comment.text = newText;
    await queue.save();

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Error editing comment:', error);
    return NextResponse.json(
      { error: 'Failed to edit comment' },
      { status: 500 }
    );
  }
}
