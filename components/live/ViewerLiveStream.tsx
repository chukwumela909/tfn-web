// 'use client';

// import { useRef, useEffect, useState } from 'react';
// import { LivestreamService } from '@/lib/livestream-service';
// import { ZegoService } from '@/lib/zego-service';
// import { Button } from '@/components/ui/button';
// import { Card, CardContent } from '@/components/ui/card';
// import { LiveStream } from '@/lib/models/livestream';

// interface ViewerLiveStreamProps {
//   liveId: string;
// }

// export default function ViewerLiveStream({ liveId }: ViewerLiveStreamProps) {
//   const containerRef = useRef<HTMLDivElement>(null);
//   const videoRef = useRef<HTMLVideoElement>(null);
//   const [streamData, setStreamData] = useState<LiveStream | null>(null);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string>('');
//   const [viewCount, setViewCount] = useState(0);
//   const [isJoined, setIsJoined] = useState(false);
//   const [zegoInitialized, setZegoInitialized] = useState(false);
//   const [isPlaying, setIsPlaying] = useState(false);

//   useEffect(() => {
//     initializeZegoAndJoin();

//     // Update view count periodically
//     // const interval = setInterval(updateViewCount, 30000); // Every 30 seconds

//     return () => {
//     //   clearInterval(interval);
//       leaveStream();
//     };
//   }, [liveId]);

//   const initializeZegoAndJoin = async () => {
//     try {
//       // Initialize Zego SDK
//       const zegoService = ZegoService.getInstance();
//       const initialized = await zegoService.initializeZego();
//       setZegoInitialized(initialized);

//       if (initialized) {
//         console.log('Zego SDK initialized for viewer');
//         // await loadStreamDetails();
//         await joinStream();
//       } else {
//         setError('Failed to initialize streaming service');
//       }
//     } catch (error) {
//       console.error('Failed to initialize Zego viewer:', error);
//       setError('Failed to initialize streaming viewer');
//       setIsLoading(false);
//     }
//   };

// //   const loadStreamDetails = async () => {
// //     try {
// //       const result = await LivestreamService.getLiveStreamDetails(liveId);
// //       if (result.success && result.data) {
// //         setStreamData(result.data);
// //         setViewCount(result.data.viewCount || 0);
// //       } else {
// //         setError('Stream not found or inactive');
// //       }
// //     } catch (err) {
// //       setError('Failed to load stream details');
// //       console.error('Stream details error:', err);
// //     } finally {
// //       setIsLoading(false);
// //     }
// //   };

//   const joinStream = async () => {
//     try {
//       // First join the backend stream tracking
//       const result = await LivestreamService.joinLivestream(liveId);
//       if (result.success) {
//         setViewCount(result.viewCount || 0);

//         // Now join the Zego room to receive the stream
//         const zegoService = ZegoService.getInstance();
//         const userData = LivestreamService.getUserData();
//         const zegoInfo = LivestreamService.getZegoStreamInfo({ liveId }, userData);

//         // Login to Zego
//         const loginSuccess = await zegoService.loginUser({
//           userId: zegoInfo.userId,
//           userName: zegoInfo.userName
//         });

//         if (loginSuccess) {
//           // Join the room
//           const roomJoined = await zegoService.joinRoom({
//             roomId: zegoInfo.roomId,
//           });

//           if (roomJoined) {
//             setIsJoined(true);
//             console.log('Successfully joined Zego room as viewer');

//             // Set up stream listener to start playing when streams are available
//             zegoService.setOnStreamAdded((streamId: string, userId: string) => {
//               console.log(`Stream added: ${streamId} from user ${userId}`);
//               startPlayingStream("rtc01");
//             });

//           } else {
//             console.error('Failed to join Zego room');
//           }
//         } else {
//           console.error('Failed to login to Zego');
//         }
//       }
//     } catch (error) {
//       console.error('Failed to join stream:', error);
//       setError('Failed to join stream');
//     }
//   };

//   const startPlayingStream = async (streamId: string) => {
//     try {
//       const zegoService = ZegoService.getInstance();
      
//       // Start playing the remote stream
//       if (videoRef.current) {
//         const playSuccess = await zegoService.startPlaying(streamId, videoRef.current);
        
//         if (playSuccess) {
//           setIsPlaying(true);
//           console.log(`Started playing stream: ${streamId}`);
//         } else {
//           console.error('Failed to start playing stream');
//         }
//       }
//     } catch (error) {
//       console.error('Error starting stream playback:', error);
//     }
//   };

//   const leaveStream = async () => {
//     if (isJoined) {
//       try {
//         // Stop Zego playback and leave room
//         const zegoService = ZegoService.getInstance();
//         await zegoService.stopAllPlaying();
//         await zegoService.leaveRoom();

//         // Leave the backend stream tracking
//         const result = await LivestreamService.leaveLivestream(liveId);
//         if (result.success) {
//           setIsJoined(false);
//           setIsPlaying(false);
//         }
//       } catch (error) {
//         console.error('Failed to leave stream:', error);
//       }
//     }
//   };

// //   const updateViewCount = async () => {
// //     try {
// //       const result = await LivestreamService.getLiveStreamDetails(liveId);
// //       if (result.success && result.data) {
// //         setViewCount(result.data.viewCount || 0);
// //       }
// //     } catch (error) {
// //       console.error('Failed to update view count:', error);
// //     }
// //   };

//   if (isLoading) {
//     return (
//       <div className="w-full max-w-4xl mx-auto p-4">
//         <Card>
//           <CardContent className="flex items-center justify-center h-64">
//             <div className="text-center">
//               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
//               <p>Loading stream...</p>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   if (error || !streamData) {
//     return (
//       <div className="w-full max-w-4xl mx-auto p-4">
//         <Card>
//           <CardContent className="flex items-center justify-center h-64">
//             <div className="text-center">
//               <p className="text-red-500 mb-4">{error || 'Stream not available'}</p>
//               <Button onClick={() => window.location.reload()}>
//                 Try Again
//               </Button>
//             </div>
//           </CardContent>
//         </Card>
//       </div>
//     );
//   }

//   return (
//     <div className="w-full max-w-4xl mx-auto p-4">
//       <Card>
//         <CardContent className="p-0">
//           {/* Stream Header */}
//           <div className="p-4 border-b">
//             <div className="flex items-center justify-between">
//               <div>
//                 <h1 className="text-xl font-semibold">{streamData.hostChannel}</h1>
//                 <p className="text-gray-600">Live Stream</p>
//               </div>
//               <div className="flex items-center space-x-4">
//                 <div className="flex items-center space-x-1">
//                   <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
//                   <span className="text-red-500 font-medium">LIVE</span>
//                 </div>
//                 <div className="flex items-center space-x-1 text-gray-600">
//                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
//                   </svg>
//                   <span>{viewCount}</span>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Stream Player */}
//           <div className="relative aspect-video bg-black">
//             <video
//               ref={videoRef}
//               autoPlay
//               playsInline
//               controls
//               className="w-full h-full object-cover"
//               style={{ display: isPlaying ? 'block' : 'none' }}
//             />
            
//             {!isPlaying && (
//               <div
//                 ref={containerRef}
//                 className="w-full h-full flex items-center justify-center absolute top-0 left-0"
//                 id={`zego-player-${liveId}`}
//               >
//                 <div className="text-white text-center">
//                   {!zegoInitialized ? (
//                     <>
//                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
//                       <p>Initializing streaming service...</p>
//                     </>
//                   ) : !isJoined ? (
//                     <>
//                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
//                       <p>Connecting to stream...</p>
//                     </>
//                   ) : (
//                     <>
//                       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
//                       <p>Waiting for stream...</p>
//                     </>
//                   )}
//                 </div>
//               </div>
//             )}

//             {/* Stream Info Overlay */}
//             <div className="absolute bottom-4 left-4 right-4 bg-black/50 backdrop-blur-sm rounded-lg p-3">
//               <div className="flex items-center justify-between text-white">
//                 <div>
//                   <p className="font-medium">{streamData.hostChannel}</p>
//                   <p className="text-sm opacity-75">Stream ID: {streamData.liveId}</p>
//                 </div>
//                 <div className="text-right">
//                   <p className="text-sm">{viewCount} viewers</p>
//                   <p className="text-xs opacity-75">{streamData.streamType} stream</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Stream Actions */}
//           <div className="p-4 border-t">
//             <div className="flex gap-2">
//               <Button
//                 onClick={leaveStream}
//                 variant="outline"
//                 className="flex-1"
//               >
//                 Leave Stream
//               </Button>
//               <Button
//                 onClick={() => window.location.reload()}
//                 className="flex-1"
//               >
//                 Refresh
//               </Button>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
