'use client';

import { useEffect, useState } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { AlertCircle } from 'lucide-react';

interface StreamPlayProps {
  onStreamInfoUpdate?: (streamInfo: any) => void;
}

export default function StreamPlay({ onStreamInfoUpdate }: StreamPlayProps) {
  const [playbackId, setPlaybackId] = useState<string | null>(null);
  const [streamInfo, setStreamInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStreamInfo();
    // Poll for stream status every 2 seconds
    const interval = setInterval(fetchStreamInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const fetchStreamInfo = async () => {
    try {
      // Get stream data from localStorage
      const raw = localStorage.getItem('host_stream_data');
      if (!raw) {
        setError('No stream data found');
        setLoading(false);
        return;
      }

      const data = JSON.parse(raw);
      console.log('StreamPlay - Fetched stream data:', data);

      if (!data.stream) {
        setError('Invalid stream data');
        setLoading(false);
        return;
      }

      // Try to get updated stream status from API
      try {
        const response = await fetch(`/api/streams/get?muxStreamId=${data.stream.muxStreamId}`);
        if (response.ok) {
          const apiData = await response.json();
          console.log('StreamPlay - API stream data:', apiData);
          setStreamInfo(apiData.stream);
          setPlaybackId(apiData.stream.muxPlaybackId || data.stream.muxPlaybackId);
          
          // Notify parent component of stream info update
          if (onStreamInfoUpdate) {
            onStreamInfoUpdate(apiData.stream);
          }
        } else {
          // Fallback to localStorage data
          setStreamInfo(data.stream);
          setPlaybackId(data.stream.muxPlaybackId);
        }
      } catch (apiError) {
        console.warn('StreamPlay - API fetch failed, using localStorage data:', apiError);
        // Fallback to localStorage data
        setStreamInfo(data.stream);
        setPlaybackId(data.stream.muxPlaybackId);
      }

      setError('');
    } catch (err) {
      console.error('StreamPlay - Error fetching stream info:', err);
      setError('Failed to load stream');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-900 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !playbackId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-slate-900 rounded-lg">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="mx-auto mb-4 text-yellow-500" size={48} />
          <h2 className="text-xl font-bold mb-2 text-white">Stream Not Ready</h2>
          <p className="text-slate-400">
            {error || 'Waiting for stream to initialize. Start streaming from OBS to see your video here.'}
          </p>
        </div>
      </div>
    );
  }

  const isLive = streamInfo?.status === 'active';

  return (
    <div className="w-full">
      {/* Stream Status Banner */}
      {!isLive && (
        <div className="bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4 mb-4">
          <p className="text-yellow-300 text-center text-sm">
            🔴 Stream is idle. Start streaming from OBS to see your video here.
          </p>
        </div>
      )}

      {isLive && (
        <div className="bg-red-600 text-white px-4 py-2 rounded-t-lg flex items-center gap-2 mb-0">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </span>
          <span className="font-semibold">LIVE NOW</span>
        </div>
      )}

      {/* Video Player */}
      <div className={`bg-black ${isLive ? 'rounded-b-lg' : 'rounded-lg'} overflow-hidden shadow-2xl`}>
        <MuxPlayer
          playbackId={playbackId}
          metadata={{
            video_title: streamInfo?.title || 'Host Stream Monitor',
          }}
          streamType="live"
          autoPlay
          muted={false}
          style={{ width: '100%', aspectRatio: '16/9' }}
        />
      </div>

      {/* Stream Info */}
      {streamInfo && (
        <div className="mt-4 bg-slate-800/60 border border-slate-700 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-white">{streamInfo.title || 'Live Stream'}</h3>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                <span>Playback ID: {playbackId}</span>
                {isLive ? (
                  <span className="flex items-center gap-1 text-green-400">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Broadcasting
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-yellow-400">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                    Idle
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
