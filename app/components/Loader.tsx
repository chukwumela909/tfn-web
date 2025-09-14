'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function Loader() {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsLoading(false), 500); // Small delay after 100%
          return 100;
        }
        return prev + 2; // Increase by 2% every 40ms
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  if (!isLoading) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900">
      <div className="flex flex-col items-center space-y-8 fade-in-up font-[var(--font-lato)]">
        {/* Logo */}
        <div className="relative">
          <Image
            src="/TFN-new.png"
            alt="TFN Logo"
            width={140}
            height={140}
            priority
            className="logo-float drop-shadow-lg"
          />
        </div>
        
        {/* Progress Bar */}
        <div className="w-80 max-w-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              Loading TFN
            </span>
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-150 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        {/* Loading text */}
        <p className="text-gray-600 dark:text-gray-400 text-lg font-light tracking-wide">
          Welcome to TFN
        </p>
      </div>
    </div>
  );
}
