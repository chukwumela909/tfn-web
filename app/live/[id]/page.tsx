'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import MuxPlayer from '@mux/mux-player-react';
import { Button } from '@/components/ui/button';
import { AlertCircle, User, Eye, Send } from 'lucide-react';

interface StreamInfo {
  _id: string;
  title: string;
  userId: string;
  muxStreamId: string;
  muxPlaybackId: string;
  status: 'active' | 'idle' | 'ended';
  viewerCount?: number; // Add viewer count
  createdAt: string;
  updatedAt: string;
}

interface Comment {
  _id: string;
  streamId: string;
  userId: string;
  username: string;
  text: string;
  createdAt: string;
}

export default function LiveStreamPage() {
  const params = useParams();
  const router = useRouter();
  const streamId = params.id as string;

  const [streamInfo, setStreamInfo] = useState<StreamInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewerId, setViewerId] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [simulatedViewerCount, setSimulatedViewerCount] = useState(0);

  // Generate random viewer count between 40,000 and 70,000
  useEffect(() => {
    // Initial random count
    const generateRandomCount = () => {
      return Math.floor(Math.random() * (70000 - 40000 + 1)) + 40000;
    };
    
    setSimulatedViewerCount(generateRandomCount());

    // Update count every 3-5 seconds with slight variations
    const interval = setInterval(() => {
      setSimulatedViewerCount(prev => {
        // Small random change (-500 to +500) to make it look more realistic
        const change = Math.floor(Math.random() * 1000) - 500;
        let newCount = prev + change;
        
        // Keep it within bounds
        if (newCount < 40000) newCount = 40000;
        if (newCount > 70000) newCount = 70000;
        
        return newCount;
      });
    }, Math.random() * 2000 + 3000); // Random interval between 3-5 seconds

    return () => clearInterval(interval);
  }, []);

  // Server-side simulated comments - Generate comments on server every 0.8 seconds
  useEffect(() => {
    if (!streamId) return;

    const generateSimulatedComment = async () => {
      try {
        await fetch('/api/comments/simulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ streamId }),
        });
        // Don't need to handle response - fetchComments will pick it up
      } catch (error) {
        console.error('Error generating simulated comment:', error);
      }
    };

    // Generate initial burst of comments (5-8 comments quickly)
    const initialBurst = Math.floor(Math.random() * 4) + 5;
    for (let i = 0; i < initialBurst; i++) {
      setTimeout(() => generateSimulatedComment(), i * 200);
    }

    // Continue generating comments every 0.8 seconds for fast flow
    const commentInterval = setInterval(() => {
      generateSimulatedComment();
    }, 800); // Every 0.8 seconds for rapid comments

    return () => clearInterval(commentInterval);
  }, [streamId]);

  // Generate unique viewer ID and username
  useEffect(() => {
    let id = localStorage.getItem('viewerId');
    if (!id) {
      id = `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('viewerId', id);
    }
    setViewerId(id);

    // Get username - prioritize channel_name for signed-in users
    const channelName = localStorage.getItem('channel_name');
    
    if (channelName && channelName !== 'null' && channelName !== 'undefined') {
      // Use signed-in user's channel name
      setUsername(channelName);
    } else {
      // For guests, use or generate guest username
      let guestName = localStorage.getItem('guest_username');
      if (!guestName) {
        guestName = `Guest${Math.floor(Math.random() * 10000)}`;
        localStorage.setItem('guest_username', guestName);
      }
      setUsername(guestName);
    }
  }, []);

  // Join site when page loads (track all visitors)
  useEffect(() => {
    if (!viewerId) return;

    const joinSite = async () => {
      try {
        // Use a fixed "site" identifier instead of streamId
        await fetch('/api/streams/view/join', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ muxStreamId: 'site_visitors', viewerId }),
        });
        console.log('Joined site as visitor:', viewerId);
      } catch (err) {
        console.error('Failed to join site:', err);
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
      // Leave site when component unmounts
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
    }, 10000); // Every 10 seconds

    return () => clearInterval(heartbeat);
  }, [viewerId]);

  // Handle page visibility (tab switching)
  useEffect(() => {
    if (!viewerId) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        // Tab hidden - leave site
        try {
          await fetch('/api/streams/view/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ muxStreamId: 'site_visitors', viewerId }),
          });
          console.log('Left site (tab hidden)');
        } catch (err) {
          console.error('Failed to leave site:', err);
        }
      } else {
        // Tab visible again - rejoin site
        try {
          await fetch('/api/streams/view/join', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ muxStreamId: 'site_visitors', viewerId }),
          });
          console.log('Rejoined site (tab visible)');
        } catch (err) {
          console.error('Failed to rejoin site:', err);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [viewerId]);

  useEffect(() => {
    fetchStreamInfo();
    // Poll for stream status every 10 seconds
    const interval = setInterval(fetchStreamInfo, 10000);
    return () => clearInterval(interval);
  }, [streamId]);

  const fetchStreamInfo = async () => {
    console.log('Fetching stream info for ID:', streamId);
    try {
      const response = await fetch(`/api/streams/get?muxStreamId=${streamId}`);
      if (!response.ok) throw new Error('Stream not found');
      
      const data = await response.json();
      console.log('Fetched stream data:', data);
      setStreamInfo(data.stream);
      setError('');
    } catch (err) {
      console.error('Error fetching stream:', err);
      setError('Stream not found or unavailable');
    } finally {
      setLoading(false);
    }
  };

  // Fetch comments
  const fetchComments = async () => {
    if (!streamId) return;
    
    try {
      const response = await fetch(`/api/comments/list?streamId=${streamId}`);
      if (response.ok) {
        const data = await response.json();
        const newComments = data.comments;
        
        setComments(newComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  // Poll for new comments every 1.5 seconds for fast updates
  useEffect(() => {
    if (!streamId) return;
    
    fetchComments();
    const interval = setInterval(fetchComments, 1500); // Poll every 1.5 seconds
    
    return () => clearInterval(interval);
  }, [streamId]);

  // Send comment
  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!commentText.trim() || !viewerId || sendingComment) return;
    
    // Strictly get the latest channel_name for authenticated users
    const channelName = localStorage.getItem('channel_name');
    const finalUsername = (channelName && channelName !== 'null' && channelName !== 'undefined') 
      ? channelName 
      : username;
    
    if (!finalUsername) return; // Don't send if no username available
    
    setSendingComment(true);
    try {
      const response = await fetch('/api/comments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          streamId,
          userId: viewerId,
          username: finalUsername, // Use strictly verified username
          text: commentText.trim(),
        }),
      });

      if (response.ok) {
        setCommentText('');
        fetchComments(); // Refresh comments
      }
    } catch (error) {
      console.error('Error sending comment:', error);
    } finally {
      setSendingComment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading stream...</p>
        </div>
      </div>
    );
  }

  if (error || !streamInfo) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <AlertCircle className="mx-auto mb-4 text-red-500" size={48} />
          <h2 className="text-2xl font-bold mb-2">Stream Not Available</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <Button onClick={() => router.back()} variant="outline">
            ← Go Back
          </Button>
        </div>
      </div>
    );
  }

  const isLive = streamInfo.status === 'active';

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-slate-800">
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="bg-slate-800 hover:bg-slate-700 border-slate-700"
        >
          ← Back
        </Button>
        <div className="flex items-center space-x-2">
          {isLive ? (
            <>
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </div>
              <span className="text-red-500 font-medium">LIVE</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <span className="text-yellow-500 font-medium">OFFLINE</span>
            </>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        {/* Stream Status Banner */}
        {!isLive && (
          <div className="mb-4 bg-yellow-900/30 border border-yellow-700/50 rounded-lg p-4">
            <p className="text-yellow-300 text-center">
              Stream is currently offline. Waiting for host to start streaming...
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2">
            {isLive && (
              <div className="bg-red-600 text-white px-4 py-2 rounded-t-lg flex items-center gap-2 mb-0">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
                <span className="font-semibold">LIVE NOW</span>
              </div>
            )}

            <div className={`bg-black ${isLive ? 'rounded-b-lg' : 'rounded-lg'} overflow-hidden shadow-2xl`}>
              <MuxPlayer
                playbackId={streamInfo.muxPlaybackId}
                metadata={{
                  video_title: streamInfo.title,
                }}
                streamType="live"
                autoPlay
                muted={false}
                style={{ width: '100%', aspectRatio: '16/9' }}
              />
            </div>
          </div>

          {/* Stream Info Sidebar */}
          <div className="space-y-4">
            {/* Stream Details Card */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-6">
              <h1 className="text-2xl font-bold mb-4">{streamInfo.title}</h1>
              
              <div className="space-y-3">
                {/* <div className="flex items-center gap-3 text-slate-300">
                  <User className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Streamer</div>
                    <div className="font-medium">Channel</div>
                  </div>
                </div> */}

                <div className="flex items-center gap-3 text-slate-300">
                  <Eye className="w-5 h-5 text-slate-400" />
                  <div>
                    <div className="text-xs text-slate-500">Viewers</div>
                    <div className="font-medium">
                      {simulatedViewerCount.toLocaleString()} watching
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700">
                  <div className="text-xs text-slate-500 mb-1">Started</div>
                  <div className="text-sm text-slate-300">
                    {new Date(streamInfo.createdAt).toLocaleString()}
                  </div>
                </div>

                <div>
                  <div className="text-xs text-slate-500 mb-1">Status</div>
                  <div className="text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      isLive 
                        ? 'bg-red-600 text-white' 
                        : 'bg-yellow-600 text-white'
                    }`}>
                      {isLive ? 'LIVE' : 'OFFLINE'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <h2 className="text-lg font-semibold mb-3">Live Chat</h2>
              
              {/* Comments List - Scrollable */}
              <div className="h-[500px] overflow-y-auto mb-3 space-y-2 bg-slate-900/50 rounded-lg p-3 scroll-smooth">
                {comments.length === 0 ? (
                  <div className="text-center text-slate-500 text-sm py-8">
                    No comments yet. Be the first to comment!
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment._id} className="text-sm">
                      <div className="flex items-baseline gap-2">
                        <span className="font-semibold text-blue-400">
                          {comment.username}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-slate-300 mt-1">{comment.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleSendComment} className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Type a comment..."
                  maxLength={500}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={sendingComment}
                />
                <button
                  type="submit"
                  disabled={!commentText.trim() || sendingComment}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg px-4 py-2 flex items-center gap-2 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Stream ID Card (for debugging) */}
            {/* <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Stream ID</div>
              <div className="text-xs font-mono text-slate-400 break-all">
                {streamInfo.muxStreamId}
              </div>
            </div> */}

            {/* Playback ID Card */}
            {/* <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4">
              <div className="text-xs text-slate-500 mb-1">Playback ID</div>
              <div className="text-xs font-mono text-slate-400 break-all">
                {streamInfo.muxPlaybackId}
              </div>
            </div> */}
          </div>
        </div>

        {/* Auto-refresh Notice */}
        <div className="mt-8 text-center text-sm text-slate-500">
          Auto-refreshing stream status every 10 seconds
        </div>
      </main>
    </div>
  );
}
