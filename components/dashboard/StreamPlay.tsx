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
        <div>
            {/* <button onClick={startViewing}>Start Watching</button> */}
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', height: '400px' }}
            />
        </div>
    );
};

export default LiveStreamViewer;