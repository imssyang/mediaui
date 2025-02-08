"use client";

import { useEffect, useRef, useState } from "react";
import { useWebRTC, useWebRTCState } from "@/webrtc/context";

type MediaPlayerProps = {
  connID: string;
};

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ connID }) => {
  const { connectionState, mediaStream } = useWebRTCState(connID);
  const webrtc = useWebRTC();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const handleCreateOffer = async () => {
    await webrtc.getConnection(connID)?.createOffer(true, true);
    setIsPlaying((prev) => !prev)
  };

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      console.log('videoRef', mediaStream)
      videoRef.current.srcObject = mediaStream;
    }
  }, [mediaStream]);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying]);

  return (
    <div className="p-4">
      <button
        onClick={handleCreateOffer}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        {isPlaying ? "暂停" : "播放"}
      </button>

      <p>连接状态: {connectionState}</p>
      <video ref={videoRef} autoPlay playsInline controls className="w-full h-auto" />;
    </div>
  );
}
