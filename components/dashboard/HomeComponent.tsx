'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import MuxPlayer from '@mux/mux-player-react';
import Autoplay from 'embla-carousel-autoplay';

interface Comment {
  _id: string;
  streamId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

// Sample slider images converted to carousel format
const slideData = [
  {
    title: "Image 1",
    src: "/new_images/img1.jpg",
  },
  {
    title: "Image 2",
    src: "/new_images/img2.png",
  },
  {
    title: "Image 3",
    src: "/new_images/img3.png",
  },
  {
    title: "Image 4",
    src: "/new_images/img4.jpg",
  },
  {
    title: "Image 5",
    src: "/new_images/img5.jpg",
  },
];

export default function HomeComponent() {
  const [selectedImage, setSelectedImage] = useState<{ title: string; src: string } | null>(null);
  const [latestStream, setLatestStream] = useState<any>(null);
  const [loadingStream, setLoadingStream] = useState(true);
  const [viewerId, setViewerId] = useState<string>('');
  const [simulatedViewerCount, setSimulatedViewerCount] = useState(0);
  const [showChat, setShowChat] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [viewerConfig, setViewerConfig] = useState({ min: 900000, max: 1000000, speed: 1000, active: true });

  const autoplayPlugin = useRef(
    Autoplay({ delay: 5000, stopOnInteraction: false })
  );

  // Fetch viewer config from API
  useEffect(() => {
    const fetchViewerConfig = async () => {
      try {
        const response = await fetch('/api/admin/viewer-config?streamId=global');
        if (response.ok) {
          const data = await response.json();
          setViewerConfig({
            min: data.config.minViewers,
            max: data.config.maxViewers,
            speed: data.config.variationSpeed,
            active: data.config.isActive,
          });
        }
      } catch (error) {
        console.error('Error fetching viewer config:', error);
      }
    };

    fetchViewerConfig();
    // Poll for config updates every 5 seconds
    const interval = setInterval(fetchViewerConfig, 5000);
    return () => clearInterval(interval);
  }, []);

  // Generate random viewer count based on dynamic config
  useEffect(() => {
    if (!viewerConfig.active) return;

    // Initial random count
    const generateRandomCount = () => {
      return Math.floor(Math.random() * (viewerConfig.max - viewerConfig.min + 1)) + viewerConfig.min;
    };

    setSimulatedViewerCount(generateRandomCount());

    // Update count based on config speed
    const interval = setInterval(() => {
      setSimulatedViewerCount(prev => {
        // Small random change (-500 to +500) to make it look more realistic
        const change = Math.floor(Math.random() * 1000) - 500;
        let newCount = prev + change;

        // Keep it within bounds from config
        if (newCount < viewerConfig.min) newCount = viewerConfig.min;
        if (newCount > viewerConfig.max) newCount = viewerConfig.max;

        return newCount;
      });
    }, viewerConfig.speed);

    return () => clearInterval(interval);
  }, [viewerConfig]);

  // Generate unique viewer ID
  useEffect(() => {
    let id = localStorage.getItem('viewerId');
    if (!id) {
      id = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('viewerId', id);
    }
    setViewerId(id);
    console.log('Home page viewerId:', id);
  }, []);

  // Join site tracking when home page loads
  useEffect(() => {
    if (!viewerId) return;

    const joinSite = async () => {
      try {
        await fetch('/api/streams/view/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ muxStreamId: 'site_visitors', viewerId }),
        });
        console.log('Joined site from home page:', viewerId);
      } catch (err) {
        console.error('Failed to join site from home:', err);
      }
    };

    joinSite();

    // Leave site when page unloads
    const handleBeforeUnload = () => {
      navigator.sendBeacon('/api/streams/view/leave',
        JSON.stringify({ muxStreamId: 'site_visitors', viewerId })
      );
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      fetch('/api/streams/view/leave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ muxStreamId: 'site_visitors', viewerId }),
      }).catch(console.error);
    };
  }, [viewerId]);

  // Send heartbeat every 10 seconds
  useEffect(() => {
    if (!viewerId) return;

    const heartbeat = setInterval(async () => {
      try {
        await fetch('/api/streams/view/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ muxStreamId: 'site_visitors', viewerId }),
        });
      } catch (err) {
        console.error('Heartbeat failed:', err);
      }
    }, 10000);

    return () => clearInterval(heartbeat);
  }, [viewerId]);

  // Fetch the latest active stream
  useEffect(() => {
    const fetchLatestStream = async () => {
      try {
        const response = await fetch('/api/streams/list?status=idle');
        if (response.ok) {
          const data = await response.json();
          console.log('HomeComponent - Fetched streams:', data.streams);
          if (data.streams && data.streams.length > 0) {
            // Get the first (latest) stream
            const stream = data.streams[0];
            console.log('HomeComponent - Latest stream:', stream);
            console.log('HomeComponent - Stream muxStreamId:', stream.muxStreamId);
            setLatestStream(stream);
          }
        }
      } catch (error) {
        console.error('Error fetching latest stream:', error);
      } finally {
        setLoadingStream(false);
      }
    };

    fetchLatestStream();
    // Poll for updates every 15 seconds
    const interval = setInterval(fetchLatestStream, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!latestStream?.muxStreamId) return;

    const generateSimulatedComment = async () => {
      try {
        await fetch('/api/comments/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamId: latestStream.muxStreamId }),
        });
        // Don't need to handle response - fetchComments will pick it up
      } catch (error) {
        console.error('Error generating simulated comment:', error);
      }
    };

    // Generate initial burst of comments (2-3 comments)
    const initialBurst = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < initialBurst; i++) {
      setTimeout(() => generateSimulatedComment(), i * 3000);
    }

    // Continue generating comments every 15 seconds
    const commentInterval = setInterval(() => {
      generateSimulatedComment();
    }, 15000); // Every 15 seconds for slower, more natural comments

    return () => clearInterval(commentInterval);
  }, [latestStream?.muxStreamId]);

  // Fetch comments for the latest stream
  const fetchComments = async () => {
    if (!latestStream?.muxStreamId) {
      return;
    }

    try {
      const response = await fetch(`/api/comments/list?streamId=${latestStream.muxStreamId}`);
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (error) {
      console.error('HomeComponent - Error fetching comments:', error);
    }
  };

  // Poll for new comments every 1.5 seconds when stream is available
  useEffect(() => {
    if (!latestStream?.muxStreamId) return;

    fetchComments();
    const interval = setInterval(fetchComments, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [latestStream?.muxStreamId]);

  // Auto-scroll to bottom when new comments arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [comments]);

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="px-4 lg:px-8 pt-5">
      {/* Live Stream Section */}
      {loadingStream ? (
        <div className="mb-8 bg-slate-800/60 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-300">Loading stream...</p>
            </div>
          </div>
        </div>
      ) : latestStream ? (
        <div className="mb-8 bg-slate-800/60 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold">{latestStream.title}</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-600 text-white">
                  LIVE
                </span>
                <span className="text-slate-400 text-sm flex items-center gap-1">
                  <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                  {simulatedViewerCount.toLocaleString()} watching
                </span>
              </div>
            </div>
          </div>
          <div className="relative w-full aspect-video bg-slate-900 rounded-lg overflow-hidden">
            {/* Chat Toggle Button */}
            <button
              onClick={() => setShowChat(!showChat)}
              className="absolute top-4 right-4 z-20 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-lg transition-all duration-200"
              title={showChat ? "Hide chat" : "Show chat"}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {showChat ? (
                  // Eye slash icon (hide)
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                  />
                ) : (
                  // Chat bubble icon (show)
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                )}
              </svg>
            </button>

            {/* Live Chat Overlay - Left Side */}
            {showChat && (
              <div className="absolute left-0 top-0 bottom-0 w-80 z-10 flex flex-col ">

                <div className="p-3 border-b border-white/10">
                  <h3 className="text-white font-semibold text-sm">Live Chat</h3>
                </div>


                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <div key={comment._id} className="text-xs">
                        <div className="flex items-baseline gap-2">
                          <span className="font-semibold text-blue-400 text-lg">{comment.username}</span>
                          <span className="text-white/50">{formatTime(comment.createdAt)}</span>
                        </div>
                        <p className="text-white/90 mt-0.5 text-lg">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-white/50 text-xs text-center py-4">
                      No messages yet
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mux Player */}
            <MuxPlayer
              streamType="live"
              playbackId={latestStream.muxPlaybackId}
              metadata={{
                video_title: latestStream.title,
              }}
              primaryColor="#3b82f6"
              secondaryColor="#1e40af"
              autoPlay
              muted={false}
            />
          </div>
        </div>
      ) : (
        <div className="mb-8 bg-slate-800/60 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-center min-h-[200px]">
            <div className="text-center">
              <p className="text-slate-300 text-lg mb-2">No live streams at the moment</p>
              <p className="text-slate-400 text-sm">Check back later for live content</p>
            </div>
          </div>
        </div>
      )}

      {/* Featured Content Carousel */}
      <section className="lg:mb-8 mt-7">
        <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Featured Content</h2>
        <div className="relative overflow-hidden w-full">
          <Carousel
            plugins={[autoplayPlugin.current]}
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {slideData.map((slide, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 ">
                  <div className="p-1">
                    <div
                      className="relative h-[500px] md:h-[600px] lg:h-[700px] bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700 cursor-pointer hover:scale-105 transition-transform duration-200"
                      onClick={() => setSelectedImage(slide)}
                    >
                      <Image
                        src={slide.src}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-black/30" />
                      <div className="absolute bottom-4 left-4 right-4">
                        {/* <h3 className="text-white font-semibold text-lg mb-2">{slide.title}</h3> */}
                        {/* <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                            <span className="text-white text-sm">Live</span>
                          </div> */}
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex" />
            <CarouselNext className="hidden md:flex" />
          </Carousel>
        </div>

        <p className='mx-auto text-center mt-4'>Slide to see more</p>
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="relative max-w-4xl max-h-[90vh] w-full mx-4">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold z-10"
            >
              ✕ Close
            </button>
            <div className="relative w-full h-[80vh] bg-slate-900 rounded-xl overflow-hidden">
              <Image
                src={selectedImage.src}
                alt={selectedImage.title}
                fill
                className="object-fill  "
                sizes="90vw"
              />
            </div>
            <div className="mt-4 text-center">
              <h3 className="text-white text-xl font-semibold">{selectedImage.title}</h3>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
