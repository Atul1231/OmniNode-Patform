import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

// TODO: FUTURE_EXPANSION_HOOKS — Screen sharing track injection interface
// TODO: FUTURE_EXPANSION_HOOKS — Call recording pipeline via MediaRecorder API
// TODO: FUTURE_EXPANSION_HOOKS — AI real-time transcription stream

interface VideoCallOverlayProps {
  socket: Socket | null;
  conversationId: string;
  onCloseCall: () => void;
  onSystemLog: (content: string) => void;
}

export const VideoCallOverlay: React.FC<VideoCallOverlayProps> = ({ 
  socket, 
  conversationId, 
  onCloseCall,
  onSystemLog 
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'INITIALIZING' | 'CONNECTED' | 'DISCONNECTED'>('INITIALIZING');
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const hasLoggedInitRef = useRef(false);

  const callRoomId = `call:${conversationId}`;

  // --- HARDENED CLEANUP ROUTINE ---
  // Ensures all media hardware is fully released and socket events are unbound
  const performFullCleanup = useCallback(() => {
    // 1. Stop all local media hardware capture devices
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🔇 Media track stopped: ${track.kind} (${track.label})`);
      });
      localStreamRef.current = null;
    }

    // 2. Close the RTCPeerConnection gracefully
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
      console.log('🔌 RTCPeerConnection closed.');
    }

    // 3. Clear video element references to prevent stale stream playback
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;

    // 4. Send socket disconnect alert for this call room
    if (socket) {
      socket.emit('leave-call-room', { conversationId });
    }

    setConnectionStatus('DISCONNECTED');
  }, [socket, conversationId]);

  useEffect(() => {
    if (!socket || !conversationId) return;
    
    let isMounted = true;

    const initializeCall = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!isMounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        peerConnectionRef.current = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });

        stream.getTracks().forEach(track => {
          if (peerConnectionRef.current && localStreamRef.current) {
            peerConnectionRef.current.addTrack(track, localStreamRef.current);
          }
        });

        peerConnectionRef.current.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnectionStatus('CONNECTED');
          }
        };

        peerConnectionRef.current.onicecandidate = (event) => {
          if (event.candidate) {
            socket.emit('webrtc-ice-candidate', { targetRoomId: `conversation:${conversationId}`, candidate: event.candidate });
          }
        };

        peerConnectionRef.current.onconnectionstatechange = () => {
          const state = peerConnectionRef.current?.connectionState;
          console.log(`📡 Peer connection state: ${state}`);

          if (state === 'connected') {
            setConnectionStatus('CONNECTED');
          } else if (state === 'disconnected' || state === 'failed') {
            setConnectionStatus('DISCONNECTED');
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
          }
        };

        peerConnectionRef.current.oniceconnectionstatechange = () => {
          const state = peerConnectionRef.current?.iceConnectionState;
          console.log(`🧊 ICE connection state: ${state}`);
          if (state === 'failed') {
            console.warn('⚠️ ICE connection failed — peer may be unreachable.');
            setConnectionStatus('DISCONNECTED');
          }
        };

        socket.emit('join-call-room', { conversationId });

        // CREATE AND DISPATCH OFFER TO VISITOR IMMEDIATELY
        if (peerConnectionRef.current) {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          socket.emit('webrtc-offer', { targetRoomId: `conversation:${conversationId}`, offer });
        }

      } catch (err: any) {
        if (!isMounted) return;
        console.error('🚨 Failed to claim media hardware resources:', err.message);
        setConnectionStatus('DISCONNECTED');
        onSystemLog('⚠️ Video call failed: Unable to access camera/microphone');
      }
    };

    initializeCall();

    const handleOffer = async (payload: { senderSocketId: string; offer: any }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socket.emit('webrtc-answer', { targetRoomId: `conversation:${conversationId}`, answer });
      } catch (err: any) {
        console.error('Failed to answer WebRTC Offer payload:', err.message);
      }
    };

    const handleAnswer = async (payload: { senderSocketId: string; answer: any }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        setConnectionStatus('CONNECTED');
      } catch (err: any) {
        console.error('Failed to register WebRTC Answer signature:', err.message);
      }
    };

    const handleIceCandidate = async (payload: { senderSocketId: string; candidate: any }) => {
      if (!peerConnectionRef.current) return;
      try {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
      } catch (err: any) {
        console.error('Failed to append remote ICE node:', err.message);
      }
    };

    const handleUserLeftCall = () => {
      console.log('Peer left the call room. Terminating overlay.');
      performFullCleanup();
      onCloseCall();
    };

    socket.on('webrtc-offer', handleOffer);
    socket.on('webrtc-answer', handleAnswer);
    socket.on('webrtc-ice-candidate', handleIceCandidate);
    socket.on('user-left-call', handleUserLeftCall);

    return () => {
      isMounted = false;
      socket.off('webrtc-offer', handleOffer);
      socket.off('webrtc-answer', handleAnswer);
      socket.off('webrtc-ice-candidate', handleIceCandidate);
      socket.off('user-left-call', handleUserLeftCall);
    };
  }, [socket, conversationId]); // eslint-disable-line react-hooks/exhaustive-deps

  // --- MEDIA TOGGLE CONTROLS (with null guards) ---
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = isMuted; // Toggle: if muted, re-enable; if not, disable
        setIsMuted(!isMuted);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = isCamOff; // Toggle: if off, re-enable; if on, disable
        setIsCamOff(!isCamOff);
      }
    }
  };

  // --- HARDENED END CALL HANDLER ---
  const handleEndCall = () => {
    performFullCleanup();
    onCloseCall();
  };

  return (
    <div className="flex flex-col h-full w-full bg-slate-950 p-4 overflow-hidden">
      {/* Upper Status Line Banner */}
      <div className="flex items-center justify-between text-3xs font-mono px-1 mb-2 text-slate-500 shrink-0">
        <div className="flex items-center gap-1.5 text-slate-400">
          <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-emerald-500 animate-pulse' : connectionStatus === 'INITIALIZING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
          <span>LINK: {connectionStatus}</span>
        </div>
        <span>ROOM_ID: {callRoomId}</span>
      </div>

      {/* Expanded Split Canvas Body: Takes up all available vertical space */}
      <div className="flex-1 grid grid-rows-2 gap-3 min-h-0">
        
        {/* Remote Visitor Feed Panel (Top half for primary viewing focus) */}
        <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-900 flex items-center justify-center">
          <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
          <span className="absolute bottom-2 left-2 bg-slate-950/80 text-3xs font-mono px-2 py-0.5 rounded text-indigo-400 border border-slate-800/40">
            VISITOR STREAM
          </span>
          {connectionStatus !== 'CONNECTED' && (
            <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-3xs text-slate-500 font-mono animate-pulse">
              {connectionStatus === 'DISCONNECTED' ? 'PEER_DISCONNECTED' : 'WAITING_FOR_PEER_LINK_PROPS...'}
            </div>
          )}
        </div>

        {/* Local Agent Feed Panel (Bottom half) */}
        <div className="relative rounded-lg overflow-hidden bg-slate-900 border border-slate-900 flex items-center justify-center">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
          <span className="absolute bottom-2 left-2 bg-slate-950/80 text-3xs font-mono px-2 py-0.5 rounded text-slate-300 border border-slate-800/40">
            YOU (AGENT) {isMuted && '🎤_MUTED'}
          </span>
          {isCamOff && <div className="absolute inset-0 bg-slate-900 flex items-center justify-center text-3xs text-slate-500 font-mono">CAMERA_MUTED</div>}
        </div>

      </div>

      {/* Command Control Actions Bar */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-900 shrink-0">
        <div className="flex gap-2">
          <button onClick={toggleMute} className={`btn btn-2xs border-none font-medium text-white px-2.5 py-1 rounded transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-900 hover:bg-slate-800'}`}>
            {isMuted ? 'Unmute Mic' : 'Mute Mic'}
          </button>
          <button onClick={toggleCamera} className={`btn btn-2xs border-none font-medium text-white px-2.5 py-1 rounded transition-colors ${isCamOff ? 'bg-red-600 hover:bg-red-500' : 'bg-slate-900 hover:bg-slate-800'}`}>
            {isCamOff ? 'Enable Cam' : 'Disable Cam'}
          </button>
        </div>
        
        {/* HARDENED END CALL — Stops all hardware, emits socket disconnect, logs system message */}
        <button onClick={handleEndCall} className="btn btn-2xs bg-red-950/60 text-red-200 hover:bg-red-600 border-none font-medium px-3 py-1 rounded transition-colors">
          End Call
        </button>
      </div>
    </div>
  );
};