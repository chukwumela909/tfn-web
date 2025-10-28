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

    // Find stream or create 'site_visitors' document if it doesn't exist
    let stream = await Stream.findOne({ muxStreamId });
    
    if (!stream) {
      // If it's the 'site_visitors' identifier, create it
      if (muxStreamId === 'site_visitors') {
        console.log('Creating site_visitors document in heartbeat...');
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
        console.log('site_visitors document created in heartbeat');
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

    // Clean up stale viewers (no heartbeat in last 30 seconds)
    const now = new Date();
    const staleThreshold = 30000; // 30 seconds
    const activeViewers: string[] = [];
    
    for (const [viewerId, lastHeartbeat] of stream.viewerHeartbeats.entries()) {
      const timeSinceHeartbeat = now.getTime() - new Date(lastHeartbeat).getTime();
      if (timeSinceHeartbeat < staleThreshold) {
        activeViewers.push(viewerId);
      } else {
        console.log(`Removing stale viewer: ${viewerId} (inactive for ${Math.round(timeSinceHeartbeat / 1000)}s)`);
      }
    }

    // Update the current heartbeat for this viewer
    stream.viewerHeartbeats.set(viewerId, now);
    
    // Add current viewer if not in active list
    if (!activeViewers.includes(viewerId)) {
      activeViewers.push(viewerId);
    }

    // Update the viewers list and count
    stream.currentViewers = activeViewers;
    stream.viewerCount = activeViewers.length;
    stream.markModified('viewerHeartbeats'); // Mark map as modified for Mongoose
    await stream.save();
    
    console.log(`Heartbeat from ${viewerId}. Active viewers: ${stream.viewerCount}`);

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
