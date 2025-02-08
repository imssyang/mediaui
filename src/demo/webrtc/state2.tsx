import { useEffect, useReducer, useRef, useState, useSyncExternalStore } from 'react';
import { useWebRTC } from '@/webrtc/context';

interface WebRTCConnectionData {
  mediaStream: MediaStream | null;
  connectionState: string | null;
}

export const useWebRTCConnection = (connID: string) => {
  const webrtc = useWebRTC();
  const lastRef = useRef<WebRTCConnectionData>(null);

  const subscribe = (callback: () => void) => {
    return webrtc.subscribe(connID, callback);
  };

  const getSnapshot = () => {
    const connectionState = webrtc.getIceConnectionState(connID);
    const mediaStream = webrtc.getMediaStream(connID);

    if (
      lastRef.current &&
      lastRef.current.connectionState === connectionState &&
      lastRef.current.mediaStream === mediaStream
    ) {
      return lastRef.current;
    }

    lastRef.current = { connectionState, mediaStream };
    return lastRef.current;
  };

  return useSyncExternalStore(subscribe, getSnapshot);
};

export const useWebRTCConnection3 = (connID: string) => {
  const webrtcManager = useWebRTC();
  return {
    connectionState: webrtcManager.getIceConnectionState(connID),
    mediaStream: webrtcManager.getMediaStream(connID),
  }
}

export const useWebRTCConnection2 = (userID: string) => {
  const webrtcManager = useWebRTC();

  const [state, setState] = useState(() => ({
    connectionState: webrtcManager.getIceConnectionState(userID),
    mediaStream: webrtcManager.getMediaStream(userID),
  }));

  useEffect(() => {
    const updateState = () => {
      setState(prevState => {
        const newState = {
          connectionState: webrtcManager.getIceConnectionState(userID),
          mediaStream: webrtcManager.getMediaStream(userID),
        };
        return prevState.connectionState !== newState.connectionState ||
          prevState.mediaStream !== newState.mediaStream
          ? newState
          : prevState;
      });
    };
    const unsubscribe = webrtcManager.subscribe(userID, updateState);
    return () => {
      unsubscribe();
    };
  }, [userID, webrtcManager]);

  return state;
};





type WebRTCState = {
  connectionState: string | null;
  mediaStream: MediaStream | null;
};

type Action =
  | { type: "UPDATE_CONNECTION"; connectionState: string | null }
  | { type: "UPDATE_STREAM"; mediaStream: MediaStream | null };

const reducer = (state: WebRTCState, action: Action): WebRTCState => {
  switch (action.type) {
    case "UPDATE_CONNECTION":
      return { ...state, connectionState: action.connectionState };
    case "UPDATE_STREAM":
      return { ...state, mediaStream: action.mediaStream };
    default:
      return state;
  }
};

export const useWebRTCConnection4 = (userID: string) => {
  const webrtcManager = useWebRTC();

  const [state, dispatch] = useReducer(reducer, {
    connectionState: webrtcManager.getIceConnectionState(userID),
    mediaStream: webrtcManager.getMediaStream(userID),
  });

  useEffect(() => {
    const updateState = () => {
      dispatch({ type: "UPDATE_CONNECTION", connectionState: webrtcManager.getIceConnectionState(userID) });
      dispatch({ type: "UPDATE_STREAM", mediaStream: webrtcManager.getMediaStream(userID) });
    };

    const unsubscribe = webrtcManager.subscribe(userID, updateState);
    return () => unsubscribe();
  }, [userID, webrtcManager]);

  return state;
};