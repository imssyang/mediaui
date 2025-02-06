import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { version } from '../package.json'
import { log } from '@/lib/log'
import { WebRTCConfigProvider } from "@/webrtc/config";
import App from './App.tsx'
import './index.css'

function MediaUI(options: any) {
  log.json('MediaUI', {version, options})

  const webrtcConfig = {
    urlGroup: options?.webrtc?.urlGroup,
    iceServers: [{ urls: options?.webrtc?.iceServerURLs }],
  };

  const domNode = document.getElementById('root');
  const root = createRoot(domNode!);
  root.render(
    <StrictMode>
      <WebRTCConfigProvider config={webrtcConfig}>
        <App />
      </WebRTCConfigProvider>
    </StrictMode>,
  )
}

export default MediaUI