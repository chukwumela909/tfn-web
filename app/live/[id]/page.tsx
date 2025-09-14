'use client';

import { useParams } from 'next/navigation';
import ViewerLiveStream from '@/components/live/ViewerLiveStream';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function LiveStreamPage() {
  const params = useParams();
  const liveId = params.id as string;
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
        >
          ← Back
        </Button>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-500 font-medium">LIVE</span>
        </div>
      </header>

      {/* Stream Viewer */}
      <main>
        <ViewerLiveStream liveId={liveId} />
      </main>
    </div>
  );
}
