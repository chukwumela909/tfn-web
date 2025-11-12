// POST /api/admin/comments/post
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommentQueue from '@/models/commentQueue';
import Comment from '@/models/comment';

export async function POST(req: NextRequest) {
  try {
    const { queueId, commentIds } = await req.json();

    console.log('📤 Post request received:', { queueId, commentIds });

    if (!queueId) {
      return NextResponse.json(
        { error: 'queueId is required' },
        { status: 400 }
      );
    }

    await connectDB();
    console.log('✅ Connected to DB');

    // Drop problematic commentId index if it exists (one-time fix)
    try {
      await Comment.collection.dropIndex('commentId_1');
      console.log('✅ Dropped old commentId_1 index');
    } catch (indexError: any) {
      // Ignore if index doesn't exist
      if (indexError.code !== 27) { // 27 = IndexNotFound
        console.log('Index drop info:', indexError.message);
      }
    }

    // Get the queue
    const queue = await CommentQueue.findById(queueId);
    if (!queue) {
      console.error('❌ Queue not found:', queueId);
      return NextResponse.json(
        { error: 'Queue not found' },
        { status: 404 }
      );
    }

    console.log('✅ Queue found with', queue.comments.length, 'comments');

    // Determine which comments to post
    let commentsToPost = queue.comments;
    if (commentIds && Array.isArray(commentIds)) {
      commentsToPost = queue.comments.filter((c: any) =>
        commentIds.includes(c._id.toString())
      );
    }

    console.log('📝 Posting', commentsToPost.length, 'comments to stream:', queue.streamId);

    // Post all comments immediately without waiting
    const postedComments = [];
    for (let i = 0; i < commentsToPost.length; i++) {
      const queueComment = commentsToPost[i];
      try {
        const comment = await Comment.create({
          streamId: queue.streamId,
          userId: `ai_generated_${Date.now()}_${Math.random()}`,
          username: queueComment.username,
          text: queueComment.text,
        });
        postedComments.push(comment);
        console.log(`✅ Posted comment ${i + 1}/${commentsToPost.length}:`, queueComment.text.substring(0, 50));
      } catch (commentError) {
        console.error(`❌ Error posting comment ${i + 1}:`, commentError);
      }
    }

    // Update queue status
    queue.status = 'posted';
    await queue.save();
    console.log('✅ Queue status updated to posted');

    return NextResponse.json({
      success: true,
      posted: postedComments.length,
      comments: postedComments,
    });
  } catch (error) {
    console.error('❌ Error posting comments:', error);
    return NextResponse.json(
      { error: `Failed to post comments: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
