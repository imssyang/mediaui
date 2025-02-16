import { WebRTCConnection } from "./connection";

export interface WebRTCConfig {
  urlGroup: string;
  iceServers: RTCIceServer[];
}

export const defaultConfig: WebRTCConfig = {
  urlGroup: 'media',
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

type Subscriber = () => void;

export class WebRTCManager {
  private config: WebRTCConfig;
  private connections: Map<string, WebRTCConnection> = new Map();
  private subscribers: Map<string, Set<Subscriber>> = new Map();
  private counter = 0;

  constructor(config?: Partial<WebRTCConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  private generateConnId(): string {
    this.counter = (this.counter + 1) % 10000;
    const now = new Date();
    const pad = (num: number, size: number = 2) => num.toString().padStart(size, "0");
    const timestamp = `${now.getFullYear() % 100}${pad(now.getMonth() + 1)}${pad(now.getDate())}` +
      `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}` +
      `${pad(now.getMilliseconds(), 3)}`;
    const counter = pad(this.counter, 4);
    return `webrtc${timestamp}${counter}`;
  }

  public createConnection(): WebRTCConnection {
    const connID = this.generateConnId();
    const conn = new WebRTCConnection(
      this.config.urlGroup,
      this.config.iceServers,
      connID
    );
    conn.onState = () => this.notifySubscribers(connID);
    this.connections.set(connID, conn);
    return conn;
  }

  public getConnection(connID: string): WebRTCConnection | null {
    return this.connections.get(connID) ?? null;
  }

  public getAllConnections(): WebRTCConnection[] {
    return Array.from(this.connections.values());
  }

  public closeConnection(connID: string) {
    const conn = this.connections.get(connID);
    if (conn) {
      const colseFn = async () => await conn.close();
      colseFn();
      this.connections.delete(connID);
    }
  }

  public closeAllConnections() {
    for (const conn of this.connections.values()) {
      const colseFn = async () => await conn.close();
      colseFn();
    }
    this.connections.clear();
  }

  public subscribe(connID: string, callback: Subscriber): () => void {
    if (!this.subscribers.has(connID)) {
      this.subscribers.set(connID, new Set());
    }
    const subs = this.subscribers.get(connID)!;
    subs.add(callback);
    return () => {
      subs.delete(callback);
      if (subs.size === 0) {
        this.subscribers.delete(connID);
      }
    };
  }

  private notifySubscribers(connID: string): void {
    this.subscribers.get(connID)?.forEach(callback => callback());
  }
}
