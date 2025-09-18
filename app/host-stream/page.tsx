'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import LiveStreamViewer from '@/components/dashboard/StreamPlay';

type HostData = {
  message?: string;
  streamType?: string;
  liveId?: string;
  livedata?: {
    Code?: number;
    Message?: string;
    RequestId?: string;
    Data?: string[];
  };
};

export default function HostStreamPage() {
  const router = useRouter();
  const [data, setData] = useState<HostData | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('host_stream_data');
      if (raw) {
        setData(JSON.parse(raw));
      }
    } catch (e) {
      // ignore
    }
  }, []);

  const rtmpUrls = useMemo(() => data?.livedata?.Data ?? [], [data]);

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('Copied to clipboard');
    } catch (e) {
      console.error('Copy failed', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-20 lg:pb-4">
      <div className="max-w-3xl mx-auto lg:ml-64">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Host Stream</h1>
          <Button
            onClick={() => router.back()}
            className="bg-slate-700 hover:bg-slate-600 text-white border-0"
          >
            ← Back
          </Button>
        </div>

        {!data ? (
          <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
            <p className="text-slate-300">No livestream data found. Please start a new livestream.</p>
            <div className="mt-4 flex gap-3">
              <Button
                onClick={() => router.push('/profile')}
                className="bg-slate-700 hover:bg-slate-600 text-white"
              >
                Go to Profile
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Live Stream Monitor */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-4">Live Stream Monitor</h2>
              <p className="text-slate-300 text-sm mb-4">
                This will show your stream once it starts broadcasting from OBS. It may take a few moments to appear.
              </p>
              <LiveStreamViewer />
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">Livestream Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300">
                <div>
                  <div className="text-slate-400 text-sm">Message</div>
                  <div className="font-medium">{data.message ?? '—'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Stream Type</div>
                  <div className="font-medium">{data.streamType ?? '—'}</div>
                </div>
                <div className="md:col-span-2">
                  <div className="text-slate-400 text-sm">Live ID</div>
                  <div className="font-mono text-sm break-all">{data.liveId ?? '—'}</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Zego Status</div>
                  <div className="font-medium">{data.livedata?.Message ?? '—'} (Code {data.livedata?.Code ?? '—'})</div>
                </div>
                <div>
                  <div className="text-slate-400 text-sm">Request ID</div>
                  <div className="font-mono text-xs break-all">{data.livedata?.RequestId ?? '—'}</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-3">RTMP Endpoints</h2>
              {rtmpUrls.length === 0 ? (
                <p className="text-slate-300">No RTMP endpoints returned. Try creating the livestream again.</p>
              ) : (
                <ul className="space-y-3">
                  {rtmpUrls.map((url, idx) => (
                    <li key={idx} className="flex items-center justify-between gap-3">
                      <div className="font-mono text-sm break-all">{url}</div>
                      <Button
                        onClick={() => copy(url)}
                        className="bg-slate-700 hover:bg-slate-600 text-white border-0"
                      >
                        Copy
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-6">
              <h2 className="text-xl font-semibold mb-2">How to use with OBS</h2>
              <ol className="list-decimal list-inside text-slate-300 space-y-1">
                <li>Open OBS and go to Settings → Stream.</li>
                <li>Select Service: Custom.</li>
                <li>Pick one RTMP URL above and paste it into the Server field.</li>
                <li>Leave Stream Key empty if the URL already contains the path (e.g., ends with `/1170382194/rtc01`).</li>
                <li>Recommended: Encoder H.264, CBR, 2s keyframe interval.</li>
                <li>Start streaming. The viewer should pick up once video starts publishing.</li>
              </ol>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
