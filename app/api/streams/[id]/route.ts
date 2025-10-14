// Get stream details
import { NextRequest, NextResponse } from 'next/server';
import mux from '@/lib/mux';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get('id');

    if (!streamId) {
      return NextResponse.json(
        { error: 'Stream ID is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Get stream from database by muxStreamId
    const stream = await Stream.findOne({ muxStreamId: streamId });
    
    if (!stream) {
      return NextResponse.json(
        { error: 'Stream not found' },
        { status: 404 }
      );
    }

    const muxStreamId = stream.muxStreamId;

    // Get live stream status from Mux
    const muxStream = await mux.video.liveStreams.retrieve(muxStreamId);

    return NextResponse.json({
      stream: {
        // Your database fields
        _id: stream._id,
        title: stream.title,
        userId: stream.userId,
        muxStreamId: muxStream.id,
        muxPlaybackId: muxStream.playback_ids?.[0]?.id,
        status: muxStream.status,
        createdAt: stream.createdAt,
        updatedAt: stream.updatedAt,
      },
      muxData: {
        status: muxStream.status, // 'idle', 'active', 'disabled'
        streamKey: muxStream.stream_key,
        rtmpUrl: `rtmps://global-live.mux.com:443/app`,
      },
    });
  } catch (error) {
    console.error('Error fetching stream:', error);
    return NextResponse.json(
      { error: 'Stream not found' },
      { status: 404 }
    );
  }
}


