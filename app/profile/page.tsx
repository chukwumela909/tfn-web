'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  IconUser,
  IconVideo,
  IconWallet,
  IconLogout,
  IconChevronRight,
  IconCamera,
  IconHome,
  IconDeviceTv,
  IconUserPlus,
} from '@tabler/icons-react';
import { ApiService } from '@/lib/api-service';

interface UserData {
  channelName: string;
  email: string;
  channelImage?: string;
  userId: string;
}

export default function ProfilePage() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();

  const navigationTabs = [
    { id: 'home', icon: IconHome, label: 'Home', href: '/home' },
    { id: 'live-tv', icon: IconDeviceTv, label: 'Live TV', href: '/live-tv' },
    { id: 'go-live', icon: IconVideo, label: 'Go Live', href: '/go-live' },
    { id: 'profile', icon: IconUser, label: 'Profile', href: '/profile' },
  ];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('auth_token');
      
      if (!token) {
        router.push('/auth');
        return;
      }

      const response = await ApiService.getUserData(token);
      
      if (response.success || response.channelName) {
        const userData: UserData = {
          channelName: response.channelName || response.user?.channelName || 'TFN',
          email: response.email || response.user?.email || 'greg@gmail.com',
          channelImage: response.channelImage || response.user?.channelImage,
          userId: response.userId || response.user?.id || token
        };
        
        setUserData(userData);
        
        // Store user data for future use
        localStorage.setItem('user_name', userData.channelName);
        localStorage.setItem('user_data', JSON.stringify(userData));
        setError('');
      } else {
        // If API fails, try to get data from localStorage as fallback
        const storedUserData = localStorage.getItem('user_data');
        const storedUserName = localStorage.getItem('user_name');
        
        if (storedUserData) {
          try {
            const parsedData = JSON.parse(storedUserData);
            setUserData(parsedData);
          } catch {
            // If parsing fails, create default data
            setUserData({
              channelName: storedUserName || 'TFN',
              email: 'greg@gmail.com',
              userId: token
            });
          }
        } else {
          setUserData({
            channelName: 'TFN',
            email: 'greg@gmail.com',
            userId: token
          });
        }
        setError('');
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    // Clear all stored data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    localStorage.removeItem('user_name');
    localStorage.removeItem('current_live_id');
    localStorage.removeItem('live_quality_preference');
    localStorage.removeItem('live_notifications');
    localStorage.removeItem('auto_join_mode');

    router.push('/auth');
  };

  const handleTabClick = (tabId: string, href?: string) => {
    setActiveTab(tabId);
    if (href && href !== '/profile') {
      router.push(href);
    }
  };

  const handleStartLivestream = () => {
    router.push('/go-live');
  };

  const handleWallet = () => {
    router.push('/wallet');
  };

  const handleUploadImage = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Here you would normally upload to your API
        // For now, we'll just show a placeholder
        console.log('Selected file:', file.name);
        alert('Image upload functionality will be implemented soon!');
      }
    };
    
    input.click();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchUserData}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-center p-4 border-b border-slate-700">
        <h1 className="text-xl font-semibold">Profile</h1>
      </header>

      {/* Main Content */}
      <main className="px-4 lg:px-8 lg:ml-64 pb-20 lg:pb-8">
        <div className="max-w-md mx-auto pt-8">
          {/* Profile Avatar Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-8"
          >
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 p-1 mx-auto mb-4">
                <div className="w-full h-full rounded-full bg-slate-800 flex items-center justify-center overflow-hidden">
                  {userData?.channelImage ? (
                    <Image
                      src={userData.channelImage}
                      alt={userData.channelName}
                      width={120}
                      height={120}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <Image
                      src="/TFN-new.png"
                      alt="TFN Logo"
                      width={80}
                      height={80}
                      className="opacity-80"
                    />
                  )}
                </div>
              </div>
            </div>
            
            <h2 className="text-2xl font-bold mb-2">{userData?.channelName || 'TFN'}</h2>
            <p className="text-slate-400">{userData?.email || 'greg@gmail.com'}</p>
          </motion.div>

          {/* Menu Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-4"
          >
            {/* Upload Channel Image */}
            <button
              onClick={handleUploadImage}
              className="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <IconUserPlus className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-lg font-medium">Upload Channel Image</span>
              </div>
              <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* Start Livestream */}
            <button
              onClick={handleStartLivestream}
              className="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <IconVideo className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-lg font-medium">Start Livestream</span>
              </div>
              <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* Your Wallet */}
            <button
              onClick={handleWallet}
              className="w-full bg-slate-800/50 hover:bg-slate-700/50 rounded-xl p-4 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                  <IconWallet className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-lg font-medium">Your Wallet</span>
              </div>
              <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            </button>

            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full bg-slate-800/50 hover:bg-red-500/20 rounded-xl p-4 flex items-center justify-between transition-colors group"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <IconLogout className="w-6 h-6 text-red-400" />
                </div>
                <span className="text-lg font-medium text-red-400">Logout</span>
              </div>
              <IconChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors" />
            </button>
          </motion.div>
        </div>
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
    </div>
  );
}
