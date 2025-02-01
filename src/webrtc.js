import { log } from './log.js';

let WebRTCSettings = {
    urlGroup: null,
    iceServerURLs: [],
}

class WebRTCConnection {
    constructor(connID) {
        this.connID = connID
        this.connection = new RTCPeerConnection(this.config)
        this.connection.oniceconnectionstatechange = (event) => this.oniceconnectionstatechange(event)
        this.connection.onicecandidate = (event) => this.onicecandidate(event)
        this.connection.ontrack = (event) => this.ontrack(event)
        this.fetchCandidatesTimer = null
        this.fetchCandidatesDisable = false
    }
    get config() {
        let conf = {}
        if (WebRTCSettings.iceServerURLs && WebRTCSettings.iceServerURLs.length > 0) {
            conf.iceServers = [{
                urls: WebRTCSettings.iceServerURLs
            }]
        }
        return conf
    }
    oniceconnectionstatechange(_event) {
        log.webrtc.info('oniceconnectionstatechange', this.connection.iceConnectionState)
        document.getElementById('logs').innerHTML += this.connection.iceConnectionState + '<br>'
        const state = this.connection.iceConnectionState
        if (state == "checking") {
            this.startFetchCandidates()
        } else if (["closed", "completed", "connected", "disconnected", "failed"].includes(state)) {
            this.stopFetchCandidates()
        }
    }
    onicecandidate(event) {
        log.webrtc.info('onicecandidate', event.candidate)
        if (event.candidate !== null) {
            const url = this.url('candidate', {
                connid: this.connID
            })
            const body = {
                iceCandidates: [
                    event.candidate
                ],
            }
            this.request('POST', url, {
                body: body,
            })
        }
    }
    ontrack(event) {
        log.webrtc.info('ontrack', event)
        const trackEl = document.createElement(event.track.kind)
        trackEl.srcObject = event.streams[0]
        trackEl.autoplay = true
        trackEl.controls = true
        document.getElementById('videos').appendChild(trackEl)
    }
    onresponse(method, http, req, rsp) {
        if (http.url.includes('webrtc/offer')) {
            const desc = JSON.parse(atob(rsp.description))
            this.connection.setRemoteDescription(desc).catch(error => {
                log.webrtc.error(error)
            })
            log.webrtc.info('remoteDescription', desc);
        } else if (http.url.includes('webrtc/candidate')) {
            log.webrtc.info('onresponse', http, req, rsp)
            if (http.ok) {
                if (rsp.iceCandidates) {
                    for (const candidate of rsp.iceCandidates) {
                        log.webrtc.info('webrtc/addIceCandidate', candidate)
                        this.connection.addIceCandidate(candidate).catch(error => {
                            log.webrtc.error(error)
                        })
                    }
                    if (rsp.iceGatheringState == 'complete') {
                        this.stopFetchCandidates()
                    }
                }
            } else {
                log.webrtc.error('webrtc/candidate', method, rsp)
            }
            if (method == "GET") {
                if (this.fetchCandidatesTimer) {
                    this.fetchCandidatesDisable = false
                }
            }
        }
    }
    startFetchCandidates() {
        const timeout = 10000
        if (!this.fetchCandidatesTimer) {
            log.webrtc.info('start fetchCandidatesTimer', this.connID)
            this.fetchCandidatesTimer = setInterval(() => {
                if (!this.fetchCandidatesDisable) {
                    const url = this.url('candidate', {
                        connid: this.connID
                    })
                    this.request('GET', url, {
                        timeout: timeout,
                    })
                    this.fetchCandidatesDisable = true
                }
            }, 1000);
            setTimeout(() => this.stopFetchCandidates, timeout);
        }
    }
    stopFetchCandidates = () => {
        if (this.fetchCandidatesTimer) {
            clearInterval(this.fetchCandidatesTimer);
            this.fetchCandidatesTimer = null
            log.webrtc.info('stop fetchCandidatesTimer', this.connID)
        }
    }
    offer(hasVideo, hasAudio) {
        if (hasVideo) {
            this.connection.addTransceiver('video', {
                direction: 'sendrecv'
            })
        }
        if (hasAudio) {
            this.connection.addTransceiver('audio', {
                direction: 'sendrecv'
            })
        }
        this.connection.createOffer().then(desc => {
            this.connection.setLocalDescription(desc)

            const url = this.url('offer', {
                connid: this.connID
            })
            const body = {
                streamURLs: [
                    '/opt/app/gweb/tests/play-from-disk/output.ivf',
                    '/opt/app/gweb/tests/play-from-disk/output.ogg',
                ],
                preferNetwork: 'udp',
                peerBindPort: false,
                iceServerURLs: WebRTCSettings.iceServerURLs,
                description: btoa(JSON.stringify(desc)),
            }
            log.webrtc.info('localDescription', desc);
            this.request('POST', url, {
                body: body,
            })
        }).catch(error => {
            log.webrtc.error(error)
        })
    }
    url(name, params) {
        const prefix = WebRTCSettings.urlGroup ? `/${WebRTCSettings.urlGroup}` : ''
        const searchParams = new URLSearchParams(params).toString()
        return `${prefix}/webrtc/${name}?${searchParams}`
    }
    request(method, url, options) {
        (async () => {
            let fetchOpts = {
                method: method,
                headers: {
                    'Content-Type': "application/json"
                }
            }
            if (method == "POST") {
                fetchOpts.body = JSON.stringify(options.body)
            }
            const fetchPromise = fetch(url, fetchOpts);

            try {
                let response = null
                if (options?.timeout) {
                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error(`RequestTimeout: ${options.timeout}`)), options.timeout)
                    );
                    response = await Promise.race([fetchPromise, timeoutPromise]);
                } else {
                    response = await fetchPromise
                }
                if (!response.ok) {
                    throw new Error(`RequestError: ${response.status}`);
                }

                const data = await response.json();
                this.onresponse(method, response, options.body, data)
            } catch (error) {
                const status = error.message.includes('RequestTimeout') ? 408 : 409
                const statusText = status == 408 ? 'Request Timeout' : 'Conflict'
                this.onresponse(method, {
                    ok: false,
                    url: url,
                    status: status,
                    statusText: statusText,
                }, options.body, {
                    error: error.message,
                })
            }
        })()
    }
}

class WebRTC {
    constructor() {
        this.connObj = new WebRTCConnection("123")
        this.connObj.offer(true, true)
    }
}

export { WebRTC, WebRTCSettings }