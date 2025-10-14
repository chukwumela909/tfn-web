
// types/stream.ts
// TypeScript types for streams
export interface Stream {
  id: string;
  title: string;
  userId: string;
  muxStreamId: string;
  muxPlaybackId: string;
  rtmpUrl: string;
  streamKey: string;
  status: 'idle' | 'active' | 'ended';
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStreamRequest {
  title: string;
  userId: string;
}

export interface CreateStreamResponse {
  stream: Stream;
  rtmpIngestUrl: string;
}