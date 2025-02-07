import { log } from '@/lib/log';

export class WebRTCConnection {
    private urlGroup: string;
    private iceServers: RTCIceServer[];
    private connID: string;
    private fetchCandidatesTimer: NodeJS.Timeout | null = null;
    private fetchCandidatesDisable = false;
    public peerConnection: RTCPeerConnection;
    public mediaStream = new MediaStream();
    public onIceConnectionStateChange?: (event: Event) => void;
    public onIceCandidate?: (event: RTCPeerConnectionIceEvent) => void;
    public onTrack?: (event: RTCTrackEvent) => void;

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
        return this.peerConnection.close()
    }

    private handleIceConnectionStateChange(event: Event): void {
        log.webrtc('oniceconnectionstatechange', this.peerConnection.iceConnectionState);
        const state = this.peerConnection.iceConnectionState;
        if (state === 'checking') {
            this.startFetchCandidates();
        } else if (["closed", "completed", "connected", "disconnected", "failed"].includes(state)) {
            this.stopFetchCandidates();
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
        if (!this.mediaStream.getTracks().some(track => track.id === event.track.id)) {
            this.mediaStream.addTrack(event.track);
        }

        if (this.onTrack) {
            this.onTrack(event);
        }
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
