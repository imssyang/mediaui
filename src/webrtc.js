

const log = msg => {
    document.getElementById('logs').innerHTML += msg + '<br>'
}

let WebRTCSettings = {
    urlPrefix: null,
    iceServerURLs: [],
}

class WebRTC {
    constructor(iceServerURL) {
        this.iceServerURL = iceServerURL
        this.createConnect(iceServerURL)
    }
    createConnect(iceServerURL) {
        let config = {
            iceServers: []
        }
        if (iceServerURL)
            config.iceServers.push({
                urls: iceServerURL
            })
        console.log('createConnect', config)
        this.peerConnection = new RTCPeerConnection(config)
        this.peerConnection.ontrack = event => {
            const trackEl = document.createElement(event.track.kind)
            trackEl.srcObject = event.streams[0]
            trackEl.autoplay = true
            trackEl.controls = true
            document.getElementById('videos').appendChild(trackEl)
        }

        this.peerConnection.oniceconnectionstatechange = event => {
            console.log('oniceconnectionstatechange', event)
            document.getElementById('logs').innerHTML += this.peerConnection.iceConnectionState + '<br>'
        }

        this.peerConnection.onicecandidate = event => {
            console.log('onicecandidate', event)
            if (event.candidate === null) {
                console.log('onicecandidate', this.peerConnection.localDescription)
                this.request(this.peerConnection.localDescription)
            }
        }
    }
    createOffer() {
        this.peerConnection.addTransceiver('video', {
            direction: 'sendrecv'
        })

        this.peerConnection.addTransceiver('audio', {
            direction: 'sendrecv'
        })

        this.peerConnection.createOffer().then(desc => {
            this.peerConnection.setLocalDescription(desc)
            console.log('createOffer')
        }).catch(log)
    }
    setRemoteDesc(desc) {
        try {
            this.peerConnection.setRemoteDescription(desc)
        } catch (e) {
            alert(e)
        }
    }
    request(desc) {
        const prefix = WebRTCSettings.url.prefix || ''
        const url = `${prefix}/webrtc/offer`
        const base64 = btoa(JSON.stringify(desc))
        const body = JSON.stringify({
            connID: '12345',
            preferNetwork: 'udp',
            peerBindPort: false,
            iceServerURLs: [],
            description: base64,
        })
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': "application/json"
            },
            body: body
        })
        .then(response => {
            if (response.ok) {
                return response.json()
            } else {
                throw new Error('HTTP status = ' + response.status)
            }
        })
        .then(data => {
            //console.log('response', data)
            const rDesc = JSON.parse(atob(data.description))
            this.setRemoteDesc(rDesc)
            console.log("remoteDesc:", rDesc);
            //const { type, sdp } = rDesc;
            //const remoteDesc = new RTCSessionDescription({ type, sdp });
            //this.peerConnection.setRemoteDescription(remoteDesc)
            //console.log("remoteDesc:", remoteDesc, this.peerConnection.remoteDescription);
        })
        .catch(error => {
            console.error(error)
        })
    }
}

export { WebRTC, WebRTCSettings }