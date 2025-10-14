'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Button } from '@/components/ui/button';
import { AlertCircle, User, Eye } from 'lucide-react';

interface StreamInfo {
  _id: string;
  title: string;
  userId: string;
  muxStreamId: string;
  muxPlaybackId: string;
  status: 'active' | 'idle' | 'ended';
  createdAt: string;
  updatedAt: string;
}

export default function LiveStreamPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;

  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStreamInfo();
    // Poll for stream status every 10 seconds
    const interval = setInterval(fetchStreamInfo, 10000);
    return () => clearInterval(interval);
  }, [streamId]);

  const fetchStreamInfo = async () => {
    console.log('Fetching stream info for ID:', streamId);
    try {
      const response = await fetch(`/api/streams/get?muxStreamId=${streamId}`);
      if (!response.ok) throw new Error('Stream not found');
      
      const data = await response.json();
      console.log('Fetched stream data:', data);
      setStreamInfo(data.stream);
      setError('');
    } catch (err) {
      console.error('Error fetching stream:', err);
      setError('Stream not found or unavailable');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !streamInfo) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold mb-2">Stream Not Available</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            ← Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isLive = streamInfo.status === 'active';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-800">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="bg-slate-800 hover:bg-slate-700 border-slate-700"
        >
          ← Back
        </Button>
        <div className="flex items-center space-x-2">
          {isLive ? (
            <>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </div>
              <span className="text-red-500 font-medium">LIVE</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-500 font-medium">OFFLINE</span>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Stream Status Banner */}
        {!isLive && (
          <div className="mb-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
            <p className="text-yellow-300 text-center">
              Stream is currently offline. Waiting for host to start streaming...
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            {isLive && (
              <div className="bg-red-600 text-white px-4 py-2 rounded-t-lg flex items-center gap-2 mb-0">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <span className="font-semibold">LIVE NOW</span>
              </div>
            )}

            <div className={`bg-black ${isLive ? 'rounded-b-lg' : 'rounded-lg'} overflow-hidden shadow-2xl`}>
              <MuxPlayer
                playbackId={streamInfo.muxPlaybackId}
                metadata={{
                  video_title: streamInfo.title,
                }}
                streamType="live"
                autoPlay
                muted={false}
                style={{ width: '100%', aspectRatio: '16/9' }}
              />
            </div>
          </div>

          {/* Stream Info Sidebar */}
          <div className="space-y-4">
            {/* Stream Details Card */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
              <h1 className="text-2xl font-bold mb-4">{streamInfo.title}</h1>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-300">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Streamer</div>
                    <div className="font-medium">Channel</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-slate-300">
                  <Eye className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Viewers</div>
                    <div className="font-medium">••• watching</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">Started</div>
                  <div className="text-sm text-slate-300">
                    {new Date(streamInfo.createdAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1">Status</div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isLive 
                        ? 'bg-red-600 text-white' 
                        : 'bg-yellow-600 text-white'
                    }`}>
                      {isLive ? 'LIVE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stream ID Card (for debugging) */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Stream ID</div>
              <div className="text-xs font-mono text-slate-400 break-all">
                {streamInfo.muxStreamId}
              </div>
            </div>

            {/* Playback ID Card */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Playback ID</div>
              <div className="text-xs font-mono text-slate-400 break-all">
                {streamInfo.muxPlaybackId}
              </div>
            </div>
          </div>
        </div>

        {/* Auto-refresh Notice */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Auto-refreshing stream status every 10 seconds
        </div>
      </main>
    </div>
  );
}
