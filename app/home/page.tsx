'use client';

import { useState } from 'react';
import Image from 'next/image';
import Carousel from '@/components/ui/carousel';
import { useRouter } from 'next/navigation';
import {
  IconSearch,
  IconPlus,
  IconHome,
  IconDeviceTv,
  IconVideo,
  IconUser,
  IconPlayerPlay,
  IconPlayerPause,
  IconVolumeOff,
  IconVolume,
  IconLogout,
} from '@tabler/icons-react';

// Sample slider images converted to carousel format
const slideData = [
  {
    title: "Fellowship Network",
    src: "/slider-images/image-1.jpg",
  },
  {
    title: "Live Worship",
    src: "/slider-images/image-2.jpg",
  },
  {
    title: "Sunday Service",
    src: "/slider-images/image-3.jpg",
  },
  {
    title: "Prayer Meeting",
    src: "/slider-images/image-4.jpg",
  },
  {
    title: "Bible Study",
    src: "/slider-images/image-5.jpg",
  },
  {
    title: "Youth Service",
    src: "/slider-images/image-6.jpg",
  },
  {
    title: "Community",
    src: "/slider-images/image-7.jpg",
  },
  {
    title: "Outreach",
    src: "/slider-images/image-8.jpg",
  },
  {
    title: "Testimonies",
    src: "/slider-images/image-9.jpg",
  },
  {
    title: "Ministry",
    src: "/slider-images/image-10.jpg",
  },
  {
    title: "Events",
    src: "/slider-images/image-11.jpg",
  },
  {
    title: "Resources",
    src: "/slider-images/image-12.jpg",
  },
  {
    title: "Connect",
    src: "/slider-images/image-13.jpg",
  },
  {
    title: "Blessing",
    src: "/slider-images/image-14.jpg",
  },
];

export default function HomePage() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const router = useRouter();

  const navigationTabs = [
    { id: 'home', icon: IconHome, label: 'Home', href: '/home' },
    { id: 'live-tv', icon: IconDeviceTv, label: 'Live TV', href: '/live-tv' },
    { id: 'go-live', icon: IconVideo, label: 'Go Live', href: '/go-live' },
    { id: 'profile', icon: IconUser, label: 'Profile', href: '/profile' },
  ];

  const handleTabClick = (tabId: string, href?: string) => {
    setActiveTab(tabId);
    if (href && href !== '/home') {
      router.push(href);
    }
  };

  const handleLogout = () => {
    // Show confirmation dialog
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    // Clear all authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_name');
    localStorage.removeItem('current_live_id');
    localStorage.removeItem('live_quality_preference');
    localStorage.removeItem('live_notifications');
    localStorage.removeItem('auto_join_mode');

    // Redirect to auth page
    router.push('/auth');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header - Mobile Only */}
      <header className="flex items-center justify-between p-4 lg:hidden">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Image
              src="/TFN-new.png"
              alt="TFN Logo"
              width={40}
              height={40}
              className="rounded-full"
            />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></div>
          </div>
          
          <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <IconPlus className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <IconSearch className="w-5 h-5 text-white" />
          </button>
          <button
            onClick={handleLogout}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors"
            title="Logout"
          >
            <IconLogout className="w-5 h-5 text-white" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 lg:px-8 lg:ml-64 pb-20 lg:pb-8">
        {/* Live Channels Section */}
        <section className="mb-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Live Channels</h2>
          
          {/* Video Player */}
          <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl overflow-hidden aspect-video max-w-6xl mx-auto">
            {/* Live Badge */}
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span>LIVE</span>
              </span>
            </div>

            {/* Video Content */}
            <div className="relative w-full h-full flex items-center justify-center">
              <Image
                src="/TFN-new.png"
                alt="TFN Live Stream"
                width={300}
                height={200}
                className="opacity-80"
              />
              
              {/* Play/Pause Overlay */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/40 transition-colors group"
              >
                <div className="w-12 h-12 lg:w-16 lg:h-16 bg-white/90 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                  {isPlaying ? (
                    <IconPlayerPause className="w-6 h-6 lg:w-8 lg:h-8 text-slate-900" />
                  ) : (
                    <IconPlayerPlay className="w-6 h-6 lg:w-8 lg:h-8 text-slate-900 ml-1" />
                  )}
                </div>
              </button>

              {/* Volume Control */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="absolute bottom-4 right-4 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
              >
                {isMuted ? (
                  <IconVolumeOff className="w-5 h-5 text-white" />
                ) : (
                  <IconVolume className="w-5 h-5 text-white" />
                )}
              </button>
            </div>

            {/* Channel Info */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 lg:p-6">
              <div className="flex items-center space-x-3">
                <Image
                  src="/TFN-new.png"
                  alt="TFN"
                  width={40}
                  height={40}
                  className="rounded-full"
                />
                <div>
                  <h3 className="font-bold text-lg">TFN</h3>
                  <p className="text-sm lg:text-base text-gray-300">Live Stream</p>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination Dots */}
          {/* <div className="flex justify-center space-x-2 mt-4 lg:mt-6">
            {Array.from({ length: 12 }).map((_, index) => (
              <button
                key={index}
                className={`w-2 h-2 lg:w-3 lg:h-3 rounded-full transition-colors ${
                  index === 4 ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div> */}
        </section>

        {/* Aceternity Carousel Section */}
        <section className=" lg:mb-8">
          <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Featured Content</h2>
          <div className="relative overflow-hidden w-full ">
            <Carousel slides={slideData} />
          </div>
        </section>
      </main>

      {/* Bottom Navigation - Mobile */}
    <nav
      className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 lg:hidden z-50"
    >
      <div className="flex items-center justify-around py-2">
        {navigationTabs.map((tab) => {
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
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

        {/* Desktop Search and Add buttons */}
        <div className="space-y-3 pt-6 border-t border-slate-700">
          <button className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors">
            <IconPlus className="w-5 h-5" />
            <span className="font-medium">Create</span>
          </button>
          <button className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors">
            <IconSearch className="w-5 h-5" />
            <span className="font-medium">Search</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <IconLogout className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
