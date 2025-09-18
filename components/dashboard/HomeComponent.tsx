'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolumeOff,
  IconVolume,
} from '@tabler/icons-react';
import { useRef } from 'react';
import dynamic from 'next/dynamic';
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

export default function HomeComponent() {
  const [selectedImage, setSelectedImage] = useState<{ title: string; src: string } | null>(null);

  const LiveStreamViewer = dynamic(() => import('../dashboard/StreamPlay'), {
  ssr: false, // Disable server-side rendering for this component
  loading: () => <p>Loading stream...</p>
});



  return (
    <div className="px-4 lg:px-8 pt-5">
     <LiveStreamViewer  />

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
                        className="relative h-64 md:h-72 lg:h-80 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl overflow-hidden border border-slate-700 cursor-pointer hover:scale-105 transition-transform duration-200"
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
                          <h3 className="text-white font-semibold text-lg mb-2">{slide.title}</h3>
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
