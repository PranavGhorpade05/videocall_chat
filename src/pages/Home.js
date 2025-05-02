import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

export default function Home() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');

  const createRoom = () => {
    const newRoomId = uuid();
    navigate(`/room/${newRoomId}`);
  };

  const joinRoom = () => {
    if (roomCode.trim()) {
      navigate(`/room/${roomCode.trim()}`);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen space-y-4 bg-gray-100">
      <h1 className="text-3xl font-bold">WebRTC Video Chat</h1>
      <button
        onClick={createRoom}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
      >
        Create Room
      </button>
      <div className="flex space-x-2">
        <input
          className="p-2 border rounded"
          placeholder="Enter room ID"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value)}
        />
        <button
          onClick={joinRoom}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Join Room
        </button>
      </div>
    </div>
  );
}
