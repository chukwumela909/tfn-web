'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { IconEye, IconUser } from '@tabler/icons-react';

interface Stream {
  _id: string;
  title: string;
  userId: string;
  muxStreamId: string;
  muxPlaybackId: string;
  status: 'active' | 'idle' | 'ended';
  viewerCount?: number; // Add viewer count
  createdAt: string;
  updatedAt: string;
}

export default function LiveTVComponent() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStreams();
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchStreams, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchStreams = async () => {
    try {
      // Fetch only active streams
      const response = await fetch('/api/streams/list?status=idle');
      if (!response.ok) throw new Error('Failed to fetch streams');
      
      const data = await response.json();
      setStreams(data.streams || []);
      setError('');
    } catch (err) {
      console.error('Error fetching streams:', err);
      setError('Failed to load streams');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 lg:px-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading streams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 lg:px-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchStreams}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Live TV</h1>
        <p className="text-slate-400">Watch live streams from the community</p>
      </div>

      {streams.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <IconUser className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Live Streams</h3>
            <p className="text-slate-400">Check back later when streamers go live!</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <Link
              key={stream._id}
              href={`/live/${stream.muxStreamId}`}
              className="group"
            >
              <div className="bg-slate-800/60 border border-slate-700 rounded-xl overflow-hidden hover:border-blue-500 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
                {/* Thumbnail/Preview */}
                <div className="relative aspect-video bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center">
                  <div className="absolute inset-0 bg-black/20"></div>
                  
                  {/* Live Badge */}
                  <div className="absolute top-3 left-3 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 text-sm font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                    LIVE
                  </div>

                  {/* Play Icon Overlay */}
                  <div className="relative z-10 w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors">
                    <div className="w-0 h-0 border-t-8 border-t-transparent border-l-12 border-l-white border-b-8 border-b-transparent ml-1"></div>
                  </div>
                </div>

                {/* Stream Info */}
                <div className="p-4">
                  <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-blue-400 transition-colors">
                    {stream.title}
                  </h3>
                  
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-slate-400">
                      <IconUser className="w-4 h-4" />
                      <span className="truncate">Streamer</span>
                    </div>
                    
                    <div className="flex items-center gap-1 text-slate-400">
                      <IconEye className="w-4 h-4" />
                      <span>{stream.viewerCount || 0}</span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-500">
                    Started {new Date(stream.createdAt).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Refresh Notice */}
      {streams.length > 0 && (
        <div className="mt-8 text-center text-sm text-slate-500">
          Auto-refreshing every 15 seconds • {streams.length} live {streams.length === 1 ? 'stream' : 'streams'}
        </div>
      )}
    </div>
  );
}
