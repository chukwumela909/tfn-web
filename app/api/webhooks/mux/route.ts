// Handle Mux webhooks for stream events
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import connectDB from '@/lib/mongodb';
import Stream from '@/models/stream';

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const signature = req.headers.get('mux-signature');

    // Verify webhook signature
    if (!verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);

    // Handle different event types
    switch (event.type) {
      case 'video.live_stream.active':
        // Stream went live
        await handleStreamActive(event.data);
        break;

      case 'video.live_stream.idle':
        // Stream went offline
        await handleStreamIdle(event.data);
        break;

      case 'video.asset.ready':
        // Recording is ready
        await handleAssetReady(event.data);
        break;

      case 'video.live_stream.created':
        // New stream created
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

function verifyWebhookSignature(body: string, signature: string | null): boolean {
  if (!signature) return false;

  const webhookSecret = process.env.MUX_WEBHOOK_SECRET!;
  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(body)
    .digest('hex');

  return signature === expectedSignature;
}

async function handleStreamActive(data: any) {
  try {
    await connectDB();
    
    const result = await Stream.findOneAndUpdate(
      { muxStreamId: data.id },
      { 
        status: 'active', 
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (result) {
      console.log('Stream went active:', data.id);
    } else {
      console.warn('Stream not found in database:', data.id);
    }
  } catch (error) {
    console.error('Error updating stream to active:', error);
  }
}

async function handleStreamIdle(data: any) {
  try {
    await connectDB();
    
    const result = await Stream.findOneAndUpdate(
      { muxStreamId: data.id },
      { 
        status: 'idle', 
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (result) {
      console.log('Stream went idle:', data.id);
    } else {
      console.warn('Stream not found in database:', data.id);
    }
  } catch (error) {
    console.error('Error updating stream to idle:', error);
  }
}

async function handleAssetReady(data: any) {
  try {
    await connectDB();
    
    const result = await Stream.findOneAndUpdate(
      { muxStreamId: data.live_stream_id },
      { 
        recordingAssetId: data.id,
        updatedAt: new Date() 
      },
      { new: true }
    );
    
    if (result) {
      console.log('Recording ready for stream:', data.live_stream_id, 'Asset ID:', data.id);
    } else {
      console.warn('Stream not found in database for recording:', data.live_stream_id);
    }
  } catch (error) {
    console.error('Error saving recording asset:', error);
  }
}