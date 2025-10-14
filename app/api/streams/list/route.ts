// app/api/streams/list/route.ts
// List all streams (with optional filters)
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');

    // Connect to MongoDB
    await connectDB();

    // Build query filters
    const query: any = {};
    if (userId) query.userId = userId;
    if (status) {
      query.status = status;
    } else {
      // By default, fetch only active and idle streams (exclude ended streams)
      query.status = { $in: ['active', 'idle'] };
    }

    // Query database with filters
    const streams = await Stream.find(query)
      .sort({ createdAt: -1 }) // Sort by newest first
      .lean(); // Convert to plain JavaScript objects

    return NextResponse.json({ streams });
  } catch (error) {
    console.error('Error listing streams:', error);
    return NextResponse.json(
      { error: 'Failed to list streams' },
      { status: 500 }
    );
  }
}