import React, { createContext, useContext } from "react";

interface WebRTCConfig {
    urlGroup: string;
    iceServers: RTCIceServer[];
}

const defaultConfig: WebRTCConfig = {
    urlGroup: 'media',
    iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

const WebRTCConfigContext = createContext<WebRTCConfig>(defaultConfig);

export const WebRTCConfigProvider: React.FC<{ children: React.ReactNode; config: WebRTCConfig }> = ({ children, config }) => {
    return (
        <WebRTCConfigContext.Provider value={config}>
            {children}
        </WebRTCConfigContext.Provider>
    );
};

export const useWebRTCConfig = () => useContext(WebRTCConfigContext);