'use client';

import { useState } from 'react';
import LiveStreamsList from '@/components/live/LiveStreamsList';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  IconHome,
  IconDeviceTv,
  IconVideo,
  IconUser,
} from '@tabler/icons-react';

export default function LiveTVPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('live-tv');

  const navigationTabs = [
    { id: 'home', icon: IconHome, label: 'Home', href: '/home' },
    { id: 'live-tv', icon: IconDeviceTv, label: 'Live TV', href: '/live-tv' },
    { id: 'go-live', icon: IconVideo, label: 'Go Live', href: '/go-live' },
    { id: 'profile', icon: IconUser, label: 'Profile', href: '/profile' },
  ];

  const handleTabClick = (tabId: string, href?: string) => {
    setActiveTab(tabId);
    if (href && href !== '/live-tv') {
      router.push(href);
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

        <Button
          onClick={() => router.push('/go-live')}
          size="sm"
        >
          Go Live
        </Button>
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

      {/* Desktop Sidebar would go here if needed */}
    </div>
  );
}
