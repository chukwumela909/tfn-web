// Get stream details using query parameters
import { NextRequest, NextResponse } from 'next/server';
import mux from '@/lib/mux';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const muxStreamId = searchParams.get('muxStreamId');

    console.log('GET stream request for muxStreamId:', muxStreamId);

    if (!muxStreamId) {
      return NextResponse.json(
        { error: 'muxStreamId is required' },
        { status: 400 }
      );
    }

    // Connect to MongoDB
    await connectDB();

    // Get stream from database by muxStreamId
    const stream = await Stream.findOne({ muxStreamId });
    
    console.log('Found stream in database:', stream);
    
    if (!stream) {
      // Try to find all streams to debug
      const allStreams = await Stream.find({}).select('muxStreamId title').limit(10);
      console.log('Available streams in database:', allStreams);
      
      return NextResponse.json(
        { 
          error: 'Stream not found',
          debug: {
            searchedFor: muxStreamId,
            availableStreams: allStreams.map(s => ({ muxStreamId: s.muxStreamId, title: s.title }))
          }
        },
        { status: 404 }
      );
    }

    // Try to get live stream status from Mux
    try {
      const muxStream = await mux.video.liveStreams.retrieve(muxStreamId);
      
      return NextResponse.json({
        stream: {
          _id: stream._id,
          title: stream.title,
          userId: stream.userId,
          muxStreamId: stream.muxStreamId,
          muxPlaybackId: stream.muxPlaybackId,
          rtmpUrl: stream.rtmpUrl,
          streamKey: stream.streamKey,
          status: muxStream.status, // Get real-time status from Mux
          createdAt: stream.createdAt,
          updatedAt: stream.updatedAt,
          recordingAssetId: stream.recordingAssetId,
        },
        muxData: {
          status: muxStream.status, // 'idle', 'active', 'disabled'
          streamKey: muxStream.stream_key,
          rtmpUrl: `rtmps://global-live.mux.com:443/app`,
        },
      });
    } catch (muxError) {
      console.warn('Failed to fetch from Mux, using database status:', muxError);
      
      // Fallback to database data if Mux API fails
      return NextResponse.json({
        stream: {
          _id: stream._id,
          title: stream.title,
          userId: stream.userId,
          muxStreamId: stream.muxStreamId,
          muxPlaybackId: stream.muxPlaybackId,
          rtmpUrl: stream.rtmpUrl,
          streamKey: stream.streamKey,
          status: stream.status, // Use database status as fallback
          createdAt: stream.createdAt,
          updatedAt: stream.updatedAt,
          recordingAssetId: stream.recordingAssetId,
        },
      });
    }
  } catch (error) {
    console.error('Error fetching stream:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch stream', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
