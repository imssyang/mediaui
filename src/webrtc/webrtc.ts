// @ts-ignore
import { WebRTC, WebRTCSettings } from './internal.js';

export function createWebRTC(options: any) {
  if (options?.urlGroup)
    WebRTCSettings.urlGroup = options.urlGroup
  if (options?.iceServerURLs)
    WebRTCSettings.iceServerURLs = options.iceServerURLs

  return new WebRTC()
}
