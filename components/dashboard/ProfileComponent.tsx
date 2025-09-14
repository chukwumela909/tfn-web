'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  IconUser,
  IconVideo,
  IconWallet,
  IconChevronRight,
  IconUserPlus,
} from '@tabler/icons-react';
import { ApiService } from '@/lib/api-service';

interface UserData {
  channelName: string;
  email: string;
  channelImage?: string;
  userId: string;
}

export default function ProfileComponent() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

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

  const handleStartLivestream = () => {
    // This will be handled by the parent dashboard component
    console.log('Navigate to go-live tab');
  };

  const handleWallet = () => {
    router.push('/wallet');
  };

  if (isLoading) {
    return (
      <div className="px-4 lg:px-8 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 lg:px-8 flex items-center justify-center min-h-[400px]">
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
    <div className="px-4 lg:px-8">
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
        </motion.div>
      </div>
    </div>
  );
}
