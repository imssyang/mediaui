import { version } from '../package.json';
import { WebRTC, WebRTCSettings } from './webrtc';
import './css/ui.css'

function setOptions(options) {
    if (options?.urlGroup)
        WebRTCSettings.urlGroup = options.urlGroup
}

function InitUI(options) {
    console.log('MediaUI version: ' + version);
    setOptions(options)
    new WebRTC().createOffer()
}

export { InitUI }