import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { WebRTCStreamStats } from "./connection";
import { useWebRTC } from "./context";
import { WebRTCManager } from "./manager";

export class WebRTCState {
    manager: WebRTCManager;
    connID: string;
    connState: RTCIceConnectionState = 'new';
    streamStats: WebRTCStreamStats[] = [];
    mediaStream?: MediaStream;

    constructor(manager: WebRTCManager, connID: string) {
        this.manager = manager;
        this.connID = connID;
        this.update();
    }

    equal(state: WebRTCState) {
        return this.connState === state.connState &&
            this.mediaStream?.id === state.mediaStream?.id &&
            this.streamStats.length === state.streamStats.length &&
            this.streamStats.every((stat, index) => {
                JSON.stringify(stat) == JSON.stringify(state.streamStats[index]);
            });
    }

    update() {
        const conn = this.manager.getConnection(this.connID);
        if (!conn)
            return;

        this.connState = conn.peerConnection.iceConnectionState;
        this.streamStats = conn.getStreamStats();
        this.mediaStream = conn.mediaStream;
    }
};

export const useWebRTCState = (connID: string): WebRTCState => {
    const manager = useWebRTC();
    const [state, setState] = useState(() => new WebRTCState(manager, connID));

    useEffect(() => {
        const updateState = () => {
            const newState = new WebRTCState(manager, connID);
            setState(prevState => prevState.equal(newState) ? prevState : newState);
        };

        const unsubscribe = manager.subscribe(connID, updateState);
        return () => {
            unsubscribe();
        };
    }, [manager, connID]);

    return state;
};

export const useWebRTCState2 = (connID: string) => {
    const manager = useWebRTC();
    const lastRef = useRef(new WebRTCState(manager, connID));

    const subscribe = (callback: () => void) => {
        return manager.subscribe(connID, callback);
    };

    const getSnapshot = () => {
        const newState = new WebRTCState(manager, connID);
        if (newState.equal(lastRef.current)) {
            return lastRef.current;
        }

        lastRef.current = newState;
        return lastRef.current;
    };

    return useSyncExternalStore(subscribe, getSnapshot);
};