'use client';

import { useEffect, useState } from 'react';
import LiveStreamsList from '@/components/live/LiveStreamsList';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  IconHome,
  IconDeviceTv,
  IconUser,
} from '@tabler/icons-react';
import { ApiService } from '@/lib/api-service';

export default function LiveTVPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('live-tv');

  const navigationTabs = [
    { id: 'home', icon: IconHome, label: 'Home', href: '/home' },
    { id: 'live-tv', icon: IconDeviceTv, label: 'Live TV', href: '/live-tv' },
    { id: 'profile', icon: IconUser, label: 'Profile', href: '/profile' },
  ];

  const handleTabClick = (tabId: string, href?: string) => {
    setActiveTab(tabId);
    if (href && href !== '/live-tv') {
      router.push(href);
    }
  };

  // Auth modal state for starting livestream from this tab
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authCode, setAuthCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isStartingLive, setIsStartingLive] = useState(false);

  const handleStartLivestream = () => {
    setAuthCode('');
    setAuthError('');
    setShowAuthModal(true);
  };

  const confirmStartLivestream = async () => {
    if (authCode.trim() !== 'admin123') {
      setAuthError('Invalid code. Please try again.');
      return;
    }
    try {
      setIsStartingLive(true);
      setAuthError('');
      // Retrieve user id from local storage profile data
      const storedUserData = typeof window !== 'undefined' ? localStorage.getItem('user_data') : null;
      const parsed = storedUserData ? JSON.parse(storedUserData) : null;
      const userId = parsed?.userId || localStorage.getItem('auth_token');
      if (!userId) {
        setAuthError('Please login again.');
        setIsStartingLive(false);
        return;
      }
      const res = await ApiService.createLiveStream({ userId, streamType: 'rtmp' });
      const liveId = res?.liveId || res?.id || res?.data?.liveId || res?.data?.id || res?.livestreamId || res?.livestream?.id;
      if (liveId) {
        try { localStorage.setItem('current_live_id', String(liveId)); } catch {}
      }
      try { localStorage.setItem('host_stream_data', JSON.stringify(res)); } catch {}
      setShowAuthModal(false);
      router.push('/host-stream');
    } catch (e) {
      console.error('Failed to create livestream', e);
      setAuthError('Could not start livestream. Please try again.');
    } finally {
      setIsStartingLive(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 lg:hidden">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
          <h1 className="text-xl font-semibold">Live TV</h1>
        </div>
        <Button onClick={handleStartLivestream} size="sm">Start Livestream</Button>
      </header>

      {/* Main Content */}
      <main className="px-4 lg:px-8 lg:ml-64 pb-20 lg:pb-8">
        <LiveStreamsList />
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 lg:hidden z-50">
        <div className="flex items-center justify-around py-2">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.href)}
                className={`flex flex-col items-center py-2 px-4 transition-colors ${
                  activeTab === tab.id
                    ? 'text-blue-500'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className="text-xs font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Sidebar Navigation - Desktop */}
      <nav className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 flex-col p-6 z-10">
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <Image
              src="/TFN-new.png"
              alt="TFN Logo"
              width={50}
              height={50}
              className="rounded-full"
            />
            <div className="relative">
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-800"></div>
            </div>
          </div>
        </div>

        <div className="space-y-2 flex-1">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id, tab.href)}
                className={`w-full flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Authorization Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowAuthModal(false)} />
          <div className="relative z-[101] w-[90%] max-w-md rounded-2xl bg-slate-800 border border-slate-700 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">Authorization Required</h3>
            <p className="text-sm text-slate-300 mb-4">Enter the admin code to start a livestream.</p>
            <input
              type="password"
              value={authCode}
              onChange={(e) => setAuthCode(e.target.value)}
              placeholder="Enter code"
              className="w-full rounded-lg bg-slate-900 border border-slate-700 px-3 py-2 outline-none focus:border-blue-500"
            />
            {authError && <p className="text-red-400 text-sm mt-2">{authError}</p>}
            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="outline" disabled={isStartingLive} onClick={() => setShowAuthModal(false)}>Cancel</Button>
              <Button disabled={isStartingLive} onClick={confirmStartLivestream}>{isStartingLive ? 'Starting…' : 'Start Livestream'}</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
