// Join stream as a viewer
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function POST(req: NextRequest) {
  try {
    const { muxStreamId, viewerId } = await req.json();

    console.log('Join request - muxStreamId:', muxStreamId, 'viewerId:', viewerId);

    if (!muxStreamId || !viewerId) {
      return NextResponse.json(
        { error: 'muxStreamId and viewerId are required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find stream and add viewer if not already in list
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

    // Add viewer to list if not already there
    if (!stream.currentViewers.includes(viewerId)) {
      stream.currentViewers.push(viewerId);
      stream.viewerCount = stream.currentViewers.length;
      await stream.save();
      console.log(`Viewer ${viewerId} joined. Total viewers: ${stream.viewerCount}`);
    } else {
      console.log(`Viewer ${viewerId} already in list`);
    }

    return NextResponse.json({ 
      success: true,
      viewerCount: stream.viewerCount
    });
  } catch (error) {
    console.error('Error joining stream:', error);
    return NextResponse.json(
      { error: 'Failed to join stream' },
      { status: 500 }
    );
  }
}
