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

    // Find stream or create 'site_visitors' document if it doesn't exist
    let stream = await Stream.findOne({ muxStreamId });
    
    if (!stream) {
      // If it's the 'site_visitors' identifier, create it
      if (muxStreamId === 'site_visitors') {
        console.log('Creating site_visitors document...');
        stream = await Stream.create({
          muxStreamId: 'site_visitors',
          title: 'Site Visitors Tracker',
          userId: 'system',
          muxPlaybackId: 'n/a',
          rtmpUrl: 'n/a',
          streamKey: 'n/a',
          status: 'active',
          currentViewers: [],
          viewerCount: 0,
        });
        console.log('site_visitors document created');
      } else {
        return NextResponse.json(
          { error: 'Stream not found' },
          { status: 404 }
        );
      }
    }

    // Initialize currentViewers array if it doesn't exist
    if (!stream.currentViewers) {
      stream.currentViewers = [];
    }

    // Initialize viewerHeartbeats map if it doesn't exist
    if (!stream.viewerHeartbeats) {
      stream.viewerHeartbeats = new Map();
    }

    // Record heartbeat timestamp for this viewer
    stream.viewerHeartbeats.set(viewerId, new Date());
    
    // Add viewer to list if not already there
    if (!stream.currentViewers.includes(viewerId)) {
      stream.currentViewers.push(viewerId);
      stream.viewerCount = stream.currentViewers.length;
      stream.markModified('viewerHeartbeats'); // Mark map as modified for Mongoose
      await stream.save();
      console.log(`Viewer ${viewerId} joined. Total viewers: ${stream.viewerCount}`);
    } else {
      stream.markModified('viewerHeartbeats');
      await stream.save();
      console.log(`Viewer ${viewerId} already in list, updated heartbeat`);
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
