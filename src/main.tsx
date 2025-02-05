import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { version } from '../package.json'
import { log } from '@/lib/log'
//import { createWebRTC } from '@/webrtc/webrtc'
import App from './App.tsx'
import './index.css'

function MediaUI(options: any) {
  log.json('MediaUI', {version, options})

  const domNode = document.getElementById('root');
  const root = createRoot(domNode!);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )

  //createWebRTC(options?.webrtc)
}

export default MediaUI