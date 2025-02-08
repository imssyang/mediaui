import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { WebRTCManager, WebRTCConfig, defaultConfig } from "./manager";
import { WebRTCConnection } from "./connection";

interface WebRTCState {
    connectionState: RTCIceConnectionState | null;
    mediaStream: MediaStream | null;
}

const getCurrentState = (
    manager: WebRTCManager,
    connID: string
): WebRTCState => ({
    connectionState: manager.getIceConnectionState(connID),
    mediaStream: manager.getMediaStream(connID),
});

const chooseState = (
    manager: WebRTCManager,
    connID: string,
    prevState: WebRTCState
): WebRTCState => {
    const newState = getCurrentState(manager, connID);
    return (prevState.connectionState !== newState.connectionState ||
        prevState.mediaStream !== newState.mediaStream)
        ? newState
        : prevState;
};

type WebRTCAction =
    | { type: 'newConnection'; connID: string; urls: string[] }
    | { type: 'createOffer'; connID: string; urls: string[] }
    | { type: 'delConnection'; connID: string };

const WebRTCContext = createContext<WebRTCManager | null>(null);
const WebRTCDispatchContext = createContext(null);

function WebRTCReducer(manager: WebRTCManager, action: WebRTCAction): WebRTCManager {
    switch (action.type) {
        case 'newConnection': {
            return [
                ...tasks,
                {
                    id: action.id,
                    text: action.text,
                    done: false,
                },
            ];
        }
        case 'createOffer': {
            return tasks.map((t) =>
                t.id === action.task.id ? action.task : t
            );
        }
        case 'delConnection': {
            return tasks.filter((t) => t.id !== action.id);
        }
        default: {
            throw new Error('Unknown action: ' + (action as any).type);
        }
    }
}

type WebRTCProviderProps = {
    children: React.ReactNode
    config?: WebRTCConfig
}

export function WebRTCProvider({
    children,
    config = defaultConfig,
}: WebRTCProviderProps) {
    const manager = useMemo(() => new WebRTCManager(config), [config]);

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

export const useWebRTCConnection = (connID: string): WebRTCConnection | null => {
    const manager = useWebRTC();
    const connection = useMemo(() => manager.getConnection(connID), [manager, connID]);
    return connection;
}

export const useWebRTCState = (connID: string): WebRTCState => {
    const manager = useWebRTC();

    const [state, setState] = useState<WebRTCState>(() =>
        getCurrentState(manager, connID)
    );

    useEffect(() => {
        const updateState = () => {
            setState((prevState) => chooseState(manager, connID, prevState));
        };

        const unsubscribe = manager.subscribe(connID, updateState);
        return () => {
            unsubscribe();
        };
    }, [connID, manager]);

    return state;
};
