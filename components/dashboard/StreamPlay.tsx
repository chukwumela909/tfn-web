import { useRef } from 'react';
import { ZegoExpressEngine } from 'zego-express-engine-webrtc';
import { useEffect } from 'react';


const LiveStreamViewer = () => {
    const videoRef = useRef<HTMLVideoElement>(null);
    
    const startViewing = async () => {
        const appId = 1170382194;
        const server = 'wss://webliveroom-api.zego.im/ws';
        
        const zg = new ZegoExpressEngine(appId, server);
        
        try {
            // Try using the streamID as roomID
            const roomID = 'rtc01'; // Use your RTMP stream ID as room ID
            
            // Fetch token then login with 3 args as required by Zego SDK
            const audienceID = Date.now().toString();
            const tokenRes = await fetch(`/api/zego-token?userID=${audienceID}&roomID=${roomID}`);
            if (!tokenRes.ok) throw new Error('Token fetch failed');
            const { token } = await tokenRes.json();
            await zg.loginRoom(roomID, token, { userID: audienceID, userName: 'Viewer' });
            
            // Try to play the RTMP stream that was bridged to WebRTC
            const streamID = 'rtc01';
            const remoteStream = await zg.startPlayingStream(streamID);
            
            if (videoRef.current && remoteStream) {
                videoRef.current.srcObject = remoteStream;
            }
            
        } catch (error) {
            console.error('Error starting viewer:', error);
        }
    };

    useEffect(() => {
        startViewing();
    }, []);
    
    return (
        <div style={{ width: '100%', margin: '0 auto' }}>
            <div
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