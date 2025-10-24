// POST /api/comments/create
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Comment from '@/models/comment';

export async function POST(req: NextRequest) {
  try {
    const { streamId, userId, username, text } = await req.json();

    // Validate input
    if (!streamId || !userId || !username || !text) {
      return NextResponse.json(
        { error: 'streamId, userId, username, and text are required' },
        { status: 400 }
      );
    }

    // Validate text length
    if (text.trim().length === 0) {
      return NextResponse.json(
        { error: 'Comment text cannot be empty' },
        { status: 400 }
      );
    }

    if (text.length > 500) {
      return NextResponse.json(
        { error: 'Comment text cannot exceed 500 characters' },
        { status: 400 }
      );
    }

    await connectDB();

    // Drop problematic index if it exists (one-time fix)
    try {
      await Comment.collection.dropIndex('commentId_1');
      console.log('Dropped old commentId_1 index');
    } catch (indexError: any) {
      // Ignore if index doesn't exist
      if (indexError.code !== 27) { // 27 = IndexNotFound
        console.log('Index drop info:', indexError.message);
      }
    }

    // Create comment
    const comment = await Comment.create({
      streamId,
      userId,
      username,
      text: text.trim(),
    });

    return NextResponse.json({
      success: true,
      comment,
    });
  } catch (error) {
    console.error('Error creating comment:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}
