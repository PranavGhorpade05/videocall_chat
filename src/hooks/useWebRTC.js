import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SIGNALING_SERVER_URL = 'https://reactvideocallingapp1-backend-production.up.railway.app';
const ICE_SERVERS = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };

export default function useWebRTC(roomId) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const screenVideoRef = useRef(null);
  const socketRef = useRef(null);
  const peerRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const pendingCandidates = useRef([]);
  const [messages, setMessages] = useState(() => {
    // Load messages from sessionStorage if they exist
    const savedMessages = sessionStorage.getItem(roomId);
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [videoOff, setVideoOff] = useState(false);
  const [muted, setMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRemoteConnected, setIsRemoteConnected] = useState(false);
  const toggleVideo = useCallback(() => {
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setVideoOff(!videoTrack.enabled);
    }
  }, []);
  const sendMessage = (text) => {
    // Simulate sending message to the room
    setMessages(prev => {
      const newMessages = [...prev, { text, self: true }];
      sessionStorage.setItem(roomId, JSON.stringify(newMessages));  // Save to sessionStorage
      return newMessages;
    });
  };

  const cleanupPeer = useCallback(() => {
    console.log('[Cleanup] Closing peer connection');
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    setIsRemoteConnected(false);
  }, []);

  const createPeerConnection = useCallback((targetSocketId) => {
    console.log('[PeerConnection] Creating peer for:', targetSocketId);
    const peer = new RTCPeerConnection(ICE_SERVERS);

    peer.onicecandidate = ({ candidate }) => {
      if (candidate) {
        console.log('[ICE] Local candidate:', candidate);
        socketRef.current.emit('send-ice-candidate', {
          candidate,
          to: targetSocketId,
        });
      }
    };

    peer.ontrack = (event) => {
      console.log('[Track] Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setIsRemoteConnected(true);
      }
    };

    peer.oniceconnectionstatechange = () => {
      console.log('[ICE State] Changed to:', peer.iceConnectionState);
      if (['disconnected', 'failed', 'closed'].includes(peer.iceConnectionState)) {
        cleanupPeer();
      }
    };

    return peer;
  }, [cleanupPeer]);

  const toggleAudio = useCallback(() => {
    const audioTrack = localStreamRef.current?.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setMuted(!audioTrack.enabled);
    }
  }, []);

  const shareScreen = useCallback(async () => {
    if (!peerRef.current) return;

    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');

      if (sender) sender.replaceTrack(screenTrack);
      screenVideoRef.current.srcObject = screenStream;
      screenStreamRef.current = screenStream;
      setIsScreenSharing(true);

      screenTrack.onended = () => {
        const originalTrack = localStreamRef.current.getVideoTracks()[0];
        const sender = peerRef.current.getSenders().find(s => s.track.kind === 'video');
        if (sender) sender.replaceTrack(originalTrack);
        screenVideoRef.current.srcObject = null;
        setIsScreenSharing(false);
      };
    } catch (err) {
      console.error('[ScreenShare] Error:', err);
    }
  }, []);

  useEffect(() => {
    const start = async () => {
      try {
        socketRef.current = io(SIGNALING_SERVER_URL, { transports: ['websocket'] });

        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;

        console.log('[Join] Joining room:', roomId);
        socketRef.current.emit('join-room', { roomId });

        socketRef.current.on('user-joined', ({ socketId }) => {
          console.log('[Signal] User joined:', socketId);
          if (peerRef.current) return; // prevent duplicate

          peerRef.current = createPeerConnection(socketId);
          stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

          peerRef.current.createOffer()
            .then(offer => peerRef.current.setLocalDescription(offer))
            .then(() => {
              console.log('[Offer] Sending offer to:', socketId);
              socketRef.current.emit('send-offer', {
                offer: peerRef.current.localDescription,
                to: socketId,
              });
            })
            .catch(err => console.error('[Offer] Error creating offer:', err));
        });

        socketRef.current.on('receive-offer', async ({ offer, from }) => {
          console.log('[Offer] Received offer from:', from);
          if (peerRef.current) return;

          peerRef.current = createPeerConnection(from);
          stream.getTracks().forEach(track => peerRef.current.addTrack(track, stream));

          await peerRef.current.setRemoteDescription(new RTCSessionDescription(offer));
          console.log('[Offer] Set remote description');

          const answer = await peerRef.current.createAnswer();
          await peerRef.current.setLocalDescription(answer);
          console.log('[Answer] Sending answer to:', from);

          socketRef.current.emit('send-answer', {
            answer: peerRef.current.localDescription,
            to: from,
          });

          // Apply any buffered ICE candidates
          for (const candidate of pendingCandidates.current) {
            console.log('[ICE] Applying buffered candidate:', candidate);
            await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
          }
          pendingCandidates.current = [];
        });

        socketRef.current.on('receive-answer', async ({ answer }) => {
          console.log('[Answer] Received answer');
          if (peerRef.current) {
            await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('[Answer] Set remote description');
          }
        });

        socketRef.current.on('receive-ice-candidate', async ({ candidate }) => {
          console.log('[ICE] Received remote candidate:', candidate);
          if (peerRef.current && peerRef.current.remoteDescription) {
            try {
              await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('[ICE] Candidate added successfully');
            } catch (err) {
              console.error('[ICE] Error adding candidate:', err);
            }
          } else {
            console.log('[ICE] Candidate buffered');
            pendingCandidates.current.push(candidate);
          }
        });

        socketRef.current.on('user-left', () => {
          console.log('[Signal] User left');
          cleanupPeer();
        });
        if (!socketRef.current) return;
        socketRef.current.on('chat-message', ({ text }) => {
          setMessages(prev => {
            const newMessages = [...prev, { text, self: false }];
            sessionStorage.setItem(roomId, JSON.stringify(newMessages));  // Save to sessionStorage
            return newMessages;
          });
        });

      } catch (err) {
        console.error('[Init] WebRTC setup error:', err);
      }
    };

    start();

    return () => {
      console.log('[Cleanup] Leaving room');
      socketRef.current?.disconnect();
      cleanupPeer();
      socketRef.current?.off('chat-message');
      localStreamRef.current?.getTracks().forEach(t => t.stop());
      screenStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [roomId, createPeerConnection, cleanupPeer]);

  return {
    localVideoRef,
    remoteVideoRef,
    screenVideoRef,
    toggleAudio,
    shareScreen,
    muted,
    isScreenSharing,
    isRemoteConnected,
    videoOff,
    toggleVideo,
    messages,
    sendMessage,
  };
}
