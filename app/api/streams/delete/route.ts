// Delete/end a stream using POST method
import { NextRequest, NextResponse } from 'next/server';
import mux from '@/lib/mux';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function POST(req: NextRequest) {
  try {
    const { muxStreamId } = await req.json();
    
    console.log('DELETE request for stream ID:', muxStreamId);

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

    // Disable the live stream in Mux
    await mux.video.liveStreams.disable(stream.muxStreamId);

    // Delete stream from database
    await Stream.findByIdAndDelete(stream._id);

    console.log('Stream deleted successfully');

    return NextResponse.json({ 
      success: true,
      message: 'Livestream ended successfully'
    });
  } catch (error) {
    console.error('Error ending stream:', error);
    return NextResponse.json(
      { 
        error: 'Failed to end stream', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
