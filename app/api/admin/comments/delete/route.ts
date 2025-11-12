// DELETE /api/admin/comments/delete
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommentQueue from '@/models/commentQueue';

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queueId = searchParams.get('queueId');
    const commentId = searchParams.get('commentId');

    if (!queueId) {
      return NextResponse.json(
        { error: 'queueId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    if (commentId) {
      // Delete a specific comment from the queue
      const queue = await CommentQueue.findById(queueId);
      if (!queue) {
        return NextResponse.json(
          { error: 'Queue not found' },
          { status: 404 }
        );
      }

      queue.comments = queue.comments.filter(
        (c: any) => c._id.toString() !== commentId
      );
      await queue.save();

      return NextResponse.json({
        success: true,
        message: 'Comment deleted from queue',
        remainingCount: queue.comments.length,
      });
    } else {
      // Delete entire queue
      await CommentQueue.findByIdAndDelete(queueId);

      return NextResponse.json({
        success: true,
        message: 'Queue deleted',
      });
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
