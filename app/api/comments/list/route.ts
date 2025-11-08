// GET /api/comments/list?streamId=xxx
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/comment';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get('streamId');

    if (!streamId) {
      return NextResponse.json(
        { error: 'streamId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Fetch the latest 200 comments for this stream
    // Sort by newest first, limit to 200, then reverse for chronological display
    const comments = await Comment.find({ streamId })
      .sort({ createdAt: -1 }) // Descending order (newest first)
      .limit(200) // Get the latest 200 comments
      .lean();

    // Reverse to show oldest to newest (chronological order for chat display)
    const chronologicalComments = comments.reverse();

    return NextResponse.json({
      success: true,
      comments: chronologicalComments,
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
