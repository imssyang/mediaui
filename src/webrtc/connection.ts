import { log } from '@/lib/log';

export class WebRTCConnection {
    private urlGroup: string;
    private iceServers: RTCIceServer[];
    private fetchCandidatesTimer: NodeJS.Timeout | null = null;
    private fetchCandidatesDisable = false;
    public connID: string;
    public peerConnection: RTCPeerConnection;
    public mediaStream: MediaStream | null = null;
    public mediaSource: MediaSource | null = null;
    public sourceBuffer: SourceBuffer | null = null;
    public onIceConnectionStateChange?: (event: Event) => void;
    public onIceCandidate?: (event: RTCPeerConnectionIceEvent) => void;
    public onTrack?: (event: RTCTrackEvent) => void;
    public onClose?: () => void;

    constructor(
        urlGroup: string,
        iceServers: RTCIceServer[],
        connID: string,
    ) {
        this.urlGroup = urlGroup;
        this.iceServers = iceServers;
        this.connID = connID;
        this.peerConnection = new RTCPeerConnection({
            iceServers: this.iceServers ? this.iceServers : [],
        });
        this.peerConnection.oniceconnectionstatechange = (event) => this.handleIceConnectionStateChange(event);
        this.peerConnection.onicecandidate = (event) => this.handleIceCandidate(event);
        this.peerConnection.ontrack = (event) => this.handleTrack(event);
        log.webrtc('new', connID)
    }

    public close() {
        log.webrtc('close', this.connID)
        this.peerConnection.close()
        if (this.onClose) {
            this.onClose();
        }
    }

    private handleIceConnectionStateChange(event: Event): void {
        log.webrtc('oniceconnectionstatechange', this.peerConnection.iceConnectionState);
        const state = this.peerConnection.iceConnectionState;
        if (state === 'checking') {
            this.startFetchCandidates();
        } else if (["closed", "completed", "connected", "disconnected", "failed"].includes(state)) {
            this.stopFetchCandidates();
            if (state == "connected") {
                this.peerConnection.getStats(null).then(stats => {
                    stats.forEach(report => {
                        console.log("实际使用的 report:", report);
                        if (report.type === "inbound-rtp" && report.kind === "video") {
                            console.log("实际使用的 codec:", report.codecId, report);
                        }
                    });
                });
            }
        }

        if (this.onIceConnectionStateChange) {
            this.onIceConnectionStateChange(event);
        }
    }

    private handleIceCandidate(event: RTCPeerConnectionIceEvent): void {
        if (event.candidate) {
            log.webrtc('onicecandidate', event.candidate);
            const url = this.getUrl('candidate', { connid: this.connID });
            this.request('POST', url, { body: { iceCandidates: [event.candidate] } });
        }

        if (this.onIceCandidate) {
            this.onIceCandidate(event);
        }
    }

    private handleTrack(event: RTCTrackEvent): void {
        log.webrtc('handleTrack', event);
        this.handleTrackSource(event);
        //if (!this.mediaStream)
        //    this.mediaStream = new MediaStream();
        //const tracks = this.mediaStream.getTracks();
        //if (!tracks.some(track => track.id === event.track.id)) {
        //    this.mediaStream.addTrack(event.track);
        //}
        if (this.onTrack) {
            this.onTrack(event);
        }
    }

    private handleTrackSource(event: RTCTrackEvent): void {
        log.webrtc('handleTrackSource', event.track.kind, event, this.peerConnection.remoteDescription);

        const sdp = this.peerConnection.remoteDescription?.sdp;
        if (!sdp) return;

        const mimeType = this.getMimeTypeFromSDP(sdp, event.track.kind);
        console.log(`Detected mimeType: ${mimeType} --- ${sdp}`);

        const params = event.receiver?.getParameters()
        console.log(`Parameter --- ${params}`);

        if (event.track.getCapabilities()) {
            console.log("Capabilities:", event.track.getCapabilities());
        }
        if (event.track.getSettings()) {
            console.log("Settings:", event.track.getSettings());
        }

        if (!this.mediaSource) {
            this.mediaSource = new MediaSource();
            this.mediaSource.addEventListener("sourceopen", async () => {
                console.log("MediaSource Opened", this.mediaSource?.readyState);
                if (this.mediaSource?.readyState !== "open")
                    return;

                //console.log(`MIME type: ${mimeType}`);
                //const buffer = this.mediaSource.addSourceBuffer(mimeType);
            });
        }
    }

    private getMimeTypeFromSDP(sdp: string, kind: string): string | null {
        const lines = sdp.split("\n");

        for (const line of lines) {
            if (line.startsWith("m=") && line.includes(kind)) {
                const codecLine = lines.find(l => l.startsWith("a=rtpmap"));
                if (!codecLine) return null;

                const codecInfo = codecLine.split(" ")[1]; // 例如 `96 VP8/90000`
                const codecName = codecInfo.split("/")[0]; // 提取 `VP8`

                if (kind === "video") return `video/${codecName.toLowerCase()}`;
                if (kind === "audio") return `audio/${codecName.toLowerCase()}`;
            }
        }
        return null;
    }

    private handleResponse(method: string, http: Response | { ok: boolean; url: string }, _req: any, rsp: any): void {
        if (http.url.includes('webrtc/offer')) {
            const desc = JSON.parse(atob(rsp.description));
            this.peerConnection.setRemoteDescription(new RTCSessionDescription(desc)).catch(log.webrtc);
        } else if (http.url.includes('webrtc/candidate')) {
            if (http.ok && rsp.iceCandidates) {
                rsp.iceCandidates.forEach((candidate: RTCIceCandidateInit) => {
                    this.peerConnection.addIceCandidate(candidate).catch(log.webrtc);
                });
                if (rsp.iceGatheringState === 'complete') {
                    this.stopFetchCandidates();
                }
            }
            if (method === 'GET' && this.fetchCandidatesTimer) {
                this.fetchCandidatesDisable = false;
            }
        }
    }

    private startFetchCandidates(): void {
        if (!this.fetchCandidatesTimer) {
            log.webrtc('start fetchCandidatesTimer', this.connID);
            this.fetchCandidatesTimer = setInterval(() => {
                if (!this.fetchCandidatesDisable) {
                    const url = this.getUrl('candidate', { connid: this.connID });
                    this.request('GET', url, { timeout: 10000 });
                    this.fetchCandidatesDisable = true;
                }
            }, 1000);
            setTimeout(() => this.stopFetchCandidates(), 10000);
        }
    }

    private stopFetchCandidates(): void {
        if (this.fetchCandidatesTimer) {
            clearInterval(this.fetchCandidatesTimer);
            this.fetchCandidatesTimer = null;
            log.webrtc('stop fetchCandidatesTimer', this.connID);
        }
    }

    public async createOffer(hasVideo: boolean, hasAudio: boolean): Promise<void> {
        if (hasVideo) this.peerConnection.addTransceiver('video', { direction: 'sendrecv' });
        if (hasAudio) this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' });

        try {
            const desc = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(desc);

            const url = this.getUrl('offer', { connid: this.connID });
            const body = {
                streamURLs: [
                    '/opt/app/gweb/tests/play-from-disk/output.ivf',
                    '/opt/app/gweb/tests/play-from-disk/output.ogg',
                ],
                preferNetwork: 'udp',
                peerBindPort: false,
                iceServerURLs: this.iceServers[0].urls,
                description: btoa(JSON.stringify(desc)),
            };
            this.request('POST', url, { body });
        } catch (error) {
            log.webrtc(error);
        }
    }

    private getUrl(name: string, params: Record<string, string>): string {
        const searchParams = new URLSearchParams(params).toString();
        return `/${this.urlGroup}/webrtc/${name}?${searchParams}`;
    }

    private async request(method: string, url: string, options?: { body?: any; timeout?: number }): Promise<void> {
        try {
            const fetchOpts: RequestInit = {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: method === 'POST' ? JSON.stringify(options?.body) : undefined,
            };

            const response = options?.timeout
                ? await Promise.race([
                    fetch(url, fetchOpts),
                    new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Request Timeout')), options.timeout)),
                ])
                : await fetch(url, fetchOpts);

            if (!response.ok) throw new Error(`RequestError: ${response.status}`);
            const data = await response.json();
            this.handleResponse(method, response, options?.body, data);
        } catch (error) {
            log.webrtc(error);
        }
    }
}
