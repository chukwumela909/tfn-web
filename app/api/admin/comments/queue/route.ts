// GET /api/admin/comments/queue
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import CommentQueue from '@/models/commentQueue';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'pending';

    await connectDB();

    const queues = await CommentQueue.find({ status })
      .sort({ generatedAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      queues,
    });
  } catch (error) {
    console.error('Error fetching queues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch queues' },
      { status: 500 }
    );
  }
}
