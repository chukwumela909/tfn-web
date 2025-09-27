"use client";

import { useEffect, useRef, useState } from 'react';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { IconEye, IconMaximize, IconMinimize } from '@tabler/icons-react';
import { ApiService } from '@/lib/api-service';

type LiveStreamViewerProps = {
    liveId?: string;
    autoResolveLiveId?: boolean;
    pollIntervalMs?: number;
};

type StreamSummary = {
    liveId?: string;
    isActive?: boolean;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const normaliseStreamList = (input: unknown): StreamSummary[] => {
    const rawItems: unknown[] = Array.isArray(input)
        ? input
        : isRecord(input) && Array.isArray(input['livestreams'])
            ? (input['livestreams'] as unknown[])
            : [];

    return rawItems
        .filter(isRecord)
        .map((item) => {
            const record = item as Record<string, unknown>;
            const liveId = typeof record['liveId'] === 'string' ? record['liveId'] : undefined;
            const isActive = typeof record['isActive'] === 'boolean' ? record['isActive'] : undefined;
            return { liveId, isActive } as StreamSummary;
        });
};

const extractViewCount = (payload: unknown): number | null => {
    if (!isRecord(payload)) {
        return null;
    }

    const candidates = [payload['currentViewCount'], payload['viewCount']];
    for (const candidate of candidates) {
        if (typeof candidate === 'number') {
            return candidate;
        }
    }

    const livestream = payload['livestream'];
    if (isRecord(livestream) && typeof livestream['viewCount'] === 'number') {
        return livestream['viewCount'];
    }

    return null;
};

const LiveStreamViewer = ({
    liveId: liveIdProp,
    autoResolveLiveId = true,
    pollIntervalMs = 15000,
}: LiveStreamViewerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [viewCount, setViewCount] = useState<number>(0);
    const [resolvedLiveId, setResolvedLiveId] = useState<string | null>(liveIdProp ?? null);
    const [viewerIdReady, setViewerIdReady] = useState<boolean>(false);
    const [joinError, setJoinError] = useState<string | null>(null);

    const engineRef = useRef<ZegoExpressEngine | null>(null);
    const currentStreamIdRef = useRef<string | null>(null);
    const viewerIdRef = useRef<string | null>(null);
    const hasJoinedRef = useRef<boolean>(false);
    const pollHandleRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (liveIdProp) {
            setResolvedLiveId(liveIdProp);
        }
    }, [liveIdProp]);

    useEffect(() => {
        if (viewerIdRef.current) {
            setViewerIdReady(true);
            return;
        }
        if (typeof window === 'undefined') return;

        const authToken = localStorage.getItem('auth_token');
        if (authToken && authToken.trim()) {
            viewerIdRef.current = authToken;
        } else {
            try {
                let viewerId = sessionStorage.getItem('viewer_session_id');
                if (!viewerId) {
                    viewerId = `viewer_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
                    sessionStorage.setItem('viewer_session_id', viewerId);
                }
                viewerIdRef.current = viewerId;
            } catch (error) {
                console.warn('Unable to persist viewer session id', error);
                viewerIdRef.current = `viewer_${Date.now()}`;
            }
        }
        setViewerIdReady(true);
    }, []);

    useEffect(() => {
        if (liveIdProp || !autoResolveLiveId) {
            return;
        }

        let isCancelled = false;

        const resolveLiveStreamId = async () => {
            if (typeof window === 'undefined') return;

            const storedLiveId = localStorage.getItem('current_live_id');
            if (storedLiveId) {
                setResolvedLiveId(storedLiveId);
                return;
            }

            try {
                const rawStreams = await ApiService.fetchAllLiveStreams();
                if (isCancelled) return;

                const candidateList = normaliseStreamList(rawStreams);

                const activeStream = candidateList.find((stream) => stream.isActive) ?? candidateList[0];

                if (activeStream?.liveId) {
                    setResolvedLiveId(activeStream.liveId);
                } else {
                    setResolvedLiveId(null);
                }
            } catch (error) {
                console.error('Failed to resolve live stream ID', error);
            }
        };

        resolveLiveStreamId();

        return () => {
            isCancelled = true;
        };
    }, [liveIdProp, autoResolveLiveId]);

    useEffect(() => {
        if (!resolvedLiveId || !viewerIdReady || !viewerIdRef.current) {
            return;
        }

        let isCancelled = false;

        const joinLivestream = async () => {
            try {
                setJoinError(null);
                const response = await ApiService.joinLivestream(resolvedLiveId, viewerIdRef.current!);
                hasJoinedRef.current = true;
                const count = extractViewCount(response);
                if (!isCancelled && typeof count === 'number') {
                    setViewCount(count);
                }
            } catch (error) {
                console.error('Failed to join livestream', error);
                if (!isCancelled) {
                    setJoinError('Unable to join livestream right now.');
                }
            }
        };

        const fetchLatestViewCount = async () => {
            try {
                const response = await ApiService.getLiveStreamDetails(resolvedLiveId);
                const count = extractViewCount(response);
                if (!isCancelled && typeof count === 'number') {
                    setViewCount(count);
                }
            } catch (error) {
                console.error('Failed to refresh livestream view count', error);
            }
        };

        joinLivestream().then(() => {
            if (!isCancelled) {
                fetchLatestViewCount();
                pollHandleRef.current = setInterval(fetchLatestViewCount, pollIntervalMs);
            }
        });

        return () => {
            isCancelled = true;
            if (pollHandleRef.current) {
                clearInterval(pollHandleRef.current);
                pollHandleRef.current = null;
            }
            if (hasJoinedRef.current) {
                ApiService.leaveLivestream(resolvedLiveId, viewerIdRef.current || '');
                hasJoinedRef.current = false;
            }
        };
    }, [resolvedLiveId, viewerIdReady, pollIntervalMs]);

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
        try { (video as HTMLVideoElement).srcObject = null; } catch { }
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
                    let timeoutHandle: ReturnType<typeof setTimeout>;

                    const onAddTrack = (event: Event) => {
                        const trackEvent = event as MediaStreamTrackEvent;
                        if (trackEvent.track.kind === 'video') {
                            remoteStream.removeEventListener('addtrack', onAddTrack);
                            clearTimeout(timeoutHandle);
                            resolve();
                        }
                    };

                    timeoutHandle = setTimeout(() => {
                        remoteStream.removeEventListener('addtrack', onAddTrack);
                        reject(new Error('No video track yet'));
                    }, RETRY_DELAY_MS);

                    remoteStream.addEventListener('addtrack', onAddTrack);
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
        const onPlayerStateUpdate = (_result: unknown) => {
            // Placeholder for potential state updates/logging
        };
        zg?.on('playerStateUpdate', onPlayerStateUpdate);

        // If the stream updates (e.g., video starts publishing later), try reattaching
        const onRoomStreamUpdate = async (
            _roomID: string,
            updateType: 'ADD' | 'DELETE',
            streamList: Array<{ streamID?: string }>
        ) => {
            if (updateType === 'ADD' && currentStreamIdRef.current && zg) {
                if (streamList.some((stream) => stream.streamID === currentStreamIdRef.current)) {
                    try {
                        await playStreamWithRetry(zg, currentStreamIdRef.current);
                    } catch { }
                }
            }
        };
        zg?.on('roomStreamUpdate', onRoomStreamUpdate);

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
                    try { zg.stopPlayingStream(sid); } catch { }
                }
                try { zg.logoutRoom && zg.logoutRoom('rtc01'); } catch { }
                try { zg.destroyEngine && zg.destroyEngine(); } catch { }
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

                <div
                    style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 2
                    }}
                >
                    <span
                        style={{
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
                    <span
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(15,23,42,0.85)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 500,
                            padding: '4px 10px',
                            borderRadius: '6px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.35)',
                            letterSpacing: '0.4px'
                        }}
                    >
                        <IconEye size={16} stroke={1.6} />
                        {Math.max(0, viewCount).toLocaleString()}
                    </span>
                </div>

                {!resolvedLiveId && (
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            background: 'rgba(15,23,42,0.75)',
                            color: '#fff',
                            padding: '12px 18px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            textAlign: 'center',
                            maxWidth: '260px',
                            lineHeight: 1.4,
                            zIndex: 1
                        }}
                    >
                        No active livestream detected yet.
                    </div>
                )}

                {joinError && resolvedLiveId && (
                    <div
                        style={{
                            position: 'absolute',
                            bottom: '16px',
                            left: '16px',
                            background: 'rgba(15,23,42,0.75)',
                            color: '#fff',
                            padding: '10px 14px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            lineHeight: 1.4,
                            maxWidth: '260px',
                            boxShadow: '0 2px 6px rgba(0,0,0,0.25)'
                        }}
                    >
                        {joinError}
                    </div>
                )}

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