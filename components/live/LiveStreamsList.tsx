'use client';

import { useState, useEffect } from 'react';
import { LivestreamService } from '@/lib/livestream-service';
import { LiveStream } from '@/lib/models/livestream';
import { Button } from '@/components/ui/button';
import { CardBody, CardContainer, CardItem } from '@/components/ui/3d-card';
import { useRouter } from 'next/navigation';

export default function LiveStreamsList() {
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [streamType, setStreamType] = useState<'all' | 'rtmp' | 'normal'>('all');
  const router = useRouter();

  useEffect(() => {
    loadStreams();
  }, [streamType]);

  const loadStreams = async () => {
    setIsLoading(true);
    setError('');

    try {
      let streamsData: LiveStream[];

      if (streamType === 'all') {
        streamsData = await LivestreamService.fetchAllLiveStreams();
      } else {
        streamsData = await LivestreamService.fetchLiveStreamsByType(streamType);
      }

      setStreams(streamsData);
    } catch (err) {
      setError('Failed to load streams');
      console.error('Load streams error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWatchStream = (liveId: string) => {
    router.push(`/live/${liveId}`);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p>Loading live streams...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Live Streams</h1>

        {/* Stream Type Filter */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={streamType === 'all' ? 'default' : 'outline'}
            onClick={() => setStreamType('all')}
          >
            All Streams
          </Button>
          <Button
            variant={streamType === 'rtmp' ? 'default' : 'outline'}
            onClick={() => setStreamType('rtmp')}
          >
            RTMP Streams
          </Button>
          <Button
            variant={streamType === 'normal' ? 'default' : 'outline'}
            onClick={() => setStreamType('normal')}
          >
            Camera Streams
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-600">{error}</p>
          <Button
            onClick={loadStreams}
            variant="outline"
            size="sm"
            className="mt-2"
          >
            Try Again
          </Button>
        </div>
      )}

      {streams.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Live Streams</h3>
          <p className="text-gray-600">
            {streamType === 'all'
              ? 'There are no active live streams at the moment.'
              : `No ${streamType} streams are currently live.`
            }
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {streams.map((stream) => (
            <CardContainer key={stream._id} className="inter-var" containerClassName="py-10 px-0">
              <CardBody className="bg-slate-800 relative group/card hover:shadow-2xl hover:shadow-blue-500/[0.1] border-slate-700 w-full max-w-sm h-auto rounded-xl p-6 border">
                <div className="flex items-center justify-between mb-4">
                  <CardItem
                    translateZ="50"
                    className="text-xl font-bold text-white"
                  >
                    {stream.hostChannel}
                  </CardItem>
                  <CardItem translateZ="40" className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-red-500 font-medium">LIVE</span>
                  </CardItem>
                </div>

                <CardItem
                  translateZ="30"
                  className="flex items-center space-x-4 text-sm text-slate-400 mb-4"
                >
                  <div className="flex items-center space-x-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    <span>{stream.viewCount}</span>
                  </div>
                  <span className="capitalize">{stream.streamType}</span>
                </CardItem>

                <CardItem translateZ="100" className="w-full mb-4">
                  <div className="aspect-video bg-slate-700 rounded-lg flex items-center justify-center overflow-hidden">
                    {stream.channelImage ? (
                      <img
                        src={stream.channelImage}
                        alt={stream.hostChannel}
                        className="w-full h-full object-cover rounded-lg group-hover/card:shadow-xl"
                      />
                    ) : (
                      <div className="text-slate-400">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm">No Preview</p>
                      </div>
                    )}
                  </div>
                </CardItem>

                <CardItem
                  translateZ={20}
                  className="w-full"
                >
                  <Button
                    onClick={() => handleWatchStream(stream.liveId)}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl"
                  >
                    Watch Now
                  </Button>
                </CardItem>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      )}
    </div>
  );
}
