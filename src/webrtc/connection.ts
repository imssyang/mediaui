import { log } from '@/lib/log';

export class WebRTCStreamStats {
    isRemote: boolean;
    isOutput: boolean;
    transportId: string;
    boundRtpId: string;
    codecId: string;
    trackId: string;
    kind: string;
    ssrc: number;
    channels?: number;
    clockRate?: number;
    mimeType?: string;
    payloadType?: number;
    sdpFmtpLine?: string;

    constructor(stat: any) {
        if (!["inbound-rtp", "outbound-rtp", "remote-inbound-rtp", "remote-outbound-rtp"].includes(stat.type))
            throw new Error(`invalid params: ${stat}`);

        this.isRemote = ["inbound-rtp", "outbound-rtp"].includes(stat.type) ? false : true;
        this.isOutput = stat.type == "inbound-rtp" ? false : true;
        this.boundRtpId = stat.id;
        this.kind = stat.kind;
        this.ssrc = stat.ssrc;
        this.transportId = stat?.transportId;
        this.codecId = stat?.codecId;
        this.trackId = stat?.trackIdentifier;
    }

    updateBound(stat: any) {
        if (stat.id != this.boundRtpId)
            return;

        this.codecId = stat?.codecId;
        this.trackId = stat?.trackIdentifier;
    }

    updateCodec(stat: any) {
        if (stat.id != this.codecId)
            return;

        this.channels = stat?.channels;
        this.clockRate = stat?.clockRate;
        this.mimeType = stat?.mimeType;
        this.payloadType = stat?.payloadType;
        this.sdpFmtpLine = stat?.sdpFmtpLine;
    }
}

export class WebRTCConnectionStatsTask {
    private connection: WebRTCConnection;
    private updateTimer?: NodeJS.Timeout;
    streams: WebRTCStreamStats[] = [];

    constructor(conn: WebRTCConnection) {
        this.connection = conn;
    }

    startTimer(intervalMS: number) {
        if (!this.updateTimer) {
            log.webrtc('IceCandidate:startTimer', this.connection.connID);
            this.updateTimer = setInterval(async () => {
                this.update();
            }, intervalMS);
        }
    }

    stopTimer() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = undefined;
        }
    }

    async update() {
        const stats = await this.connection.peerConnection.getStats();
        stats.forEach(report => {
            if (["inbound-rtp", "outbound-rtp", "remote-inbound-rtp", "remote-outbound-rtp"].includes(report.type)) {
                const stream = this.streams.find(stat => stat?.boundRtpId == report.id);
                if (stream) {
                    stream.updateBound(report);
                } else {
                    this.streams.push(new WebRTCStreamStats(report));
                }
                log.webrtc(report, this.streams);
            } else if (["codec"].includes(report.type)) {
                this.streams.filter(stat => stat?.codecId == report.id).map(
                    stream => stream.updateCodec(report));
            }
        });
    }
}

class WebRTCIceCandidateTask {
    private connection: WebRTCConnection;
    private fetchTimer?: NodeJS.Timeout;
    private disableQuery: boolean = false;

    constructor(conn: WebRTCConnection) {
        this.connection = conn;
    }

    startTimer(intervalMS: number, timeoutMS: number) {
        if (!this.fetchTimer) {
            log.webrtc('IceCandidate:startTimer', this.connection.connID);
            this.fetchTimer = setInterval(async () => {
                if (this.disableQuery)
                    return;
                this.disableQuery = true;
                await this.connection.queryIceCandidates(timeoutMS);
                this.disableQuery = false;
            }, intervalMS);
            setTimeout(() => this.stopTimer(), timeoutMS);
        }
    }

    stopTimer() {
        if (this.fetchTimer) {
            clearInterval(this.fetchTimer);
            this.fetchTimer = undefined;
            log.webrtc('IceCandidate:stopTimer', this.connection.connID);
        }
    }
}

export class WebRTCConnection {
    private urlGroup: string;
    private iceServers: RTCIceServer[];
    private iceCandidateTask: WebRTCIceCandidateTask;
    private statsTask: WebRTCConnectionStatsTask;
    private timeoutMS: number = 10000;
    public connID: string;
    public peerConnection: RTCPeerConnection;
    public mediaStream: MediaStream | undefined;
    public mediaRecorder: MediaRecorder | undefined;
    public mediaSource: MediaSource | undefined;
    public sourceBuffer: SourceBuffer | undefined;
    public onState?: (event: Event) => void;

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
        this.iceCandidateTask = new WebRTCIceCandidateTask(this);
        this.statsTask = new WebRTCConnectionStatsTask(this);
        this.peerConnection.oniceconnectionstatechange = async (event) => await this.handleIceConnectionStateChange(event);
        this.peerConnection.onicecandidate = async (event) => await this.handleIceCandidate(event);
        this.peerConnection.ontrack = async (event) => await this.handleTrack(event);
        log.webrtc('new', connID)
    }

    public async createOffer(hasVideo: boolean, hasAudio: boolean): Promise<boolean> {
        if (hasVideo) this.peerConnection.addTransceiver('video', { direction: 'recvonly' });
        if (hasAudio) this.peerConnection.addTransceiver('audio', { direction: 'recvonly' });

        try {
            const localDesc = await this.peerConnection.createOffer();
            await this.peerConnection.setLocalDescription(localDesc);

            const url = this.getUrl('offer', { connid: this.connID });
            const body = {
                streamURLs: [
                    '/opt/app/gweb/tests/play-from-disk/output.ivf',
                    '/opt/app/gweb/tests/play-from-disk/output.ogg',
                ],
                preferNetwork: 'udp',
                peerBindPort: false,
                iceServerURLs: this.iceServers[0].urls,
                description: btoa(JSON.stringify(localDesc)),
            };
            const response = await this.request('POST', url, { body });
            if (!response.ok)
                return false;

            const data = await response.json();
            const remoteDesc = JSON.parse(atob(data.description));
            this.peerConnection.setRemoteDescription(
                new RTCSessionDescription(remoteDesc)
            ).catch(log.webrtc);
            return true;
        } catch (error) {
            log.webrtc(error);
            return false;
        }
    }

    public async queryIceCandidates(timeoutMS: number): Promise<boolean> {
        const url = this.getUrl('candidate', { connid: this.connID });
        const response = await this.request('GET', url, { timeout: timeoutMS });
        if (!response.ok)
            return false;

        const data = await response.json();
        data.iceCandidates.forEach((candidate: RTCIceCandidateInit) => {
            this.peerConnection.addIceCandidate(candidate).catch(log.webrtc);
        });
        if (data.iceGatheringState === 'complete')
            this.iceCandidateTask.stopTimer();
        return true;
    }

    public close() {
        log.webrtc('close', this.connID)
        this.iceCandidateTask.stopTimer();
        this.statsTask.stopTimer();
        this.peerConnection.close()
        this.notifyState("close");
    }

    private async handleIceConnectionStateChange(event: Event) {
        log.webrtc('IceConnectionStateChange', this.peerConnection.iceConnectionState);
        const state = this.peerConnection.iceConnectionState;
        if (state === 'checking') {
            this.iceCandidateTask.startTimer(100, this.timeoutMS);
        } else if (["closed", "completed", "connected", "disconnected", "failed"].includes(state)) {
            this.iceCandidateTask.stopTimer();
            if (state == "connected")
                this.statsTask.startTimer(1000);
        }
        this.notifyState(event);
    }

    private async handleIceCandidate(event: RTCPeerConnectionIceEvent) {
        if (event.candidate) {
            log.webrtc('handleIceCandidate', event.candidate);
            const url = this.getUrl('candidate', { connid: this.connID });
            this.request('POST', url, { body: { iceCandidates: [event.candidate] } });
        }
        this.notifyState(event);
    }

    private async handleTrack(event: RTCTrackEvent) {
        log.webrtc('handleTrack', event.track.kind, event);
        await this.statsTask.update();
        if (!this.mediaStream)
            this.mediaStream = new MediaStream();
        const tracks = this.mediaStream.getTracks();
        if (!tracks.some(track => track.id === event.track.id)) {
            this.mediaStream.addTrack(event.track);
        }
        this.notifyState(event);
    }

    private async request(method: string, url: string, options?: any): Promise<Response> {
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
        return response;
    }

    public getStreamStats(): WebRTCStreamStats[] {
        return this.statsTask.streams;
    }

    private notifyState(event: any) {
        if (this.onState)
            this.onState(event);
    }

    private getUrl(name: string, params: Record<string, string>): string {
        const searchParams = new URLSearchParams(params).toString();
        return `/${this.urlGroup}/webrtc/${name}?${searchParams}`;
    }
}
