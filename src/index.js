import { version } from '../package.json';
import { WebRTC, WebRTCSettings } from './webrtc';
import './css/ui.css'

function setOptions(options) {
    if (options?.urlPrefix)
        WebRTCSettings.urlPrefix = options.url.prefix
}

function InitUI(options) {
    console.log('MediaUI version: ' + version);
    setOptions(options)
    new WebRTC().createOffer()
}

export { InitUI }