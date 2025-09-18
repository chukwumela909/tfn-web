'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import {
  IconHome,
  IconDeviceTv,
  IconVideo,
  IconUser,
  IconSearch,
  IconPlus,
  IconLogout,
} from '@tabler/icons-react';

// Import page components
import HomeComponent from '@/components/dashboard/HomeComponent';
import LiveTVComponent from '@/components/dashboard/LiveTVComponent';
// import GoLiveComponent from '@/components/dashboard/GoLiveComponent';
import ProfileComponent from '@/components/dashboard/ProfileComponent';

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState('home');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Base navigation tabs available to all users
  const baseNavigationTabs = [
    { id: 'home', icon: IconHome, label: 'Home', component: HomeComponent },
    { id: 'live-tv', icon: IconDeviceTv, label: 'Live TV', component: LiveTVComponent },
    // { id: 'go-live', icon: IconVideo, label: 'Go Live', component: GoLiveComponent },
  ];

  // Additional tabs for authenticated users only
  const authenticatedTabs = [
    { id: 'profile', icon: IconUser, label: 'Profile', component: ProfileComponent },
  ];

  // Dynamic navigation tabs based on authentication status
  const navigationTabs = isAuthenticated 
    ? [...baseNavigationTabs, ...authenticatedTabs]
    : baseNavigationTabs;

  // Set active tab based on current path - only respond to /dashboard
  useEffect(() => {
    // Always stay on dashboard route and default to home tab
    if (pathname !== '/dashboard') {
      window.history.replaceState({}, '', '/dashboard');
    }
    
    // If not authenticated and trying to access profile, reset to home
    if (activeTab === 'profile' && !isAuthenticated) {
      setActiveTab('home');
    }
  }, [pathname, isAuthenticated, activeTab]);

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
  }, []);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    // Keep URL as /dashboard - don't change the path
    // This prevents 404s on refresh
  };

  const handleLogout = () => {
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

    router.push('/auth');
  };

  // Get the current component to render
  const getCurrentComponent = () => {
    const currentTab = navigationTabs.find(tab => tab.id === activeTab);
    if (currentTab) {
      const Component = currentTab.component;
      return <Component />;
    }
    return <HomeComponent />;
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
            {/* <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-900"></div> */}
          </div>
          
          {/* <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <IconPlus className="w-5 h-5 text-white" />
          </button> */}
        </div>

        <div className="flex items-center space-x-2">
          {!isAuthenticated && (
            <button 
              onClick={() => router.push('/auth')}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded-full text-sm font-medium transition-colors"
            >
              Sign In
            </button>
          )}
          
          <button className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors">
            <IconSearch className="w-5 h-5 text-white" />
          </button>
          
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-500/80 transition-colors"
              title="Logout"
            >
              <IconLogout className="w-5 h-5 text-white" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="lg:ml-64 pb-20 lg:pb-8">
        {getCurrentComponent()}
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-sm border-t border-slate-700 lg:hidden z-50">
        <div className="flex items-center justify-around py-2">
          {navigationTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
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
      <nav className="hidden lg:flex  fixed left-0  top-0 bottom-0 w-64 bg-slate-800/95 backdrop-blur-sm border-r border-slate-700 z-10">
        <div className="flex flex-col h-full w-full p-6 overflow-y-auto">
          {/* Logo Section */}
          <div className="flex-shrink-0 mb-8">
            <div className="flex items-center space-x-3">
              <Image
                src="/TFN-new.png"
                alt="TFN Logo"
                width={70}
                height={70}
                className="rounded-full"
              />
              <div className="relative">
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-800"></div>
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 min-h-0 flex flex-col">
            <div className="space-y-2 flex-1">
              {navigationTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center space-x-3 py-3 px-4 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex-shrink-0 space-y-3 pt-6 border-t border-slate-700 mt-6">
              {!isAuthenticated && (
                <button 
                  onClick={() => router.push('/auth')}
                  className="w-full flex items-center justify-center py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
                >
                  <span>Sign In</span>
                </button>
              )}
              
              {/* <button className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors">
                <IconPlus className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Create</span>
              </button>
              <button className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-400 hover:text-white hover:bg-slate-700 transition-colors">
                <IconSearch className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">Search</span>
              </button> */}

              {/* Legal Links */}
              <div className="space-y-1">
                <button 
                  onClick={() => router.push('/privacy')}
                  className="w-full text-left py-2 px-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Privacy Policy
                </button>
                <button 
                  onClick={() => router.push('/terms')}
                  className="w-full text-left py-2 px-4 text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Terms & Conditions
                </button>
              </div>
              
              {isAuthenticated && (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-3 py-3 px-4 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                >
                  <IconLogout className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">Logout</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
