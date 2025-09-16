'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Always redirect to dashboard first, let dashboard handle auth state
    router.push('/dashboard');
  }, [router]);

  // Show a minimal loading state while redirecting
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-white text-lg font-[var(--font-lato)]">
        Redirecting...
      </div>
    </div>
  );
}
