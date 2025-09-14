'use client';

import { useState } from 'react';
import Image from 'next/image';
import Carousel from '@/components/ui/carousel';
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconVolumeOff,
  IconVolume,
} from '@tabler/icons-react';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
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

  const LiveStreamViewer = dynamic(() => import('../dashboard/StreamPlay'), {
  ssr: false, // Disable server-side rendering for this component
  loading: () => <p>Loading stream...</p>
});



  return (
    <div className="px-4 lg:px-8">
     <LiveStreamViewer  />

      {/* Aceternity Carousel Section */}
      <section className="lg:mb-8">
        <h2 className="text-xl lg:text-2xl font-bold mb-4 lg:mb-6">Featured Content</h2>
        <div className="relative overflow-hidden w-full">
          <Carousel slides={slideData} />
        </div>
      </section>
    </div>
  );
}
