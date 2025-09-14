// lib/models/livestream.ts
export interface LiveStream {
  _id: string;
  liveId: string;
  hostId: string;
  hostChannel: string;
  channelImage: string;
  viewCount: number;
  isActive: boolean;
  streamType: string;
}

export interface UserData {
  channelName: string;
  channelImage: string;
  email: string;
}

export interface CreateStreamResponse {
  success: boolean;
  data?: any;
  liveId?: string;
  streamType?: string;
  message?: string;
  error?: string;
  rtmpUrl?: string;
  streamKey?: string;
  livedata?: any;
}

export interface StreamResponse {
  success: boolean;
  data?: any;
  message?: string;
  error?: string;
  viewCount?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  livestream?: LiveStream;
  livestreams?: LiveStream[];
  liveId?: string;
  streamType?: string;
  rtmpUrl?: string;
  streamKey?: string;
  livedata?: any;
  viewCount?: number;
}

export interface LivestreamPreferences {
  preferredQuality: string;
  enableNotifications: boolean;
  autoJoinMode: boolean;
}
