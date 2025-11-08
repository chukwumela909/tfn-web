// GET and POST /api/admin/viewer-config
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ViewerConfig from '@/models/viewerConfig';

// GET - Fetch current viewer config
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get('streamId') || 'global';

    await connectDB();

    let config = await ViewerConfig.findOne({ streamId });

    // Create default config if none exists
    if (!config) {
      config = await ViewerConfig.create({
        streamId,
        minViewers: 900000,
        maxViewers: 1000000,
        variationSpeed: 1000,
        isActive: true,
      });
    }

    return NextResponse.json({
      success: true,
      config,
    });
  } catch (error) {
    console.error('Error fetching viewer config:', error);
    return NextResponse.json(
      { error: 'Failed to fetch viewer config' },
      { status: 500 }
    );
  }
}

// POST - Update viewer config
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { streamId = 'global', minViewers, maxViewers, variationSpeed, isActive } = body;

    // Validation
    if (minViewers !== undefined && minViewers < 0) {
      return NextResponse.json(
        { error: 'minViewers must be >= 0' },
        { status: 400 }
      );
    }

    if (maxViewers !== undefined && maxViewers < 0) {
      return NextResponse.json(
        { error: 'maxViewers must be >= 0' },
        { status: 400 }
      );
    }

    if (minViewers !== undefined && maxViewers !== undefined && maxViewers <= minViewers) {
      return NextResponse.json(
        { error: 'maxViewers must be greater than minViewers' },
        { status: 400 }
      );
    }

    await connectDB();

    // Update or create config
    const config = await ViewerConfig.findOneAndUpdate(
      { streamId },
      {
        streamId,
        ...(minViewers !== undefined && { minViewers }),
        ...(maxViewers !== undefined && { maxViewers }),
        ...(variationSpeed !== undefined && { variationSpeed }),
        ...(isActive !== undefined && { isActive }),
      },
      { new: true, upsert: true }
    );

    console.log(`✅ Viewer config updated: ${minViewers}-${maxViewers} viewers`);

    return NextResponse.json({
      success: true,
      config,
      message: 'Viewer configuration updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating viewer config:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update viewer config' },
      { status: 500 }
    );
  }
}
