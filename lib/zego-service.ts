// lib/zego-service.ts
// Note: Dynamic import for client-side only usage to avoid SSR issues

export interface ZegoUser {
  userId: string;
  userName: string;
}

export interface ZegoRoom {
  roomId: string;
  roomName?: string;
}

export interface StreamConfig {
  video: boolean;
  audio: boolean;
  quality: 'low' | 'medium' | 'high';
  camera: 'front' | 'back';
}

export interface ZegoStreamInfo {
  streamId: string;
  userId: string;
  userName: string;
  isPublishing: boolean;
  quality: string;
}

export interface RTMPConfig {
  rtmpUrl: string;
  streamKey: string;
  bitrate?: number;
  resolution?: {
    width: number;
    height: number;
  };
}

export interface CDNConfig {
  url: string;
  authParam?: string;
  protocol?: 'rtmp' | 'http-flv' | 'hls';
}

export class ZegoService {
  private static instance: ZegoService;
  private zegoEngine: any = null; // Use any type to avoid SSR issues
  private currentRoom: ZegoRoom | null = null;
  private currentUser: ZegoUser | null = null;
  private isInitialized = false;
  private mediaStream: MediaStream | null = null;
  
  // Event listeners
  private onRoomStateUpdateCallback?: (roomId: string, state: string, errorCode: number) => void;
  private onPlayerStateUpdateCallback?: (streamId: string, state: string, errorCode: number) => void;
  private onPublisherStateUpdateCallback?: (streamId: string, state: string, errorCode: number) => void;
  private onStreamAddedCallback?: (streamId: string, userId: string) => void;
  private onStreamRemovedCallback?: (streamId: string, userId: string) => void;

  private constructor() {}

  public static getInstance(): ZegoService {
    if (!ZegoService.instance) {
      ZegoService.instance = new ZegoService();
    }
    return ZegoService.instance;
  }

  // Initialize Zego SDK
  public async initializeZego(): Promise<boolean> {
    try {
      // Only initialize on client side
      if (typeof window === 'undefined') {
        console.warn('Zego SDK requires browser environment');
        return false;
      }

      if (this.isInitialized) {
        console.log('Zego already initialized');
        return true;
      }

      // Dynamic imports to avoid SSR issues
      const { ZegoExpressEngine } = await import('zego-express-engine-webrtc');
      const { ZEGO_CONFIG } = await import('./zego-config-');

      // Create Zego Express Engine instance
      this.zegoEngine = new ZegoExpressEngine(
        ZEGO_CONFIG.appID,
        ZEGO_CONFIG.serverUrl
      );

      // Set up event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      console.log('Zego SDK initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Zego SDK:', error);
      return false;
    }
  }

  // Setup event listeners for Zego SDK
  private setupEventListeners(): void {
    if (!this.zegoEngine) return;

    // Room state updates
    this.zegoEngine.on('roomStateUpdate', (roomId: string, state: string, errorCode: number) => {
      console.log(`Room state update: ${roomId}, state: ${state}, error: ${errorCode}`);
      this.onRoomStateUpdateCallback?.(roomId, state, errorCode);
    });

    // Stream state updates
    this.zegoEngine.on('publisherStateUpdate', (streamId: string, state: string, errorCode: number) => {
      console.log(`Publisher state update: ${streamId}, state: ${state}, error: ${errorCode}`);
      this.onPublisherStateUpdateCallback?.(streamId, state, errorCode);
    });

    this.zegoEngine.on('playerStateUpdate', (streamId: string, state: string, errorCode: number) => {
      console.log(`Player state update: ${streamId}, state: ${state}, error: ${errorCode}`);
      this.onPlayerStateUpdateCallback?.(streamId, state, errorCode);
    });

    // Stream list updates
    this.zegoEngine.on('roomStreamUpdate', (roomId: string, updateType: string, streamList: any[]) => {
      console.log(`Stream update in room ${roomId}:`, updateType, streamList);
      
      streamList.forEach(stream => {
        if (updateType === 'ADD') {
          this.onStreamAddedCallback?.(stream.streamID, stream.user.userID);
        } else if (updateType === 'DELETE') {
          this.onStreamRemovedCallback?.(stream.streamID, stream.user.userID);
        }
      });
    });

    // Network quality updates
    this.zegoEngine.on('networkQuality', (userId: string, upstreamQuality: number, downstreamQuality: number) => {
      console.log(`Network quality for ${userId}: up=${upstreamQuality}, down=${downstreamQuality}`);
    });
  }

  // Login user to Zego (Note: Zego SDK v3.x uses loginRoom, not separate loginUser)
  public async loginUser(user: ZegoUser): Promise<boolean> {
    try {
      if (!this.zegoEngine) {
        throw new Error('Zego SDK not initialized');
      }

      // In Zego SDK v3.x, loginRoom is used instead of separate loginUser
      // We'll store the user info for later use when joining rooms
      this.currentUser = user;
      console.log(`User prepared for login: ${user.userName} (${user.userId})`);
      return true;
    } catch (error) {
      console.error('Failed to prepare user login:', error);
      return false;
    }
  }

  // Join room (Zego SDK v3.x uses loginRoom)
  public async joinRoom(room: ZegoRoom): Promise<boolean> {
    try {
      if (!this.zegoEngine || !this.currentUser) {
        throw new Error('Zego SDK not initialized or user not prepared');
      }

      // In Zego SDK v3.x, loginRoom is used for both authentication and room joining
      const roomConfig = {
        userID: this.currentUser.userId,
        userName: this.currentUser.userName,
        roomID: room.roomId,
      };

      await this.zegoEngine.loginRoom(roomConfig);
      this.currentRoom = room;
      console.log(`Joined room: ${room.roomId} as user: ${this.currentUser.userName}`);
      return true;
    } catch (error) {
      console.error('Failed to join room:', error);
      return false;
    }
  }

  // Leave room
  public async leaveRoom(): Promise<void> {
    try {
      if (!this.zegoEngine || !this.currentRoom) {
        return;
      }

      // Stop publishing if currently publishing
      await this.stopPublishing();

      // Stop all playing streams
      await this.stopAllPlaying();

      await this.zegoEngine.leaveRoom(this.currentRoom.roomId);
      this.currentRoom = null;
      console.log('Left room');
    } catch (error) {
      console.error('Failed to leave room:', error);
    }
  }

  // Start publishing stream (Host)
  public async startPublishing(streamId: string, config: StreamConfig = {
    video: true,
    audio: true,
    quality: 'high',
    camera: 'front'
  }): Promise<boolean> {
    try {
      if (!this.zegoEngine) {
        throw new Error('Zego SDK not initialized');
      }

      // Get user media
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        video: config.video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: config.camera === 'front' ? 'user' : 'environment'
        } : false,
        audio: config.audio
      });

      // Set video quality
      const publishConfig = {
        videoCodec: 'H264',
        audioBitrate: 48,
        videoBitrate: this.getVideoBitrate(config.quality),
        videoFrameRate: 30,
        videoWidth: 1280,
        videoHeight: 720,
      };

      await this.zegoEngine.startPublishing(streamId, this.mediaStream, publishConfig);
      console.log(`Started publishing stream: ${streamId}`);
      return true;
    } catch (error) {
      console.error('Failed to start publishing:', error);
      return false;
    }
  }

  // Stop publishing stream
  public async stopPublishing(): Promise<void> {
    try {
      if (!this.zegoEngine) return;

      await this.zegoEngine.stopPublishing();
      
      // Stop media stream
      if (this.mediaStream) {
        this.mediaStream.getTracks().forEach(track => track.stop());
        this.mediaStream = null;
      }
      
      console.log('Stopped publishing');
    } catch (error) {
      console.error('Failed to stop publishing:', error);
    }
  }

  // Start playing stream (Viewer)
  public async startPlaying(streamId: string, videoElement: HTMLVideoElement): Promise<boolean> {
    try {
      if (!this.zegoEngine) {
        throw new Error('Zego SDK not initialized');
      }

      const playConfig = {
        videoCodec: 'H264',
        resourceMode: 0, // CDN
      };

      const remoteStream = await this.zegoEngine.startPlaying(streamId, playConfig);
      
      if (remoteStream && videoElement) {
        videoElement.srcObject = remoteStream;
        videoElement.play();
      }

      console.log(`Started playing stream: ${streamId}`);
      return true;
    } catch (error) {
      console.error('Failed to start playing:', error);
      return false;
    }
  }

  // Stop playing stream
  public async stopPlaying(streamId: string): Promise<void> {
    try {
      if (!this.zegoEngine) return;

      await this.zegoEngine.stopPlaying(streamId);
      console.log(`Stopped playing stream: ${streamId}`);
    } catch (error) {
      console.error('Failed to stop playing:', error);
    }
  }

  // Stop all playing streams
  public async stopAllPlaying(): Promise<void> {
    try {
      if (!this.zegoEngine) return;

      await this.zegoEngine.stopAllPlaying();
      console.log('Stopped all playing streams');
    } catch (error) {
      console.error('Failed to stop all playing:', error);
    }
  }

  // Mute/unmute microphone
  public async muteMicrophone(mute: boolean): Promise<void> {
    try {
      if (!this.zegoEngine) return;

      await this.zegoEngine.muteMicrophone(mute);
      console.log(`Microphone ${mute ? 'muted' : 'unmuted'}`);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  }

  // Enable/disable camera
  public async enableCamera(enable: boolean): Promise<void> {
    try {
      if (!this.zegoEngine) return;

      await this.zegoEngine.enableCamera(enable);
      console.log(`Camera ${enable ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  }

  // Switch camera (front/back)
  public async switchCamera(): Promise<void> {
    try {
      if (!this.zegoEngine) return;

      await this.zegoEngine.switchCamera();
      console.log('Camera switched');
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  }

  // RTMP Streaming Methods
  
  // Start RTMP publishing to external CDN
  public async startRTMPPublishing(streamId: string, rtmpConfig: RTMPConfig): Promise<boolean> {
    try {
      if (!this.zegoEngine) {
        throw new Error('Zego SDK not initialized');
      }

      // Configure RTMP target
      const cdnConfig = {
        url: `${rtmpConfig.rtmpUrl}/${rtmpConfig.streamKey}`,
        authParam: rtmpConfig.streamKey,
        protocol: 'rtmp' as const
      };

      // Set video config for RTMP
      const videoConfig = {
        bitrate: rtmpConfig.bitrate || 1200,
        fps: 30,
        width: rtmpConfig.resolution?.width || 1280,
        height: rtmpConfig.resolution?.height || 720,
        codecID: 100 // H.264
      };

      // Start CDN publishing
      await this.zegoEngine.startCDNRelay([cdnConfig], streamId);
      await this.zegoEngine.setVideoConfig(videoConfig);
      
      console.log(`Started RTMP publishing to: ${rtmpConfig.rtmpUrl}`);
      return true;
    } catch (error) {
      console.error('Failed to start RTMP publishing:', error);
      return false;
    }
  }

  // Stop RTMP publishing
  public async stopRTMPPublishing(streamId: string): Promise<void> {
    try {
      if (!this.zegoEngine) return;

      await this.zegoEngine.stopCDNRelay(streamId);
      console.log('Stopped RTMP publishing');
    } catch (error) {
      console.error('Failed to stop RTMP publishing:', error);
    }
  }

  // Start mixed RTMP stream (for multiple participants)
  public async startMixedRTMPStream(taskId: string, rtmpConfig: RTMPConfig, inputStreams: string[]): Promise<boolean> {
    try {
      if (!this.zegoEngine) {
        throw new Error('Zego SDK not initialized');
      }

      // Configure mixing
      const mixConfig = {
        taskID: taskId,
        inputList: inputStreams.map((streamId, index) => ({
          streamID: streamId,
          contentType: 0, // Video
          layout: {
            x: index * 320,
            y: 0,
            width: 320,
            height: 240
          }
        })),
        outputList: [{
          target: `${rtmpConfig.rtmpUrl}/${rtmpConfig.streamKey}`
        }]
      };

      await this.zegoEngine.startMixerTask(mixConfig);
      console.log(`Started mixed RTMP stream with task ID: ${taskId}`);
      return true;
    } catch (error) {
      console.error('Failed to start mixed RTMP stream:', error);
      return false;
    }
  }

  // Stop mixed RTMP stream
  public async stopMixedRTMPStream(taskId: string): Promise<void> {
    try {
      if (!this.zegoEngine) return;

      await this.zegoEngine.stopMixerTask(taskId);
      console.log(`Stopped mixed RTMP stream: ${taskId}`);
    } catch (error) {
      console.error('Failed to stop mixed RTMP stream:', error);
    }
  }

  // Get video bitrate based on quality
  private getVideoBitrate(quality: string): number {
    switch (quality) {
      case 'low': return 500;
      case 'medium': return 1000;
      case 'high': return 2000;
      default: return 1000;
    }
  }

  // Event listener setters (for React components to subscribe)
  public setOnRoomStateUpdate(callback: (roomId: string, state: string, errorCode: number) => void): void {
    this.onRoomStateUpdateCallback = callback;
  }

  public setOnPlayerStateUpdate(callback: (streamId: string, state: string, errorCode: number) => void): void {
    this.onPlayerStateUpdateCallback = callback;
  }

  public setOnPublisherStateUpdate(callback: (streamId: string, state: string, errorCode: number) => void): void {
    this.onPublisherStateUpdateCallback = callback;
  }

  public setOnStreamAdded(callback: (streamId: string, userId: string) => void): void {
    this.onStreamAddedCallback = callback;
  }

  public setOnStreamRemoved(callback: (streamId: string, userId: string) => void): void {
    this.onStreamRemovedCallback = callback;
  }

  // Get current state
  public getCurrentUser(): ZegoUser | null {
    return this.currentUser;
  }

  public getCurrentRoom(): ZegoRoom | null {
    return this.currentRoom;
  }

  public isEngineInitialized(): boolean {
    return this.isInitialized && this.zegoEngine !== null;
  }

  // Cleanup
  public async destroy(): Promise<void> {
    try {
      await this.leaveRoom();
      
      if (this.currentUser && this.zegoEngine) {
        await this.zegoEngine.logoutUser();
      }

      if (this.zegoEngine) {
        this.zegoEngine.destroy();
        this.zegoEngine = null;
      }

      this.isInitialized = false;
      this.currentUser = null;
      this.currentRoom = null;
      
      console.log('Zego service destroyed');
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Export singleton instance
export const zegoService = ZegoService.getInstance();
