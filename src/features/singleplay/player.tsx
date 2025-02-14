"use client";

import { useEffect, useRef, useState } from "react";
import { useTask } from "./task";
import { useWebRTCState } from "@/webrtc/state";
import { log } from "@/lib/log";
import { WebRTCStateTable } from "./webrtc";

export function MediaPlayer() {
  const task = useTask();
  const state = useWebRTCState(task.connID);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && state.mediaStream) {
      log.react('videoRef', state.mediaStream)
      videoRef.current.srcObject = state.mediaStream;
      videoRef.current.play();
    }
  }, [state.mediaStream]);

  return (
    <div className="px-4">
      <video ref={videoRef} autoPlay playsInline controls className="w-full h-auto" />
      <WebRTCStateTable />
    </div>
  );
}

export function SourcePlayer(webrtcStream: ReadableStream<Uint8Array>, mimeType: string) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [mediaSource] = useState(new MediaSource());
  const [sourceBuffer, setSourceBuffer] = useState<SourceBuffer | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(null);

  useEffect(() => {
    if (!videoRef.current) return;

    const url = URL.createObjectURL(mediaSource);
    videoRef.current.src = url;

    mediaSource.addEventListener("sourceopen", async () => {
      log.react("MediaSource Opened");
      if (mediaSource.readyState !== "open") return;

      const buffer = mediaSource.addSourceBuffer(mimeType);
      setSourceBuffer(buffer);

      readerRef.current = webrtcStream.getReader();
      appendNextChunk();
    });

    return () => {
      URL.revokeObjectURL(url);
      mediaSource.endOfStream();
    };
  }, [mediaSource, webrtcStream, mimeType]);

  const appendNextChunk = async () => {
    if (!sourceBuffer || !readerRef.current) return;

    const { done, value } = await readerRef.current.read();
    if (done) {
      log.react("WebRTC Stream finished");
      mediaSource.endOfStream();
      return;
    }

    if (sourceBuffer.updating) {
      sourceBuffer.addEventListener("updateend", appendNextChunk, { once: true });
    } else {
      sourceBuffer.appendBuffer(value);
      appendNextChunk();
    }
  };

  return (
    <video ref={videoRef} controls />
  );
};

