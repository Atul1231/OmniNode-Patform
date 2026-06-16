(function () {
  const SCRIPT_ID = 'omninode-widget-script';
  
  // Auto-detect the backend URL and API Key from the script tag
  const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
  const scriptSrc = scriptTag?.src || 'http://localhost:5000/widget.js';
  const SERVER_URL = new URL(scriptSrc).origin;
  const dataApiKey = scriptTag?.getAttribute('data-api-key');
  
  const SOCKET_IO_CDN = 'https://cdn.socket.io/4.7.4/socket.io.min.js';

  // Read config from script tag or fallback to host page window object
  const config = window.OmniNode || { apiKey: dataApiKey };
  if (!config.apiKey) {
    console.error('OmniNode Widget: Missing data-api-key attribute on script tag. Initialization aborted.');
    return;
  }

  // Generate or retrieve a visitor session ID
  let visitorSessionId = localStorage.getItem('omninode_visitor_id');
  if (!visitorSessionId) {
    visitorSessionId = 'vis_' + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('omninode_visitor_id', visitorSessionId);
  }

  let socket = null;
  let peerConnection = null;
  let localStream = null;
  let isWidgetMuted = false;
  let isWidgetCamOff = false;

  // UI State
  let isChatOpen = false;
  let messages = [];

  // STUN/TURN configuration
  const iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ];

  // ==========================================
  // 1. INJECT SCOPED CSS
  // ==========================================
  const injectStyles = () => {
    const style = document.createElement('style');
    style.innerHTML = `
      #omninode-widget-container {
        position: fixed;
        bottom: 24px;
        right: 24px;
        z-index: 999999;
        font-family: 'Inter', -apple-system, sans-serif;
      }
      
      #omninode-launcher {
        width: 60px;
        height: 60px;
        background: #4f46e5;
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 20px rgba(79, 70, 229, 0.4);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
        border: none;
        color: white;
        font-size: 28px;
        position: absolute;
        bottom: 0;
        right: 0;
      }
      #omninode-launcher:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 24px rgba(79, 70, 229, 0.6);
      }

      #omninode-chat-window {
        position: absolute;
        bottom: 80px;
        right: 0;
        width: 360px;
        height: 520px;
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 16px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
        display: none;
        flex-direction: column;
        overflow: hidden;
        color: #f8fafc;
        transform-origin: bottom right;
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 0;
        transform: scale(0.9);
      }
      #omninode-chat-window.open {
        display: flex;
        opacity: 1;
        transform: scale(1);
      }

      .omninode-header {
        background: #1e293b;
        padding: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        border-bottom: 1px solid #334155;
      }
      .omninode-header-title {
        font-weight: 600;
        font-size: 15px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .omninode-status-dot {
        width: 8px;
        height: 8px;
        background: #10b981;
        border-radius: 50%;
        box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
      }
      
      .omninode-close-btn {
        background: transparent;
        border: none;
        color: #94a3b8;
        cursor: pointer;
        font-size: 20px;
      }
      .omninode-close-btn:hover { color: #f8fafc; }

      .omninode-video-container {
        width: 100%;
        background: #000;
        display: none;
        position: relative;
        border-bottom: 1px solid #334155;
      }
      #omninode-remote-video {
        width: 100%;
        height: 320px;
        object-fit: cover;
      }
      #omninode-local-video {
        position: absolute;
        bottom: 44px;
        right: 8px;
        width: 90px;
        height: 135px;
        object-fit: cover;
        border-radius: 8px;
        border: 2px solid #334155;
        background: #1e293b;
      }

      #omninode-messages-list {
        flex: 1;
        padding: 16px;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .omninode-msg {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 12px;
        font-size: 14px;
        line-height: 1.4;
        word-wrap: break-word;
      }
      .omninode-msg.customer {
        background: #4f46e5;
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }
      .omninode-msg.agent {
        background: #1e293b;
        color: #f8fafc;
        align-self: flex-start;
        border-bottom-left-radius: 4px;
        border: 1px solid #334155;
      }
      .omninode-msg.system {
        background: transparent;
        color: #94a3b8;
        align-self: center;
        font-size: 12px;
        text-align: center;
      }

      .omninode-input-area {
        padding: 12px;
        background: #0f172a;
        border-top: 1px solid #1e293b;
        display: flex;
        gap: 8px;
      }
      .omninode-input {
        flex: 1;
        background: #1e293b;
        border: 1px solid #334155;
        color: white;
        border-radius: 20px;
        padding: 10px 16px;
        outline: none;
        font-size: 14px;
      }
      .omninode-input:focus {
        border-color: #4f46e5;
      }
      .omninode-send-btn {
        background: #4f46e5;
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s;
      }
      .omninode-send-btn:hover { background: #4338ca; }
      
      .omninode-call-banner {
        background: #059669;
        color: white;
        padding: 12px;
        text-align: center;
        font-size: 13px;
        font-weight: bold;
        cursor: pointer;
        display: none;
        animation: pulse-bg 2s infinite;
      }
      @keyframes pulse-bg {
        0% { background: #059669; }
        50% { background: #047857; }
        100% { background: #059669; }
      }
    `;
    document.head.appendChild(style);
  };

  // ==========================================
  // 2. BUILD UI ELEMENTS
  // ==========================================
  const buildUI = () => {
    const container = document.createElement('div');
    container.id = 'omninode-widget-container';

    // Chat Window
    const chatWindow = document.createElement('div');
    chatWindow.id = 'omninode-chat-window';
    
    // Header
    const header = document.createElement('div');
    header.className = 'omninode-header';
    header.innerHTML = `
      <div class="omninode-header-title">
        <div class="omninode-status-dot"></div>
        Support Team
      </div>
      <button class="omninode-close-btn" id="omninode-close-btn">&times;</button>
    `;

    // Incoming Call Banner
    const callBanner = document.createElement('div');
    callBanner.id = 'omninode-call-banner';
    callBanner.className = 'omninode-call-banner';
    callBanner.innerHTML = '🎥 Incoming Video Call... Click to Answer';

    // Video Area
    const videoContainer = document.createElement('div');
    videoContainer.id = 'omninode-video-container';
    videoContainer.className = 'omninode-video-container';
    videoContainer.innerHTML = `
      <video id="omninode-remote-video" autoplay playsinline></video>
      <video id="omninode-local-video" autoplay playsinline muted></video>
      <div style="position: absolute; bottom: 8px; left: 8px; display: flex; gap: 8px; z-index: 10;">
        <button id="omninode-end-call-btn" style="background: #e11d48; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">End</button>
        <button id="omninode-mute-btn" style="background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">Mute</button>
        <button id="omninode-cam-btn" style="background: #334155; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: bold; box-shadow: 0 2px 8px rgba(0,0,0,0.5);">Cam Off</button>
      </div>
    `;

    // Message List
    const messagesList = document.createElement('div');
    messagesList.id = 'omninode-messages-list';

    // Input Area
    const inputArea = document.createElement('form');
    inputArea.className = 'omninode-input-area';
    inputArea.id = 'omninode-input-form';
    inputArea.innerHTML = `
      <input type="text" class="omninode-input" id="omninode-input" placeholder="Type your message..." autocomplete="off" />
      <button type="submit" class="omninode-send-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
      </button>
    `;

    chatWindow.appendChild(header);
    chatWindow.appendChild(callBanner);
    chatWindow.appendChild(videoContainer);
    chatWindow.appendChild(messagesList);
    chatWindow.appendChild(inputArea);

    // Launcher Button
    const launcher = document.createElement('button');
    launcher.id = 'omninode-launcher';
    launcher.innerHTML = `
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
    `;

    container.appendChild(chatWindow);
    container.appendChild(launcher);
    document.body.appendChild(container);

    // Event Listeners
    launcher.addEventListener('click', toggleChat);
    document.getElementById('omninode-close-btn').addEventListener('click', toggleChat);
    inputArea.addEventListener('submit', handleSendMessage);
    callBanner.addEventListener('click', handleAnswerCall);
    document.getElementById('omninode-end-call-btn').addEventListener('click', handleEndCall);
    document.getElementById('omninode-mute-btn').addEventListener('click', toggleWidgetMute);
    document.getElementById('omninode-cam-btn').addEventListener('click', toggleWidgetCam);
  };

  const toggleChat = () => {
    isChatOpen = !isChatOpen;
    const chatWindow = document.getElementById('omninode-chat-window');
    if (isChatOpen) {
      chatWindow.classList.add('open');
      document.getElementById('omninode-launcher').style.display = 'none';
      if (!socket) initializeSocket();
    } else {
      chatWindow.classList.remove('open');
      setTimeout(() => {
        document.getElementById('omninode-launcher').style.display = 'flex';
      }, 300);
    }
  };

  const renderMessage = (msg, type) => {
    const list = document.getElementById('omninode-messages-list');
    const msgEl = document.createElement('div');
    msgEl.className = `omninode-msg ${type}`;
    msgEl.innerText = msg;
    list.appendChild(msgEl);
    list.scrollTop = list.scrollHeight;
  };

  // ==========================================
  // 3. SOCKET LAYER
  // ==========================================
  const initializeSocket = () => {
    if (socket) return;
    renderMessage('Connecting to secure gateway...', 'system');

    socket = io(SERVER_URL, {
      auth: { visitorSessionId, apiKey: config.apiKey },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      renderMessage('Connection established. An agent will be with you shortly.', 'system');
    });

    socket.on('channel-allocated', (data) => {
      window.omninodeConversationId = data.id;
      socket.emit('join-conversation-room', { conversationId: data.id });
    });

    socket.on('new-chat-message', (payload) => {
      // Don't echo our own messages
      if (payload.senderType === 'CUSTOMER') return;
      renderMessage(payload.content, payload.senderType === 'SYSTEM' ? 'system' : 'agent');
      if (!isChatOpen) {
        document.getElementById('omninode-launcher').style.boxShadow = '0 0 0 4px #10b981, 0 4px 20px rgba(79, 70, 229, 0.4)';
      }
    });

    // WEBRTC SIGNALING RECEPTION
    socket.on('webrtc-offer', async (data) => {
      console.log('🎥 Incoming WebRTC Offer Received');
      window.pendingOffer = data.offer;
      // Show call banner
      const banner = document.getElementById('omninode-call-banner');
      banner.style.display = 'block';
    });

    socket.on('webrtc-ice-candidate', async (data) => {
      if (peerConnection) {
        try {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (e) {
          console.error('Error adding received ice candidate', e);
        }
      }
    });

    socket.on('user-left-call', () => {
      cleanupCall();
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    const input = document.getElementById('omninode-input');
    const content = input.value.trim();
    if (!content || !socket) return;

    socket.emit('send-chat-message', {
      conversationId: window.omninodeConversationId,
      content
    });

    renderMessage(content, 'customer');
    input.value = '';
  };

  // ==========================================
  // 4. WEBRTC VIDEO LAYER
  // ==========================================
  const handleAnswerCall = async () => {
    document.getElementById('omninode-call-banner').style.display = 'none';
    document.getElementById('omninode-video-container').style.display = 'block';
    renderMessage('Accepting video call...', 'system');

    try {
      // 1. Get Camera/Mic
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      document.getElementById('omninode-local-video').srcObject = localStream;

      // 2. Setup Peer Connection
      peerConnection = new RTCPeerConnection({ iceServers });

      // Add local tracks to peer connection
      localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

      // 3. Handle remote stream
      peerConnection.ontrack = (event) => {
        const remoteVideo = document.getElementById('omninode-remote-video');
        if (remoteVideo.srcObject !== event.streams[0]) {
          remoteVideo.srcObject = event.streams[0];
          renderMessage('Call connected! 🎥', 'system');
        }
      };

      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit('webrtc-ice-candidate', {
            targetRoomId: `conversation:${window.omninodeConversationId}`,
            candidate: event.candidate
          });
        }
      };

      // 5. Accept the Offer
      await peerConnection.setRemoteDescription(new RTCSessionDescription(window.pendingOffer));
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      // 6. Send Answer back to agent
      socket.emit('webrtc-answer', {
        targetRoomId: `conversation:${window.omninodeConversationId}`,
        answer
      });

    } catch (err) {
      console.error('Failed to answer call:', err);
      renderMessage('Camera/Mic permission denied or failed.', 'system');
      document.getElementById('omninode-video-container').style.display = 'none';
    }
  };

  const handleEndCall = () => {
    if (socket) {
      socket.emit('leave-call-room', { conversationId: window.omninodeConversationId });
    }
    cleanupCall();
  };

  const cleanupCall = () => {
    document.getElementById('omninode-video-container').style.display = 'none';
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    if (peerConnection) {
      peerConnection.close();
      peerConnection = null;
    }
    document.getElementById('omninode-local-video').srcObject = null;
    document.getElementById('omninode-remote-video').srcObject = null;
    
    // Reset toggle button states
    isWidgetMuted = false;
    isWidgetCamOff = false;
    const muteBtn = document.getElementById('omninode-mute-btn');
    if (muteBtn) { muteBtn.innerText = 'Mute'; muteBtn.style.background = '#334155'; }
    const camBtn = document.getElementById('omninode-cam-btn');
    if (camBtn) { camBtn.innerText = 'Cam Off'; camBtn.style.background = '#334155'; }
    
    renderMessage('Video call ended.', 'system');
  };

  const toggleWidgetMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = isWidgetMuted;
        isWidgetMuted = !isWidgetMuted;
        const btn = document.getElementById('omninode-mute-btn');
        btn.innerText = isWidgetMuted ? 'Unmute' : 'Mute';
        btn.style.background = isWidgetMuted ? '#e11d48' : '#334155';
      }
    }
  };

  const toggleWidgetCam = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = isWidgetCamOff;
        isWidgetCamOff = !isWidgetCamOff;
        const btn = document.getElementById('omninode-cam-btn');
        btn.innerText = isWidgetCamOff ? 'Cam On' : 'Cam Off';
        btn.style.background = isWidgetCamOff ? '#e11d48' : '#334155';
      }
    }
  };

  // ==========================================
  // BOOTSTRAP
  // ==========================================
  const loadDependencies = () => {
    if (window.io) {
      injectStyles();
      buildUI();
    } else {
      const script = document.createElement('script');
      script.src = SOCKET_IO_CDN;
      script.onload = () => {
        injectStyles();
        buildUI();
      };
      document.head.appendChild(script);
    }
  };

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    loadDependencies();
  } else {
    window.addEventListener('DOMContentLoaded', loadDependencies);
  }

})();
