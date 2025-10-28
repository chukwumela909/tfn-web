// Leave stream as a viewer
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function POST(req: NextRequest) {
  try {
    const { muxStreamId, viewerId } = await req.json();

    console.log('Leave request - muxStreamId:', muxStreamId, 'viewerId:', viewerId);

    if (!muxStreamId || !viewerId) {
      return NextResponse.json(
        { error: 'muxStreamId and viewerId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find stream and remove viewer
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
      stream.viewerCount = 0;
    }

    // Initialize viewerHeartbeats map if it doesn't exist
    if (!stream.viewerHeartbeats) {
      stream.viewerHeartbeats = new Map();
    }

    // Remove viewer from list
    const index = stream.currentViewers.indexOf(viewerId);
    if (index > -1) {
      stream.currentViewers.splice(index, 1);
      stream.viewerHeartbeats.delete(viewerId); // Remove from heartbeats map
      stream.viewerCount = stream.currentViewers.length;
      stream.markModified('viewerHeartbeats'); // Mark map as modified for Mongoose
      await stream.save();
      console.log(`Viewer ${viewerId} left. Total viewers: ${stream.viewerCount}`);
    } else {
      console.log(`Viewer ${viewerId} not in list`);
    }

    return NextResponse.json({ 
      success: true,
      viewerCount: stream.viewerCount
    });
  } catch (error) {
    console.error('Error leaving stream:', error);
    return NextResponse.json(
      { error: 'Failed to leave stream' },
      { status: 500 }
    );
  }
}
