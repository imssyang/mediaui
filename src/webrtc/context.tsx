import {
    ReactNode,
    createContext,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    useSyncExternalStore,
} from "react";
import { WebRTCManager, WebRTCConfig, defaultConfig } from "./manager";
import { WebRTCConnection } from "./connection";
import { WebRTCState } from "./state";

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
    }, [connID, manager]);

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

        if (lastRef.current.equal(newState)) {
            return lastRef.current;
        }

        lastRef.current = newState;
        return lastRef.current;
    };

    return useSyncExternalStore(subscribe, getSnapshot);
};