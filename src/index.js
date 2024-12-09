import { version } from '../package.json';
import { WebRTC, WebRTCSettings } from './webrtc';
import './css/ui.css'

function setOptions(options) {
    if (options?.webrtc) {
        const webrtc = options.webrtc
        if (webrtc?.urlGroup)
            WebRTCSettings.urlGroup = webrtc.urlGroup
        if (webrtc?.iceServerURLs)
            WebRTCSettings.iceServerURLs = webrtc.iceServerURLs
    }
}

function InitUI(options) {
    console.log('MediaUI version: ' + version);
    setOptions(options)
    new WebRTC()
}

export { InitUI }