import { WebRTCManager } from "./manager";

export class WebRTCState {
    manager: WebRTCManager;
    connID: string;
    connectionState: RTCIceConnectionState = 'new';
    mediaStream: MediaStream | null = null;

    constructor(manager: WebRTCManager, connID: string) {
        this.manager = manager;
        this.connID = connID;
        this.update();
    }

    equal(state: WebRTCState) {
        return this.connectionState === state.connectionState &&
            this.mediaStream?.id === state.mediaStream?.id;
    }

    update() {
        const conn = this.manager.getConnection(this.connID);
        this.connectionState = conn?.peerConnection.iceConnectionState ?? "new";
        this.mediaStream = conn?.mediaStream || null;
    }
};

