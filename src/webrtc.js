
let WebRTCSettings = {
    urlGroup: null,
    iceServerURLs: [],
}

class WebRTCConnection {
    constructor(connID) {
        this.connID = connID
        this.connection = new RTCPeerConnection({
            iceServers: [{
                urls: WebRTCSettings.iceServerURLs
            }]
        })
        this.connection.oniceconnectionstatechange = (event) => this.oniceconnectionstatechange(event)
        this.connection.onicecandidate = (event) => this.onicecandidate(event)
        this.connection.ontrack = (event) => this.ontrack(event)
    }
    oniceconnectionstatechange(event) {
        console.log('oniceconnectionstatechange', event)
        document.getElementById('logs').innerHTML += this.connection.iceConnectionState + '<br>'
    }
    onicecandidate(event) {
        console.log('onicecandidate', event)
        if (event.candidate === null) {
            console.log('localDescription', this.connection.localDescription)
            this.request(this.connection.localDescription)
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
    onanswer(event) {
        console.log('onanswer', event)
        const desc = JSON.parse(atob(event.rsp.description))
        try {
            this.connection.setRemoteDescription(desc)
            console.log("remoteDescription:", desc);
        } catch (error) {
            console.error(error)
        }
    }
    onresponse(url, req, rsp) {
        if (url.includes('webrtc/offer')) {
            this.onanswer({ req: req, rsp: rsp })
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
        }).then(() => {
            const prefix = WebRTCSettings.urlGroup ? `/${WebRTCSettings.urlGroup}` : ''
            const params = new URLSearchParams({
                connid: this.connID
            }).toString()
            const url = `${prefix}/webrtc/offer?${params}`
            const desc = this.connection.localDescription
            const req = {
                preferNetwork: 'udp',
                peerBindPort: false,
                iceServerURLs: WebRTCSettings.iceServerURLs,
                description: btoa(JSON.stringify(desc)),
            }
            console.log("localDescription:", desc);
            this.request(url, req)
        }).catch(error => {
            console.error(error)
        })
    }
    request(url, req) {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': "application/json"
            },
            body: JSON.stringify(req)
        }).then(response => {
            return response.json()
        })
        .then(data => {
            this.onresponse(url, req, data)
        })
        .catch(error => {
            console.error(error)
        })
    }
}

class WebRTC {
    constructor() {
        this.createConnect(iceServerURL)
    }
}

export { WebRTC, WebRTCSettings }