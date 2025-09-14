import { NextRequest, NextResponse } from 'next/server';
import { generateToken04 } from '../../../lib/zegoServerAssistant';

export const runtime = 'nodejs';

// Generate Token04 using the provided assistant
async function generateZegoToken(appId: number, serverSecret: string, userId: string, roomId: string) {
  const effectiveTime = 7200; // seconds
  const payload: any = {
    privilege: { 1: 1, 2: 1 },
    stream_id_list: ["rtc01"],
  };
  if (roomId) payload.room_id = roomId;
  const token = generateToken04(appId, userId, serverSecret, effectiveTime, JSON.stringify(payload));
  console.log('Generated token:', token);
  const expire = Math.floor(Date.now() / 1000) + effectiveTime;
  return { token, expire };
}

function getEnv() {
  const appId = parseInt(process.env.NEXT_PUBLIC_ZEGO_APP_ID || '0', 10);
  const serverSecret = process.env.ZEGO_SERVER_SECRET || '';
  return { appId, serverSecret };
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userID = url.searchParams.get('userID') || url.searchParams.get('userId');
  const roomId = url.searchParams.get('roomID') || url.searchParams.get('roomId');

  if (!userID || !roomId) {
    return NextResponse.json({ token: '', error: 'userID and roomId required' }, { status: 400 });
  }

  const { appId, serverSecret } = getEnv();
  if (!appId || !serverSecret) {
    return NextResponse.json({ token: '', error: 'Server misconfigured (appId/secret)' }, { status: 500 });
  }

  try {
    const { token, expire } = await generateZegoToken(appId, serverSecret, userID, roomId);
    return NextResponse.json({ token, expire });
  } catch (e) {
    return NextResponse.json({ token: '', error: 'Token generation failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const userID = body?.userID || body?.userId;
  const roomId = body?.roomID || body?.roomId;

  if (!userID || !roomId) {
    return NextResponse.json({ token: '', error: 'userID and roomId required' }, { status: 400 });
  }

  const { appId, serverSecret } = getEnv();
  if (!appId || !serverSecret) {
    return NextResponse.json({ token: '', error: 'Server misconfigured (appId/secret)' }, { status: 500 });
  }

  try {
    const { token, expire } = await generateZegoToken(appId, serverSecret, userID, roomId);
    return NextResponse.json({ token, expire });
  } catch (e) {
    return NextResponse.json({ token: '', error: 'Token generation failed' }, { status: 500 });
  }
}