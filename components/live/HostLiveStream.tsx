'use client';

import { useRef, useEffect, useState } from 'react';
import { LivestreamService } from '../../lib/livestream-service';
import { ZegoService } from '../../lib/zego-service';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useRouter } from 'next/navigation';

interface HostLiveStreamProps {
  onStreamEnd?: () => void;
}

export default function HostLiveStream({ onStreamEnd }: HostLiveStreamProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [zegoInitialized, setZegoInitialized] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [streamQuality, setStreamQuality] = useState<'low' | 'medium' | 'high'>('high');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Initialize Zego SDK and check for existing stream
    initializeZegoAndCheck();
  }, []);

  const initializeZegoAndCheck = async () => {
    try {
      // Initialize Zego SDK
      const zegoService = ZegoService.getInstance();
      const initialized = await zegoService.initializeZego();
      setZegoInitialized(initialized);

      if (initialized) {
        console.log('Zego SDK initialized successfully');
        
        // Set up connection status listeners
        const zegoService = ZegoService.getInstance();
        zegoService.setOnRoomStateUpdate((roomId: string, state: string, errorCode: number) => {
          console.log(`Room state update: ${state}, error: ${errorCode}`);
          if (state === 'CONNECTED') {
            setConnectionStatus('connected');
          } else if (state === 'DISCONNECTED') {
            setConnectionStatus('disconnected');
          }
        });

        zegoService.setOnPublisherStateUpdate((streamId: string, state: string, errorCode: number) => {
          console.log(`Publisher state update: ${state}, error: ${errorCode}`);
          if (state === 'PUBLISHING') {
            setConnectionStatus('streaming');
          } else if (errorCode !== 0) {
            setError(`Streaming error: ${errorCode}`);
          }
        });
      } else {
        console.warn('Zego SDK failed to initialize');
        setError('Failed to initialize streaming service');
      }

      // Check for existing active stream
      await checkForActiveStream();
    } catch (error) {
      console.error('Failed to initialize Zego or check stream:', error);
      setError('Failed to initialize streaming service');
    }
  };

  const checkForActiveStream = async () => {
    try {
      const userData = LivestreamService.getUserData();
      const result = await LivestreamService.getUserActiveStream(userData.userId);

      if (result.success && result.data?.livestream) {
        const livestream = result.data.livestream;
        router.push(`/live/${livestream.liveId}`);
      }
    } catch (error) {
      console.error('Failed to check active stream:', error);
    }
  };

  const startStream = async () => {
    setIsLoading(true);
    setError('');

    try {
      // First create the livestream on the backend
      const result = await LivestreamService.createLiveStream('normal');

      if (result.success) {
        setStreamData(result);

        // Initialize Zego streaming
        const zegoService = ZegoService.getInstance();
        const userData = LivestreamService.getUserData();
        const zegoInfo = LivestreamService.getZegoStreamInfo(result, userData);

        // Login to Zego with user credentials
        const loginSuccess = await zegoService.loginUser({
          userId: zegoInfo.userId,
          userName: zegoInfo.userName
        });

        if (loginSuccess) {
          // Join the room using the livestream ID
          const roomJoined = await zegoService.joinRoom({
            roomId: zegoInfo.roomId,
          });

          if (roomJoined) {
            // Start publishing the stream with camera and mic
            const publishSuccess = await zegoService.startPublishing(
              zegoInfo.streamId,
              { video: true, audio: true, quality: 'high', camera: 'front' }
            );

            if (publishSuccess) {
              setIsStreaming(true);
              console.log('Successfully started Zego stream publishing');

              // Get local video element for preview
              if (videoRef.current) {
                const localStream = await navigator.mediaDevices.getUserMedia({
                  video: true,
                  audio: true
                });
                videoRef.current.srcObject = localStream;
              }
            } else {
              throw new Error('Failed to start publishing stream');
            }
          } else {
            throw new Error('Failed to join Zego room');
          }
        } else {
          throw new Error('Failed to login to Zego');
        }
      } else {
        setError(result.error || 'Failed to create live stream');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start stream. Please check camera permissions.');
      console.error('Stream start error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const endStream = async () => {
    if (!streamData?.liveId) return;

    try {
      // Stop Zego publishing and leave room
      const zegoService = ZegoService.getInstance();
      await zegoService.stopPublishing();
      await zegoService.leaveRoom();

      // End the livestream on backend
      await LivestreamService.endLiveStream(streamData.liveId);
      setIsStreaming(false);
      setStreamData(null);

      // Stop camera
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      onStreamEnd?.();
      console.log('Stream ended successfully');
    } catch (error) {
      console.error('Failed to end stream:', error);
    }
  };

  // Streaming control methods
  const toggleMicrophone = async () => {
    try {
      const zegoService = ZegoService.getInstance();
      const newMuteState = !isMicMuted;
      await zegoService.muteMicrophone(newMuteState);
      setIsMicMuted(newMuteState);
    } catch (error) {
      console.error('Failed to toggle microphone:', error);
    }
  };

  const toggleCamera = async () => {
    try {
      const zegoService = ZegoService.getInstance();
      const newCameraState = !isCameraOff;
      await zegoService.enableCamera(!newCameraState);
      setIsCameraOff(newCameraState);
    } catch (error) {
      console.error('Failed to toggle camera:', error);
    }
  };

  const switchCamera = async () => {
    try {
      const zegoService = ZegoService.getInstance();
      await zegoService.switchCamera();
    } catch (error) {
      console.error('Failed to switch camera:', error);
    }
  };

  const startScreenShare = async () => {
    try {
      if (!navigator.mediaDevices?.getDisplayMedia) {
        setError('Screen sharing not supported in this browser');
        return;
      }

      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      // For now, we'll just replace the video element source
      // In a full implementation, you'd need to replace the published stream
      if (videoRef.current) {
        videoRef.current.srcObject = screenStream;
      }

      setIsScreenSharing(true);

      // Handle when screen share ends
      screenStream.getVideoTracks()[0].addEventListener('ended', () => {
        setIsScreenSharing(false);
        // Restore camera stream
        restoreCameraStream();
      });
    } catch (error) {
      console.error('Failed to start screen share:', error);
      setError('Failed to start screen sharing');
    }
  };

  const restoreCameraStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setIsScreenSharing(false);
    } catch (error) {
      console.error('Failed to restore camera stream:', error);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {isStreaming ? 'Live Streaming' : 'Start Live Stream'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isStreaming ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600">
                Start streaming directly with your device camera
              </p>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              {!zegoInitialized && (
                <p className="text-yellow-600 text-sm">Initializing streaming service...</p>
              )}
              <Button
                onClick={startStream}
                disabled={isLoading || !zegoInitialized}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Starting...' : zegoInitialized ? 'Go Live' : 'Initializing...'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  {connectionStatus === 'streaming' ? 'LIVE' : 'PREPARING'}
                </div>
                {connectionStatus !== 'disconnected' && (
                  <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'streaming' ? 'Streaming' : 'Connecting...'}
                  </div>
                )}
                
                {/* Stream Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-center">
                  <div className="flex gap-2 bg-black/50 backdrop-blur-sm rounded-lg p-2">
                    {/* Microphone Toggle */}
                    <Button
                      size="sm"
                      variant={isMicMuted ? "destructive" : "secondary"}
                      onClick={toggleMicrophone}
                      className="w-10 h-10 p-0"
                    >
                      {isMicMuted ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 5.586a2 2 0 112.828 2.828l6.172 6.172a6 6 0 01-2.12 1.898l.665.666L16 19l2-2m-2-2l-3.172-3.172a4 4 0 01-1.656.896L13 16l4 4m2-6l-3-3 3-3" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </Button>

                    {/* Camera Toggle */}
                    <Button
                      size="sm"
                      variant={isCameraOff ? "destructive" : "secondary"}
                      onClick={toggleCamera}
                      className="w-10 h-10 p-0"
                    >
                      {isCameraOff ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </Button>

                    {/* Switch Camera */}
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={switchCamera}
                      className="w-10 h-10 p-0"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </Button>

                    {/* Screen Share */}
                    <Button
                      size="sm"
                      variant={isScreenSharing ? "default" : "secondary"}
                      onClick={isScreenSharing ? restoreCameraStream : startScreenShare}
                      className="w-10 h-10 p-0"
                    >
                      {isScreenSharing ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                  {streamData?.liveId || 'Stream ID'}
                </div>
              </div>

              {/* Stream Settings */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900">Stream Settings</h3>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stream Quality</span>
                  <select
                    value={streamQuality}
                    onChange={(e) => setStreamQuality(e.target.value as 'low' | 'medium' | 'high')}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="low">Low (480p)</option>
                    <option value="medium">Medium (720p)</option>
                    <option value="high">High (1080p)</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Connection Status</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    connectionStatus === 'streaming' ? 'bg-green-100 text-green-800' :
                    connectionStatus === 'connected' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {connectionStatus === 'streaming' ? 'Live' : 
                     connectionStatus === 'connected' ? 'Connected' : 'Disconnected'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Stream Type</span>
                  <span className="text-sm text-gray-900">
                    {isScreenSharing ? 'Screen Share' : 'Camera'}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={endStream}
                  variant="destructive"
                  className="flex-1"
                >
                  End Stream
                </Button>
                <Button
                  onClick={() => router.push(`/live/${streamData?.liveId}`)}
                  variant="outline"
                  className="flex-1"
                >
                  View Stream
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
