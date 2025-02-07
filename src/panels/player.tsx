"use client";

import { useEffect, useRef, useState } from "react";
import { useWebRTCConfig } from "@/webrtc/config";
import { WebRTCConnection } from "@/webrtc/connection";

type MediaPlayerProps = {
  connID: string;
};

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ connID }) => {
  const config = useWebRTCConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const connectionRef = useRef<WebRTCConnection>(null);
  const streamRef = useRef(new MediaStream());
  const [isPlaying, setIsPlaying] = useState(false);
  const handleCreateOffer = async () => {
    await connectionRef.current?.createOffer(true, true);
    setIsPlaying((prev) => !prev)
  };

  useEffect(() => {
    if (videoRef.current) {
      console.log('videoRef', streamRef.current)
      videoRef.current.srcObject = streamRef.current;
    }

    connectionRef.current = new WebRTCConnection({
      urlGroup: config.urlGroup,
      iceServerURLs: config.iceServers[0].urls,
      connID: connID,
    })

    connectionRef.current.ontrack = (event) => {
      console.log('playerTrack', event, streamRef.current)
      streamRef.current.addTrack(event.track);
    };

    return () => {
      if (connectionRef.current) {
        connectionRef.current.close();
        connectionRef.current = null;
      }
    };
  }, [config]);

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

      <video ref={videoRef} autoPlay playsInline controls className="w-full h-auto" />;
    </div>
  );
}