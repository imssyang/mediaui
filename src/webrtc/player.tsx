import { useEffect, useRef, useState } from "react";
import { WebRTCConnection } from "./connection";
import { useWebRTCConfig } from "./config";

interface WebRTCPlayerProps {
  connID: string;
  isPlaying: boolean;
}

export const WebRTCPlayer: React.FC<WebRTCPlayerProps> = ({ connID, isPlaying }) => {
  const config = useWebRTCConfig();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [connection, setConnection] = useState<WebRTCConnection | null>(null);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (!isPlaying || connection) return;

    if (!mediaStream) {
      const newStream = new MediaStream();
      setMediaStream(newStream);
    }

    const conn = new WebRTCConnection({
        urlGroup: config.urlGroup,
        iceServerURLs: config.iceServers[0].urls,
        connID: connID,
    });

    conn.ontrack = (event) => {
      console.log('playerTrack', event, mediaStream)
      mediaStream?.addTrack(event.track);
      if (videoRef.current) {
        console.log('videoRef', event)
        videoRef.current.srcObject = mediaStream;
      }
    };

    const startWebRTC = async () => {
      await conn.createOffer(true, true);
      setConnection(conn);
    };

    startWebRTC();

    return () => {
      console.log("🧹 释放 WebRTC 连接");
      conn.close();
      setConnection(null);
      setMediaStream(null);
    };
  }, [config, isPlaying]);

  useEffect(() => {
    if (videoRef.current && mediaStream) {
      if (isPlaying) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, mediaStream]);

  return <video ref={videoRef} autoPlay playsInline controls className="w-full h-auto" />;
};
