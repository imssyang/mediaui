"use client";

import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { WebRTCPlayer } from "@/webrtc/player";

type MediaPlayerProps = {
  connID: string;
};

export const MediaPlayer: React.FC<MediaPlayerProps> = ({ connID }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <>
      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">WebRTC Player</h1>
        <button
          onClick={() => setIsPlaying((prev) => !prev)}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          {isPlaying ? "暂停" : "播放"}
        </button>

        <WebRTCPlayer connID={connID} isPlaying={isPlaying} />
      </div>
      <div className="flex flex-col space-y-3">
      <div id="videos"></div>
      <div id="logs"></div>
      <Skeleton className="h-[125px]" />
      </div>
    </>
  );
}