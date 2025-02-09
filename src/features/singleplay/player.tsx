"use client";

import { useEffect, useRef } from "react";
import { useWebRTCState } from "@/webrtc/context";
import { useTask } from "./state";
import { Badge } from "@/components/ui/badge";

export function MediaPlayer() {
  const task = useTask();
  const state = useWebRTCState(task.connID);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && state.mediaStream) {
      console.log('videoRef', state.mediaStream)
      videoRef.current.srcObject = state.mediaStream;
      videoRef.current.play();
    }
  }, [state.mediaStream]);

  return (
    <div className="px-4">
      <video ref={videoRef} autoPlay playsInline controls className="w-full h-auto" />
      <Badge variant="outline">{state.connectionState}</Badge>
    </div>
  );
}

