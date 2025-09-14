// lib/livestream-service.ts
import { ApiService } from './api-service';
import { LiveStream, CreateStreamResponse, StreamResponse, } from './models/livestream';

export class LivestreamService {
  private static storage = {
    get: (key: string) => localStorage.getItem(key),
    set: (key: string, value: string) => localStorage.setItem(key, value),
    remove: (key: string) => localStorage.removeItem(key),
  };

  // Fetch all active live streams
  static async fetchAllLiveStreams(): Promise<LiveStream[]> {
    try {
      const data = await ApiService.fetchAllLiveStreams();
      const streams: LiveStream[] = Array.isArray(data) ? data : [];
      return streams.filter((stream: LiveStream) => stream.isActive);
    } catch (error) {
      console.error('Failed to fetch live streams:', error);
      return [];
    }
  }

  // Fetch live streams by type (rtmp or normal)
  static async fetchLiveStreamsByType(streamType: string): Promise<LiveStream[]> {
    try {
      const streams = await ApiService.fetchLiveStreamsByType(streamType);
      return streams.filter((stream: LiveStream) => stream.isActive);
    } catch (error) {
      console.error('Failed to fetch live streams by type:', error);
      return [];
    }
  }

  // Create a new live stream
  static async createLiveStream(streamType: string = 'rtmp'): Promise<CreateStreamResponse> {
    try {
      const userId = this.storage.get('auth_token') ||
                     `user_${Date.now()}`;

      const response = await ApiService.createLiveStream({
        userId,
        streamType,
      });

      if (response.liveId) {
        // Store livestream info for later use
        this.storage.set('current_live_id', response.liveId);

        const result: CreateStreamResponse = {
          success: true,
          data: response,
          liveId: response.liveId,
          streamType: response.streamType || streamType,
          message: response.message || 'Live stream created successfully',
        };

        // Handle RTMP-specific data
        if (streamType === 'rtmp' && response.livedata) {
          const livedata = response.livedata;
          result.rtmpUrl = livedata.rtmpUrl || '';
          result.streamKey = livedata.streamKey || 'rtc01';
          result.livedata = livedata;
        }

        // Handle normal stream data
        if (streamType === 'normal') {
          result.streamKey = 'rtc01';
        }

        return result;
      } else {
        return {
          success: false,
          error: response.message || 'Failed to create live stream',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
      };
    }
  }

  // End a live stream
  static async endLiveStream(liveId: string): Promise<StreamResponse> {
    try {
      const userId = this.storage.get('auth_token');

      const response = await ApiService.endLiveStream(liveId, userId || '');

      if (response.success) {
        // Clear stored livestream info
        this.storage.remove('current_live_id');

        return {
          success: true,
          message: 'Live stream ended successfully',
        };
      } else {
        return {
          success: false,
          error: response.message || 'Failed to end live stream',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
      };
    }
  }

  // Get live stream details by ID
//   static async getLiveStreamDetails(liveId: string): Promise<StreamResponse> {
//     try {
//       const response = await ApiService.getLiveStreamDetails(liveId);

//       return {
//         success: true,
//         data: response,
//       };
//     } catch (error) {
//       return {
//         success: false,
//         error: `Network error: ${error}`,
//       };
//     }
//   }

  // Get user data for livestream
  static getUserData(): { userId: string; userName: string } {
    const userId = this.storage.get('auth_token') ||
                   `user_${Date.now()}`;
    const userName = this.storage.get('user_name') ||
                     `User${Date.now()}`;

    return {
      userId,
      userName,
    };
  }

  // Save user livestream preferences
  static saveUserPreferences(preferences: {
    preferredQuality?: string;
    enableNotifications?: boolean;
    autoJoinMode?: boolean;
  }): void {
    if (preferences.preferredQuality) {
      this.storage.set('live_quality_preference', preferences.preferredQuality);
    }
    if (preferences.enableNotifications !== undefined) {
      this.storage.set('live_notifications', preferences.enableNotifications.toString());
    }
    if (preferences.autoJoinMode !== undefined) {
      this.storage.set('auto_join_mode', preferences.autoJoinMode.toString());
    }
  }

  // Get user livestream preferences
  static getUserPreferences(): {
    preferredQuality: string;
    enableNotifications: boolean;
    autoJoinMode: boolean;
  } {
    const quality = this.storage.get('live_quality_preference') || 'auto';
    const notifications = this.storage.get('live_notifications') !== 'false';
    const autoJoin = this.storage.get('auto_join_mode') === 'true';

    return {
      preferredQuality: quality,
      enableNotifications: notifications,
      autoJoinMode: autoJoin,
    };
  }

  // Check if user is currently live
  static async isUserCurrentlyLive(): Promise<boolean> {
    const currentLiveId = this.storage.get('current_live_id');
    if (!currentLiveId) return false;

    const result = await this.getLiveStreamDetails(currentLiveId);
    return result.success;
  }

  // Get current live session info
  static getCurrentLiveId(): string | null {
    return this.storage.get('current_live_id');
  }

  // Validate live ID format
  static isValidLiveId(liveId: string): boolean {
    return liveId.length >= 3 && liveId.trim() !== '';
  }

  // Create RTMP ingress
//   static async createRtmpIngress(data: RtmpIngressData): Promise<StreamResponse> {
//     try {
//       const response = await ApiService.createRtmpIngress(data);

//       if (response.success) {
//         return {
//           success: true,
//           data: response.data,
//         };
//       } else {
//         return {
//           success: false,
//           error: 'Failed to create RTMP ingress',
//         };
//       }
//     } catch (error) {
//       return {
//         success: false,
//         error: `Network error: ${error}`,
//       };
//     }
//   }

  // Join a livestream
  static async joinLivestream(liveId: string): Promise<StreamResponse> {
    try {
      const userId = this.storage.get('auth_token') ||
                     `user_${Date.now()}`;

      const response = await ApiService.joinLivestream(liveId, userId);

      return {
        success: true,
        data: response,
        viewCount: response.viewCount || 0,
        message: response.message || 'Successfully joined livestream',
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
      };
    }
  }

  // Leave a livestream
  static async leaveLivestream(liveId: string): Promise<StreamResponse> {
    try {
      const userId = this.storage.get('auth_token') ||
                     `user_${Date.now()}`;

      const response = await ApiService.leaveLivestream(liveId, userId);

      return {
        success: true,
        data: response,
        viewCount: response.viewCount || 0,
        message: response.message || 'Successfully left livestream',
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
      };
    }
  }

  // Get user's active stream
  static async getUserActiveStream(userId: string): Promise<StreamResponse> {
    try {
      const response = await ApiService.getUserActiveStream(userId);

      return {
        success: true,
        data: response,
        message: response.message || 'Active stream retrieved successfully',
      };
    } catch (error) {
      return {
        success: false,
        error: `Network error: ${error}`,
      };
    }
  }

  // Helper method to generate Zego room ID from stream data
  static generateZegoRoomId(liveId: string | number): string {
    return `room_${liveId}`;
  }

  // Helper method to generate Zego stream ID for publishing
  static generateZegoStreamId(liveId: string | number, userId: string): string {
    return `stream_${liveId}_${userId}`;
  }

  // Get stream info formatted for Zego integration
  static getZegoStreamInfo(streamData: any, userData: any) {
    return {
      roomId: this.generateZegoRoomId(streamData.liveId || streamData.id),
      streamId: this.generateZegoStreamId(streamData.liveId || streamData.id, userData.userId),
      userId: userData.userId.toString(),
      userName: userData.userName || `User${userData.userId}`,
      streamType: streamData.streamType || 'normal',
    };
  }
}
