// Heartbeat to keep viewer active
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function POST(req: NextRequest) {
  try {
    const { muxStreamId, viewerId } = await req.json();

    if (!muxStreamId || !viewerId) {
      return NextResponse.json(
        { error: 'muxStreamId and viewerId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find stream
    const stream = await Stream.findOne({ muxStreamId });
    
    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    // Initialize currentViewers array if it doesn't exist
    if (!stream.currentViewers) {
      stream.currentViewers = [];
    }

    // Ensure viewer is in the list (heartbeat also acts as join)
    if (!stream.currentViewers.includes(viewerId)) {
      stream.currentViewers.push(viewerId);
      stream.viewerCount = stream.currentViewers.length;
      await stream.save();
      console.log(`Heartbeat: Viewer ${viewerId} added. Total viewers: ${stream.viewerCount}`);
    }

    return NextResponse.json({ 
      success: true,
      viewerCount: stream.viewerCount
    });
  } catch (error) {
    console.error('Error processing heartbeat:', error);
    return NextResponse.json(
      { error: 'Failed to process heartbeat' },
      { status: 500 }
    );
  }
}
