// Cleanup stale viewers
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function POST(req: NextRequest) {
  try {
    const { muxStreamId } = await req.json();

    if (!muxStreamId) {
      return NextResponse.json(
        { error: 'muxStreamId is required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find the site_visitors stream
    const stream = await Stream.findOne({ muxStreamId });
    
    if (!stream) {
      return NextResponse.json({ 
        success: true,
        viewerCount: 0,
        message: 'Stream not found'
      });
    }

    // For now, just return the current count
    // We'll implement proper timestamp-based cleanup later if needed
    return NextResponse.json({ 
      success: true,
      viewerCount: stream.viewerCount || 0
    });
  } catch (error) {
    console.error('Error cleaning up viewers:', error);
    return NextResponse.json(
      { error: 'Failed to cleanup viewers' },
      { status: 500 }
    );
  }
}
