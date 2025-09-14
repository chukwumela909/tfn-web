'use client';

import { useEffect, useState } from 'react';
import Loader from './Loader';

interface AppWrapperProps {
  children: React.ReactNode;
}

export default function AppWrapper({ children }: AppWrapperProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isFirstVisit, setIsFirstVisit] = useState(false);

  useEffect(() => {
    // Check if this is the user's first visit
    const hasVisited = localStorage.getItem('hasVisitedBefore');

    if (!hasVisited) {
      // First visit - show loader
      setIsFirstVisit(true);
      setIsLoading(true);

      const handleLoad = () => {
        const timer = setTimeout(() => {
          setIsLoading(false);
          // Mark that user has visited before
          localStorage.setItem('hasVisitedBefore', 'true');
        }, 100);
        return () => clearTimeout(timer);
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    } else {
      // Not first visit - don't show loader
      setIsFirstVisit(false);
      setIsLoading(false);
    }
  }, []);

  return (
    <>
      {isFirstVisit && <Loader />}
      <div className={`transition-all duration-700 ease-in-out ${isLoading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
        {children}
      </div>
    </>
  );
}
