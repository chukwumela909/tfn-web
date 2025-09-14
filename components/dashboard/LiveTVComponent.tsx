'use client';

import LiveStreamsList from '@/components/live/LiveStreamsList';

export default function LiveTVComponent() {
  return (
    <div className="px-4 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Live TV</h1>
        <p className="text-slate-400">Watch live streams from the community</p>
      </div>
      <LiveStreamsList />
    </div>
  );
}
