// Create a new live stream
import { NextRequest, NextResponse } from 'next/server';
import mux from '@/lib/mux';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function POST(req: NextRequest) {
  try {
    const { title, userId } = await req.json();

    if (!title || !userId) {
      return NextResponse.json(
        { error: 'Title and userId are required' },
        { status: 400 }
      );
    }

      // Connect to MongoDB
    await connectDB();

    // Create Mux live stream
    const muxStream = await mux.video.liveStreams.create({
      playback_policy: ['public'],
      new_asset_settings: {
        playback_policy: ['public'], // Save recordings
      },
      reconnect_window: 60, // Allow reconnection within 60 seconds
      latency_mode: 'low', // Options: 'low', 'standard'
    });

    // In production, save this to your database
    // const stream = {
    //   id: generateId(), // Use your ID generation method
    //   title,
    //   userId,
    //   muxStreamId: muxStream.id,
    //   muxPlaybackId: muxStream.playback_ids?.[0]?.id || '',
    //   rtmpUrl: muxStream.stream_key ? `rtmps://global-live.mux.com:443/app` : '',
    //   streamKey: muxStream.stream_key || '',
    //   status: 'idle' as const,
    //   createdAt: new Date(),
    //   updatedAt: new Date(),
    // };

       // Save stream to MongoDB
    const stream = await Stream.create({
      title,
      userId,
      muxStreamId: muxStream.id,
      muxPlaybackId: muxStream.playback_ids?.[0]?.id || '',
      rtmpUrl: `rtmps://global-live.mux.com:443/app`,
      streamKey: muxStream.stream_key || '',
      status: 'idle',
      currentViewers: [],
      viewerCount: 0,
    });

    // TODO: Save stream to database
    // await db.stream.create({ data: stream });

    return NextResponse.json({
      stream,
      rtmpIngestUrl: `rtmps://global-live.mux.com:443/app/${stream.streamKey}`,
    });
  } catch (error) {
    console.error('Error creating stream:', error);
    return NextResponse.json(
      { error: 'Failed to create stream' },
      { status: 500 }
    );
  }
}

// Helper function - replace with your own
function generateId() {
  return `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}