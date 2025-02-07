import { log } from '@/lib/log';

export interface WebRTCConnectionOptions {
    urlGroup?: string | null;
    iceServerURLs: string | string[];
    connID: string;
}

export class WebRTCConnection {
    private options: WebRTCConnectionOptions;
    private peerConnection: RTCPeerConnection;
    private fetchCandidatesTimer: NodeJS.Timeout | null = null;
    private fetchCandidatesDisable = false;
    private mediaStream: MediaStream | null = null;

    ontrack?: (event: RTCTrackEvent) => void;

    constructor(options: WebRTCConnectionOptions) {
        this.options = options;
        this.peerConnection = new RTCPeerConnection(this.getConfig());
        this.peerConnection.oniceconnectionstatechange = (event) => this.handleIceConnectionStateChange(event);
        this.peerConnection.onicecandidate = (event) => this.handleIceCandidate(event);
        this.peerConnection.ontrack = (event) => this.handleTrack(event);
        log.webrtc('new', this.options.connID)
    }

    public close() {
        log.webrtc('close', this.options.connID)
        return this.peerConnection.close()
    }

    private getConfig(): RTCConfiguration {
        return {
            iceServers: this.options.iceServerURLs.length > 0 ? [{ urls: this.options.iceServerURLs }] : [],
        };
    }

    private handleIceConnectionStateChange(_event: Event): void {
        log.webrtc('oniceconnectionstatechange', this.peerConnection.iceConnectionState);
        const state = this.peerConnection.iceConnectionState;
        if (state === 'checking') {
            this.startFetchCandidates();
        } else if (["closed", "completed", "connected", "disconnected", "failed"].includes(state)) {
            this.stopFetchCandidates();
        }
    }

    private handleIceCandidate(event: RTCPeerConnectionIceEvent): void {
        if (event.candidate) {
            log.webrtc('onicecandidate', event.candidate);
            const url = this.getUrl('candidate', { connid: this.options.connID });
            this.request('POST', url, { body: { iceCandidates: [event.candidate] } });
        }
    }

    private handleTrack(event: RTCTrackEvent): void {
        log.webrtc('handleTrack', event);
        if (this.ontrack) {
            this.ontrack(event);
            return;
        }

        if (!this.mediaStream) {
            this.mediaStream = new MediaStream();
            const trackEl = document.createElement('video');
            trackEl.srcObject = this.mediaStream;
            trackEl.autoplay = true;
            trackEl.playsInline = true;
            trackEl.controls = true;
            document.getElementById('videos')?.appendChild(trackEl);
        }

        if (!this.mediaStream.getTracks().some(track => track.id === event.track.id)) {
            this.mediaStream.addTrack(event.track);
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
            log.webrtc('start fetchCandidatesTimer', this.options.connID);
            this.fetchCandidatesTimer = setInterval(() => {
                if (!this.fetchCandidatesDisable) {
                    const url = this.getUrl('candidate', { connid: this.options.connID });
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
            log.webrtc('stop fetchCandidatesTimer', this.options.connID);
        }
    }

    public async createOffer(hasVideo: boolean, hasAudio: boolean): Promise<void> {
        if (hasVideo) this.peerConnection.addTransceiver('video', { direction: 'sendrecv' });
        if (hasAudio) this.peerConnection.addTransceiver('audio', { direction: 'sendrecv' });

        try {
            const desc = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(desc);

            const url = this.getUrl('offer', { connid: this.options.connID });
            const body = {
                streamURLs: [
                    '/opt/app/gweb/tests/play-from-disk/output.ivf',
                    '/opt/app/gweb/tests/play-from-disk/output.ogg',
                ],
                preferNetwork: 'udp',
                peerBindPort: false,
                iceServerURLs: this.options.iceServerURLs,
                description: btoa(JSON.stringify(desc)),
            };
            this.request('POST', url, { body });
        } catch (error) {
            log.webrtc(error);
        }
    }

    private getUrl(name: string, params: Record<string, string>): string {
        const prefix = this.options.urlGroup ? `/${this.options.urlGroup}` : '';
        const searchParams = new URLSearchParams(params).toString();
        return `${prefix}/webrtc/${name}?${searchParams}`;
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
