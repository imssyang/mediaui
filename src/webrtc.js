
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
    startfetchCandidates() {
        const timeout = 10000
        if (!this.fetchCandidatesTimer) {
            this.fetchCandidatesTimer = setInterval(() => {
                const url = this.url('candidate', {
                    connid: this.connID
                })
                this.request('GET', url, {
                    timeout: timeout,
                })
            }, 50);
            setTimeout(() => this.stopFetchCandidates, timeout);
        }
    }
    stopFetchCandidates = () => {
        if (this.fetchCandidatesTimer) {
            clearInterval(this.fetchCandidatesTimer);
        }
    }
    oniceconnectionstatechange(_event) {
        console.log('oniceconnectionstatechange', this.connection.iceConnectionState)
        document.getElementById('logs').innerHTML += this.connection.iceConnectionState + '<br>'
        const state = this.connection.iceConnectionState
        if (state == "checking") {
            this.startfetchCandidates()
        } else if (["closed", "completed", "connected", "disconnected", "failed"].includes(state)) {
            this.stopFetchCandidates()
        }
    }
    onicecandidate(event) {
        console.log('onicecandidate', event.candidate)
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
        } else {
            this.startfetchCandidates()
        }
    }
    ontrack(event) {
        console.log('ontrack', event)
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
                console.error(error)
            })
            console.log('remoteDescription', desc);
        } else if (http.url.includes('webrtc/candidate')) {
            if (http.ok) {
                if (method == 'GET') {
                    if (rsp.iceCandidates) {
                        for (const candidate of rsp.iceCandidates) {
                            console.log('webrtc/addIceCandidate', candidate)
                            this.connection.addIceCandidate(candidate).catch(error => {
                                console.error(error)
                            })
                        }
                    }
                }
            } else {
                console.error('webrtc/candidate', method, rsp)
            }
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
                preferNetwork: 'udp',
                peerBindPort: false,
                iceServerURLs: WebRTCSettings.iceServerURLs,
                description: btoa(JSON.stringify(desc)),
            }
            console.log('localDescription', desc);
            this.request('POST', url, {
                body: body,
            })
        }).catch(error => {
            console.error(error)
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