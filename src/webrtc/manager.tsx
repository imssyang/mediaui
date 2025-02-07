import React, { createContext, useContext, useEffect, useState } from "react";
import { WebRTCConnection } from "./connection";

interface WebRTCConfig {
  urlGroup: string;
  iceServers: RTCIceServer[];
}

const defaultConfig: WebRTCConfig = {
  urlGroup: 'media',
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

class WebRTCManager {
  private config: WebRTCConfig = defaultConfig;
  private connections = new Map<string, WebRTCConnection>();
  private subscribers = new Map<string, Set<() => void>>();

  constructor(config: WebRTCConfig) {
    this.config = config;
  }

  public getConnection(connID: string): WebRTCConnection {
    if (!this.connections.has(connID)) {
      const conn = new WebRTCConnection(
        this.config.urlGroup,
        this.config.iceServers,
        connID,
      );
      conn.onIceConnectionStateChange = () => this.notifySubscribers(connID);
      conn.onTrack = () => this.notifySubscribers(connID);
      this.connections.set(connID, conn);
    }
    return this.connections.get(connID)!;
  }

  public getAllConnections(): WebRTCConnection[] {
    return Array.from(this.connections.values());
  }

  public closeConnection(connID: string) {
    this.connections.get(connID)?.close();
    this.connections.delete(connID);
  }

  public closeAllConnections() {
    this.connections.forEach((conn) => conn.close());
    this.connections.clear();
  }

  public subscribe(connID: string, callback: () => void) {
    if (!this.subscribers.has(connID)) {
      this.subscribers.set(connID, new Set());
    }
    this.subscribers.get(connID)!.add(callback);
    return () => {
      const callbacks = this.subscribers.get(connID)!;
      callbacks.delete(callback);
      if (callbacks.size == 0) {
        this.subscribers.delete(connID);
      }
    };
  }

  private notifySubscribers(connID: string) {
    this.subscribers.get(connID)?.forEach(callback => callback());
  }

  public getIceConnectionState(connID: string) {
    return this.connections.get(connID)?.peerConnection.iceConnectionState || null;
  }

  public getMediaStream(connID: string) {
    return this.connections.get(connID)?.mediaStream || null;
  }
}

const WebRTCContext = createContext<WebRTCManager | null>(null);

type WebRTCProviderProps = {
  children: React.ReactNode
  config?: WebRTCConfig
}

export function WebRTCProvider({
  children,
  config = defaultConfig,
}: WebRTCProviderProps) {
  const [manager] = useState(new WebRTCManager(config));

  useEffect(() => {
    return () => {
      manager.closeAllConnections();
    };
  }, []);

  return (
    <WebRTCContext.Provider value={manager}>
      {children}
    </WebRTCContext.Provider>
  );
};

export const useWebRTC = () => {
  const context = useContext(WebRTCContext);
  if (!context) {
    throw new Error("useWebRTC must used inside of WebRTCProvider");
  }
  return context;
};
