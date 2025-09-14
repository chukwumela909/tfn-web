'use client';

import { useState, useEffect, useRef } from 'react';
import { LivestreamService } from '@/lib/livestream-service';
import { ZegoService, RTMPConfig } from '@/lib/zego-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

export default function RTMPGoLive() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [streamData, setStreamData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [passcode, setPasscode] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showAuth, setShowAuth] = useState(true);
  const [zegoInitialized, setZegoInitialized] = useState(false);
  const [isRTMPStreaming, setIsRTMPStreaming] = useState(false);
  const [rtmpStatus, setRtmpStatus] = useState('disconnected');
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated) {
      initializeZego();
    }
  }, [isAuthenticated]);

  const initializeZego = async () => {
    try {
      const zegoService = ZegoService.getInstance();
      const initialized = await zegoService.initializeZego();
      setZegoInitialized(initialized);

      if (initialized) {
        console.log('Zego SDK initialized for RTMP streaming');
      }
    } catch (error) {
      console.error('Failed to initialize Zego for RTMP:', error);
      setError('Failed to initialize streaming service');
    }
  };

  const handleAuth = () => {
    if (passcode === 'admin123') {
      setIsAuthenticated(true);
      setShowAuth(false);
      checkForActiveStream();
    } else {
      setError('Invalid passcode');
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

  const startRTMPStream = async () => {
    setIsLoading(true);
    setError('');

    try {
      // First create the RTMP stream on backend
      const result = await LivestreamService.createLiveStream('rtmp');

      if (result.success && result.rtmpUrl && result.streamKey) {
        setStreamData(result);

        // Initialize Zego streaming with RTMP
        const zegoService = ZegoService.getInstance();
        const userData = LivestreamService.getUserData();
        const zegoInfo = LivestreamService.getZegoStreamInfo(result, userData);

        // Login to Zego
        const loginSuccess = await zegoService.loginUser({
          userId: zegoInfo.userId,
          userName: zegoInfo.userName
        });

        if (loginSuccess) {
          // Join room for local streaming
          const roomJoined = await zegoService.joinRoom({
            roomId: zegoInfo.roomId,
          });

          if (roomJoined) {
            // Start local publishing first
            const publishSuccess = await zegoService.startPublishing(
              zegoInfo.streamId,
              { video: true, audio: true, quality: 'high', camera: 'front' }
            );

            if (publishSuccess) {
              // Now start RTMP relay to external server
              const rtmpConfig: RTMPConfig = {
                rtmpUrl: result.rtmpUrl,
                streamKey: result.streamKey,
                bitrate: 2000, // 2 Mbps
                resolution: {
                  width: 1920,
                  height: 1080
                }
              };

              const rtmpSuccess = await zegoService.startRTMPPublishing(
                zegoInfo.streamId,
                rtmpConfig
              );

              if (rtmpSuccess) {
                setIsRTMPStreaming(true);
                setRtmpStatus('streaming');
                console.log('RTMP streaming started successfully');

                // Initialize camera preview
                if (videoRef.current) {
                  const stream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                  });
                  videoRef.current.srcObject = stream;
                }
              } else {
                throw new Error('Failed to start RTMP publishing');
              }
            } else {
              throw new Error('Failed to start local publishing');
            }
          } else {
            throw new Error('Failed to join Zego room');
          }
        } else {
          throw new Error('Failed to login to Zego');
        }
      } else {
        setError(result.error || 'Failed to create RTMP stream');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start RTMP stream');
      console.error('RTMP stream start error:', err);
      setRtmpStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const stopRTMPStream = async () => {
    if (!streamData?.liveId) return;

    try {
      const zegoService = ZegoService.getInstance();
      const zegoInfo = LivestreamService.getZegoStreamInfo(streamData, LivestreamService.getUserData());

      // Stop RTMP publishing
      await zegoService.stopRTMPPublishing(zegoInfo.streamId);
      
      // Stop local publishing and leave room
      await zegoService.stopPublishing();
      await zegoService.leaveRoom();

      // End the livestream on backend
      await LivestreamService.endLiveStream(streamData.liveId);

      // Stop camera
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      setIsRTMPStreaming(false);
      setStreamData(null);
      setRtmpStatus('disconnected');
      console.log('RTMP streaming stopped successfully');
    } catch (error) {
      console.error('Failed to stop RTMP stream:', error);
      setError('Failed to stop RTMP stream');
    }
  };

  if (showAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-center">Admin Authentication</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Please enter admin passcode to continue
            </p>
            <Input
              type="password"
              placeholder="Passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
            />
            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            <Button onClick={handleAuth} className="w-full">
              Verify
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-center">
            {streamData ? 'RTMP Stream Created' : 'Create RTMP Stream'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!streamData ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-gray-600">
                Create an RTMP stream for external broadcasting software
              </p>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              {!zegoInitialized && (
                <p className="text-yellow-600 text-sm">Initializing streaming service...</p>
              )}
              <Button
                onClick={startRTMPStream}
                disabled={isLoading || !zegoInitialized}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Creating...' : zegoInitialized ? 'Create RTMP Stream' : 'Initializing...'}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Camera Preview */}
              {isRTMPStreaming && (
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <div className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      RTMP LIVE
                    </div>
                    <div className="bg-black/50 text-white px-3 py-1 rounded-full text-sm">
                      {rtmpStatus === 'streaming' ? 'Streaming' : 'Connecting...'}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-medium text-green-800 mb-2">Stream Created Successfully!</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Stream ID:</span> {streamData.liveId}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded text-xs ${
                      rtmpStatus === 'streaming' ? 'bg-green-100 text-green-800' :
                      rtmpStatus === 'error' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {rtmpStatus === 'streaming' ? 'Live Streaming' :
                       rtmpStatus === 'error' ? 'Stream Error' :
                       'Preparing Stream'}
                    </span>
                  </div>
                  {streamData.rtmpUrl && (
                    <div>
                      <span className="font-medium">RTMP URL:</span>
                      <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
                        {streamData.rtmpUrl}
                      </div>
                    </div>
                  )}
                  {streamData.streamKey && (
                    <div>
                      <span className="font-medium">Stream Key:</span>
                      <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
                        {streamData.streamKey}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Setup Instructions:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Open your broadcasting software (OBS, Streamlabs, etc.)</li>
                  <li>Create a new RTMP stream</li>
                  <li>Copy the RTMP URL and Stream Key above</li>
                  <li>Paste them in your broadcasting software</li>
                  <li>Start streaming!</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={() => router.push(`/live/${streamData.liveId}`)}
                  className="flex-1"
                  disabled={!isRTMPStreaming}
                >
                  View Live Stream
                </Button>
                {isRTMPStreaming ? (
                  <Button
                    onClick={stopRTMPStream}
                    variant="outline"
                    className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
                  >
                    Stop Stream
                  </Button>
                ) : (
                  <Button
                    onClick={() => window.location.reload()}
                    variant="outline"
                    className="flex-1"
                  >
                    Create New Stream
                  </Button>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
