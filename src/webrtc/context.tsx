import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
} from "react";
import { WebRTCManager, WebRTCConfig, defaultConfig } from "./manager";
import { WebRTCConnection } from "./connection";

const WebRTCContext = createContext<WebRTCManager | null>(null);

type WebRTCProviderProps = {
    children: ReactNode
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
