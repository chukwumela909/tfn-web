// GET /api/comments/list?streamId=xxx
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/comment';
import ViewerConfig from '@/models/viewerConfig';

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

    // Check if simulated comments are active
    const config = await ViewerConfig.findOne({ streamId: 'global' });
    const commentsActive = config ? config.commentsActive : true;

    // Build query filter
    const queryFilter: any = { streamId };
    
    // If simulated comments are disabled, filter them out (only show real user comments)
    if (!commentsActive) {
      // Simulated comments have userId starting with "simulated_"
      queryFilter.userId = { $not: /^simulated_/ };
    }

    // Fetch the latest 200 comments for this stream
    // Sort by newest first, limit to 200, then reverse for chronological display
    const comments = await Comment.find(queryFilter)
      .sort({ createdAt: -1 }) // Descending order (newest first)
      .limit(200) // Get the latest 200 comments
      .lean();

    // Reverse to show oldest to newest (chronological order for chat display)
    const chronologicalComments = comments.reverse();

    return NextResponse.json({
      success: true,
      comments: chronologicalComments,
      commentsActive, // Let the frontend know if simulated comments are active
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}
