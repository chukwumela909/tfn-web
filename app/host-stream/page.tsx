'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import dynamic from 'next/dynamic';

  const LiveStreamViewer = dynamic(() => import('../../components/dashboard/StreamPlay'), {
  ssr: false, // Disable server-side rendering for this component
  loading: () => <p>Loading stream...</p>
});

type HostData = {
  stream: {
    _id: string;
    muxStreamId: string;
    muxPlaybackId: string;
    title: string;
    userId: string;
    rtmpUrl: string;
    streamKey: string;
    status: string;
    createdAt: string;
    updatedAt: string;
  };
  rtmpIngestUrl?: string;
};

export default function HostStreamPage() {
  const router = useRouter();
  const [data, setData] = useState<HostData | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  // Callback to receive stream info updates from StreamPlay component
  const handleStreamInfoUpdate = (streamInfo: any) => {
    if (streamInfo?.viewerCount !== undefined) {
      setViewerCount(streamInfo.viewerCount);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('host_stream_data');
      console.log('Raw localStorage data:', raw); // Debug log
      if (raw) {
        const parsedData = JSON.parse(raw);
        console.log('Parsed data:', parsedData); // Debug log
        setData(parsedData);
      } else {
        console.log('No host_stream_data found in localStorage'); // Debug log
      }
    } catch (e) {
      console.error('Error parsing host_stream_data:', e);
    }
  }, []);

  const rtmpServer = useMemo(() => data?.stream?.rtmpUrl ?? '', [data]);
  const streamKey = useMemo(() => data?.stream?.streamKey ?? '', [data]);
  const fullRtmpUrl = useMemo(() => {
    if (!rtmpServer || !streamKey) return '';
    return `${rtmpServer}/${streamKey}`;
  }, [rtmpServer, streamKey]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  const endLivestream = async () => {
    console.log('Attempting to end livestream with data:', data);
    
    if (!data?.stream?.muxStreamId) {
      alert('No live stream to end');
      return;
    }

    if (!confirm('Are you sure you want to end this livestream? This action cannot be undone.')) {
      return;
    }

    setIsEnding(true);
    try {
      const url = '/api/streams/delete';
      console.log('Sending POST request to:', url);
      console.log('With muxStreamId:', data.stream.muxStreamId);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          muxStreamId: data.stream.muxStreamId 
        }),
      });

      console.log('End livestream response status:', response.status);
      const responseData = await response.json();
      console.log('End livestream response data:', responseData);

      if (response.ok) {
        alert('Livestream ended successfully');
        localStorage.removeItem('host_stream_data');
        router.push('/dashboard');
      } else {
        console.error('Failed to end stream:', responseData);
        alert(`Failed to end livestream: ${responseData.error || 'Unknown error'}\n\nCheck console for details.`);
      }
    } catch (error) {
      console.error('Error ending livestream:', error);
      alert('An error occurred while ending the livestream');
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-20 lg:pb-4">
      <div className="max-w-3xl mx-auto lg:ml-64">
          <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Host Stream</h1>
          <div className="flex gap-3">
            {/* {data?.stream?.muxStreamId && (
              <Button
                onClick={endLivestream}
                disabled={isEnding}
                className="bg-red-600 hover:bg-red-700 text-white border-0"
              >
                {isEnding ? 'Ending...' : 'End Livestream'}
              </Button>
            )} */}
            <Button
              onClick={() => router.back()}
              className="bg-slate-700 hover:bg-slate-600 text-white border-0"
            >
              ← Back
            </Button>
          </div>
        </div>        {!data ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
            <p className="text-slate-300">No livestream data found. Please start a new livestream.</p>
            <div className="mt-2 text-xs text-slate-400">
              Debug: Check browser console for localStorage data
            </div>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => router.push('/dashboard')}
                className="bg-slate-700 hover:bg-slate-600 text-white"
              >
                Go to Dashboard
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Live Stream Monitor */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Live Stream Monitor</h2>
                <Button
                  onClick={endLivestream}
                  disabled={isEnding}
                  className="bg-red-600 hover:bg-red-700 text-white border-0"
                >
                  {isEnding ? 'Ending...' : 'End Livestream'}
                </Button>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                This will show your stream once it starts broadcasting from OBS. It may take a few moments to appear.
              </p>
              <LiveStreamViewer onStreamInfoUpdate={handleStreamInfoUpdate} />
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Livestream Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                <div className="md:col-span-2">
                  <div className="text-slate-400 text-sm">Stream Title</div>
                  <div className="font-semibold text-lg">{data.stream.title}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Status</div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      data.stream.status === 'active' 
                        ? 'bg-red-600 text-white' 
                        : 'bg-yellow-600 text-white'
                    }`}>
                      {data.stream.status === 'active' ? 'LIVE' : 'IDLE'}
                    </span>
                    <span className="capitalize">{data.stream.status}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Current Viewers</div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                    </svg>
                    <span className="font-semibold text-xl">{viewerCount}</span>
                    <span className="text-slate-400 text-sm">watching</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Created</div>
                  <div className="font-medium">{new Date(data.stream.createdAt).toLocaleString()}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-slate-400 text-sm">Mux Stream ID</div>
                  <div className="font-mono text-sm break-all">{data.stream.muxStreamId}</div>
                </div>
                {/* <div className="md:col-span-2">
                  <div className="text-slate-400 text-sm">Playback ID</div>
                  <div className="font-mono text-sm break-all">{data.stream.muxPlaybackId}</div>
                </div> */}
                {/* <div className="md:col-span-2">
                  <div className="text-slate-400 text-sm">User ID</div>
                  <div className="font-mono text-xs break-all">{data.stream.userId}</div>
                </div> */}
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-3">RTMP Configuration</h2>
              <div className="space-y-4">
                {/* RTMP Server URL */}
                <div>
                  <div className="text-slate-400 text-sm mb-2">RTMP Server URL</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 font-mono text-sm break-all">
                      {rtmpServer}
                    </div>
                    <Button
                      onClick={() => copy(rtmpServer)}
                      className="bg-slate-700 hover:bg-slate-600 text-white border-0"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Stream Key */}
                <div>
                  <div className="text-slate-400 text-sm mb-2">Stream Key</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 font-mono text-sm break-all">
                      {streamKey}
                    </div>
                    <Button
                      onClick={() => copy(streamKey)}
                      className="bg-slate-700 hover:bg-slate-600 text-white border-0"
                    >
                      Copy
                    </Button>
                  </div>
                </div>

                {/* Full RTMP URL */}
                <div>
                  <div className="text-slate-400 text-sm mb-2">Full RTMP URL (Alternative)</div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-2 font-mono text-xs break-all">
                      {fullRtmpUrl}
                    </div>
                    <Button
                      onClick={() => copy(fullRtmpUrl)}
                      className="bg-slate-700 hover:bg-slate-600 text-white border-0"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">How to use with OBS Studio</h2>
              <ol className="list-decimal list-inside text-slate-300 space-y-2">
                <li>Open OBS Studio and go to <strong>Settings → Stream</strong></li>
                <li>Select <strong>Service: Custom</strong></li>
                <li>Copy the <strong>RTMP Server URL</strong> from above and paste it into the <strong>Server</strong> field</li>
                <li>Copy the <strong>Stream Key</strong> from above and paste it into the <strong>Stream Key</strong> field</li>
                <li>Click <strong>OK</strong> to save settings</li>
                <li>Configure your video sources and click <strong>Start Streaming</strong></li>
                <li>Your stream will appear in the Live Stream Monitor above once OBS connects</li>
              </ol>
              <div className="mt-4 p-3 bg-blue-900/20 border border-blue-700/50 rounded-lg">
                <p className="text-sm text-slate-300">
                  <strong>Recommended Settings:</strong> Encoder: H.264, Rate Control: CBR, Keyframe Interval: 2s, Bitrate: 2500-6000 Kbps
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
