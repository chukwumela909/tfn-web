'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import MuxPlayer from '@mux/mux-player-react';
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
];

export default function HomeComponent() {
  const [selectedImage, setSelectedImage] = useState<{ title: string; src: string } | null>(null);
  const [latestStream, setLatestStream] = useState<any>(null);
  const [loadingStream, setLoadingStream] = useState(true);

  // Fetch the latest active stream
  useEffect(() => {
    const fetchLatestStream = async () => {
      try {
        const response = await fetch('/api/streams/list?status=idle');
        if (response.ok) {
          const data = await response.json();
          if (data.streams && data.streams.length > 0) {
            // Get the first (latest) stream
            setLatestStream(data.streams[0]);
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
                {/* <span className="text-slate-400 text-sm">
                  {latestStream.viewerCount || 0} watching
                </span> */}
              </div>
            </div>
          </div>
          <div className="w-full aspect-video bg-slate-900 rounded-lg overflow-hidden">
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
