'use client';

import { useState } from 'react';
import HostLiveStream from '@/components/live/HostLiveStream';
import RTMPGoLive from '@/components/live/RTMPGoLive';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  IconHome,
  IconDeviceTv,
  IconVideo,
  IconUser,
} from '@tabler/icons-react';

type StreamType = 'normal' | 'rtmp' | null;

export default function GoLivePage() {
  const [selectedStreamType, setSelectedStreamType] = useState<StreamType>(null);
  const [activeTab, setActiveTab] = useState('go-live');
  const router = useRouter();

  const navigationTabs = [
    { id: 'home', icon: IconHome, label: 'Home', href: '/home' },
    { id: 'live-tv', icon: IconDeviceTv, label: 'Live TV', href: '/live-tv' },
    { id: 'profile', icon: IconUser, label: 'Profile', href: '/profile' },
  ];

  const handleTabClick = (tabId: string, href?: string) => {
    setActiveTab(tabId);
    if (href && href !== '/go-live') {
      router.push(href);
    }
  };

  const handleStreamEnd = () => {
    setSelectedStreamType(null);
    router.push('/home');
  };

  if (selectedStreamType === 'normal') {
    return <HostLiveStream onStreamEnd={handleStreamEnd} />;
  }

  if (selectedStreamType === 'rtmp') {
    return <RTMPGoLive />;
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white p-4 pb-20 lg:pb-4">
      <div className="max-w-4xl mx-auto lg:ml-64">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Go Live</h1>
          <Button
            variant="outline"
            onClick={() => router.back()}
          >
            ← Back
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Normal Live Stream Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedStreamType('normal')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <span>Camera Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Start streaming directly with your device camera and microphone.
                Perfect for live talks, performances, and real-time interactions.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Real-time streaming</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Built-in chat support</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>High quality video</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RTMP Stream Card */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedStreamType('rtmp')}>
            <CardHeader>
              <CardTitle className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span>RTMP Stream</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Use external broadcasting software like OBS, Streamlabs, or XSplit.
                Ideal for professional streaming setups and advanced production.
              </p>
              <div className="space-y-2 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Professional broadcasting</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Advanced production tools</span>
                </div>
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Multiple input sources</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            Choose your streaming method to get started
          </p>
          <div className="flex justify-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/live-tv')}
            >
              Browse Live Streams
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/home')}
            >
              Back to Home
            </Button>
          </div>
        </div>
      </div>

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
    </div>
  );
}
