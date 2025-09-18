"use client";

import { useEffect, useRef, useState } from 'react';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { IconMaximize, IconMinimize } from '@tabler/icons-react';


const LiveStreamViewer = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    const engineRef = useRef<ZegoExpressEngine | null>(null);
    const currentStreamIdRef = useRef<string | null>(null);

    const startViewing = async () => {
        const appId = 1170382194;
        const server = 'wss://webliveroom-api.zego.im/ws';

        if (!engineRef.current) {
            engineRef.current = new ZegoExpressEngine(appId, server);
        }
        const zg = engineRef.current;

        try {
            const roomID = 'rtc01';

            const audienceID = Date.now().toString();
            const tokenRes = await fetch(`/api/zego-token?userID=${audienceID}&roomID=${roomID}`);
            if (!tokenRes.ok) throw new Error('Token fetch failed');
            const { token } = await tokenRes.json();
            await zg.loginRoom(roomID, token, { userID: audienceID, userName: 'Viewer' });

            const streamID = 'rtc01';
            currentStreamIdRef.current = streamID;

            await playStreamWithRetry(zg, streamID);
        } catch (error) {
            console.error('Error starting viewer:', error);
        }
    };

    const attachVideo = async (media: MediaStream) => {
        const video = videoRef.current;
        if (!video) return;
        // Re-attach to ensure video element gets the newest stream reference
        try { (video as HTMLVideoElement).srcObject = null; } catch {}
        video.srcObject = media;
        // Ensure attributes for widest autoplay compatibility
        video.setAttribute('playsinline', 'true');
        video.autoplay = true;
        // Kick playback when metadata is ready
        const onLoaded = async () => {
            try { await video.play(); } catch (e) { /* ignore */ }
        };
        video.addEventListener('loadedmetadata', onLoaded, { once: true });
        video.addEventListener('canplay', onLoaded, { once: true });
        // If autoplay is blocked, an explicit play helps
        try {
            await video.play();
        } catch (e) {
            // In case of user-gesture requirement, at least audio should keep playing
            // We can add a UI prompt if needed
            console.warn('video.play() was blocked or failed:', e);
        }
    };

    // Retry playing until the stream is available and a video track is present
    const playStreamWithRetry = async (zg: ZegoExpressEngine, streamID: string, attempts = 0): Promise<void> => {
        const MAX_ATTEMPTS = 10;
        const RETRY_DELAY_MS = 1500;
        try {
            const remoteStream = await zg.startPlayingStream(streamID);

            if (!remoteStream) throw new Error('No MediaStream returned');

            // If video track isn't present yet (RTMP to WebRTC warm-up), wait for it
            if (remoteStream.getVideoTracks().length === 0) {
                await attachVideo(remoteStream);
                await new Promise<void>((resolve, reject) => {
                    const onAddTrack = (ev: MediaStreamTrackEvent) => {
                        if (ev.track.kind === 'video') {
                            remoteStream.removeEventListener('addtrack', onAddTrack as any);
                            resolve();
                        }
                    };
                    // Fallback timeout to retry if no track arrives
                    const timeout = setTimeout(() => {
                        remoteStream.removeEventListener('addtrack', onAddTrack as any);
                        reject(new Error('No video track yet'));
                    }, RETRY_DELAY_MS);
                    remoteStream.addEventListener('addtrack', (e: any) => {
                        onAddTrack(e);
                        clearTimeout(timeout);
                    });
                });
            }

            await attachVideo(remoteStream);
        } catch (err) {
            if (attempts < MAX_ATTEMPTS) {
                console.warn(`Stream not ready yet, retrying (${attempts + 1}/${MAX_ATTEMPTS})...`);
                await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
                return playStreamWithRetry(zg, streamID, attempts + 1);
            }
            console.error('Failed to start playing stream after retries:', err);
        }
    };

    useEffect(() => {
        startViewing();

        // Optional: observe player state updates for debugging/visibility
        const zg = engineRef.current;
        const onPlayerStateUpdate = (result: any) => {
            // Log or update UI based on result.state ("PLAYING", "NO_PLAY", etc.)
            // console.log('playerStateUpdate', result);
        };
        zg?.on('playerStateUpdate', onPlayerStateUpdate as any);

        // If the stream updates (e.g., video starts publishing later), try reattaching
        const onRoomStreamUpdate = async (_roomID: string, updateType: 'ADD' | 'DELETE', streamList: any[]) => {
            if (updateType === 'ADD' && currentStreamIdRef.current) {
                if (streamList.some((s) => s.streamID === currentStreamIdRef.current)) {
                    try {
                        await playStreamWithRetry(zg!, currentStreamIdRef.current);
                    } catch {}
                }
            }
        };
        zg?.on('roomStreamUpdate', onRoomStreamUpdate as any);

        // Sync fullscreen state when user presses Esc or toggles via browser UI
        const handleFsChange = () => {
            const docAny = document as any;
            const fsElement =
                document.fullscreenElement ||
                docAny.webkitFullscreenElement ||
                docAny.mozFullScreenElement ||
                docAny.msFullscreenElement;
            setIsFullscreen(Boolean(fsElement));
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        (document as any).addEventListener('webkitfullscreenchange', handleFsChange);
        (document as any).addEventListener('mozfullscreenchange', handleFsChange);
        (document as any).addEventListener('MSFullscreenChange', handleFsChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            (document as any).removeEventListener('webkitfullscreenchange', handleFsChange);
            (document as any).removeEventListener('mozfullscreenchange', handleFsChange);
            (document as any).removeEventListener('MSFullscreenChange', handleFsChange);

            // Cleanup playback and engine
            if (zg) {
                const sid = currentStreamIdRef.current;
                if (sid) {
                    try { zg.stopPlayingStream(sid); } catch {}
                }
                try { zg.logoutRoom && zg.logoutRoom('rtc01'); } catch {}
                try { zg.destroyEngine && zg.destroyEngine(); } catch {}
                engineRef.current = null;
            }
        };
    }, []);

    const enterFullscreen = async () => {
        const el = containerRef.current || videoRef.current;
        if (!el) return;
        try {
            const anyEl = el as any;
            // Various vendor-prefixed APIs for older browsers
            if (anyEl.requestFullscreen) await anyEl.requestFullscreen();
            else if (anyEl.webkitRequestFullscreen) await anyEl.webkitRequestFullscreen();
            else if (anyEl.mozRequestFullScreen) await anyEl.mozRequestFullScreen();
            else if (anyEl.msRequestFullscreen) await anyEl.msRequestFullscreen();
        } catch (e) {
            console.error('Failed to enter fullscreen', e);
        }
    };

    const exitFullscreen = async () => {
        try {
            const docAny = document as any;
            if (document.exitFullscreen) await document.exitFullscreen();
            else if (docAny.webkitExitFullscreen) await docAny.webkitExitFullscreen();
            else if (docAny.mozCancelFullScreen) await docAny.mozCancelFullScreen();
            else if (docAny.msExitFullscreen) await docAny.msExitFullscreen();
        } catch (e) {
            console.error('Failed to exit fullscreen', e);
        }
    };

    const toggleFullscreen = () => {
        if (isFullscreen) exitFullscreen();
        else enterFullscreen();
    };
    
    return (
        <div style={{ width: '100%', margin: '0 auto' }}>
            <div
            ref={containerRef}
            style={{
                position: 'relative',
                width: '100%',
                background: '#000',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: '0 4px 18px rgba(0,0,0,0.25)'
            }}
            >
            <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' /* 16:9 */ }}>
                <video
                ref={videoRef}
                autoPlay
                playsInline
                
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    background: '#000'
                }}
                />
            </div>

            <span
                style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'rgba(220,0,0,0.9)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 600,
                padding: '4px 10px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                letterSpacing: '0.5px',
                fontFamily: 'system-ui, sans-serif',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                userSelect: 'none'
                }}
            >
                <span
                style={{
                    display: 'inline-block',
                    width: '8px',
                    height: '8px',
                    background: '#fff',
                    borderRadius: '50%',
                    animation: 'pulse 1.4s infinite'
                }}
                />
                LIVE
            </span>

            {/* Fullscreen toggle button */}
            <button
                onClick={toggleFullscreen}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(0,0,0,0.55)',
                    color: '#fff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    cursor: 'pointer'
                }}
            >
                {isFullscreen ? <IconMinimize size={18} /> : <IconMaximize size={18} />}
            </button>

            <style jsx>{`
                @keyframes pulse {
                0% { transform: scale(.85); opacity: .6; }
                50% { transform: scale(1); opacity: 1; }
                100% { transform: scale(.85); opacity: .6; }
                }
            `}</style>
            </div>
        </div>
    );
};

export default LiveStreamViewer;