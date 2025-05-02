import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import useWebRTC from '../hooks/useWebRTC';
import VideoPlayer from '../components/VideoPlayer';
import { FaSlideshare, FaPhoneSlash, FaVolumeUp, FaVolumeMute, FaVideo, FaVideoSlash, FaComments } from 'react-icons/fa';

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();

  const {
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
  } = useWebRTC(roomId);

  const [isScreenFull, setIsScreenFull] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatOpen, setChatOpen] = useState(false); // Toggle for chat box

  const toggleFullScreen = () => {
    setIsScreenFull(!isScreenFull);
  };

  return (
    <div className="h-screen flex flex-col bg-black relative">
      <div className="bg-black text-white px-6 py-3 flex justify-between items-center shadow-xl">
        <span className="text-2xl font-semibold">Room: {roomId}</span>
        <button onClick={() => setChatOpen(!chatOpen)} className="text-white text-xl">
          <FaComments />
        </button>
      </div>

      <VideoPlayer
        localVideoRef={localVideoRef}
        remoteVideoRef={remoteVideoRef}
        screenVideoRef={screenVideoRef}
        isScreenFull={isScreenFull}
        toggleFullScreen={toggleFullScreen}
        isScreenSharing={isScreenSharing}
        isRemoteConnected={isRemoteConnected}
      />

      {/* Chat Box */}
      {chatOpen && (
        <div className="fixed top-20 right-4 w-80 bg-white shadow-lg rounded-lg p-4 z-50 h-[60vh] flex flex-col">
          <div className="flex-1 overflow-y-auto space-y-2 mb-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`p-2 rounded max-w-[75%] ${
                  msg.self ? 'bg-blue-500 text-white self-end ml-auto' : 'bg-gray-200 text-black self-start mr-auto'
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  sendMessage(chatInput.trim());
                  setChatInput('');
                }
              }}
              className="flex-1 border rounded px-2 py-1"
              placeholder="Type a message"
            />
            <button
              onClick={() => {
                if (chatInput.trim()) {
                  sendMessage(chatInput.trim());
                  setChatInput('');
                }
              }}
              className="bg-blue-600 text-white px-3 py-1 rounded"
            >
              Send
            </button>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 flex justify-center gap-6 z-50">
        <button
          onClick={toggleVideo}
          className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-full shadow-lg hover:bg-purple-700 transition-all duration-300"
        >
          {videoOff ? <FaVideoSlash /> : <FaVideo />}
        </button>
        <button
          onClick={toggleAudio}
          className="px-6 py-3 bg-yellow-500 text-white font-semibold rounded-full shadow-lg hover:bg-yellow-600 transition-all duration-300"
        >
          {muted ? <FaVolumeUp /> : <FaVolumeMute />}
        </button>
        <button
          onClick={shareScreen}
          className="px-6 py-3 bg-indigo-500 text-white font-semibold rounded-full shadow-lg hover:bg-indigo-600 transition-all duration-300"
        >
          <FaSlideshare />
        </button>
        <button
          onClick={() => navigate('/')}
          className="px-6 py-3 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 transition-all duration-300"
        >
          <FaPhoneSlash />
        </button>
      </div>
    </div>
  );
}
