"use client";

import { useEffect, useRef, useState } from "react";
import { useTask } from "./state";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useWebRTCState } from "@/webrtc/state";
import { log } from "@/lib/log";

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
      <Badge variant="outline">{state.connState}</Badge>
      <Table>
        <TableCaption>WebRTCStats</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>isRemote</TableHead>
            <TableHead>isOutput</TableHead>
            <TableHead>transportId</TableHead>
            <TableHead>boundRtpId</TableHead>
            <TableHead>codecId</TableHead>
            <TableHead>trackId</TableHead>
            <TableHead>kind</TableHead>
            <TableHead>ssrc</TableHead>
            <TableHead>channels</TableHead>
            <TableHead>clockRate</TableHead>
            <TableHead>mimeType</TableHead>
            <TableHead>payloadType</TableHead>
            <TableHead>sdpFmtpLine</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {state.streamStats?.map((stream) => (
            <TableRow key={stream.boundRtpId}>
              <TableCell>{stream.isRemote}</TableCell>
              <TableCell>{stream.isOutput}</TableCell>
              <TableCell>{stream.transportId}</TableCell>
              <TableCell>{stream.boundRtpId}</TableCell>
              <TableCell>{stream.codecId}</TableCell>
              <TableCell>{stream.trackId}</TableCell>
              <TableCell>{stream.kind}</TableCell>
              <TableCell>{stream.ssrc}</TableCell>
              <TableCell>{stream.channels}</TableCell>
              <TableCell>{stream.clockRate}</TableCell>
              <TableCell>{stream.mimeType}</TableCell>
              <TableCell>{stream.payloadType}</TableCell>
              <TableCell>{stream.sdpFmtpLine}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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

