import { consola, LogLevels } from "consola";

let LogSettings = {
    debug: false,
}

class LogInstance {
    constructor() {
        this.level = LogSettings.debug ? LogLevels.debug : LogLevels.info
    }
    get fancy() {
        return consola.create({
            level: this.level,
            reporters: [
                {
                    log: (logObj) => {
                        if (logObj.type == 'error')
                            console.error(this.nowTime(), logObj.tag, ...logObj.args)
                        else if (logObj.type == 'warn')
                            console.warn(this.nowTime(), logObj.tag, ...logObj.args)
                        else
                            console.log(this.nowTime(), logObj.tag, ...logObj.args)
                    },
                },
            ],
        })
    }
    get webrtc() {
        return this.fancy.withTag('webrtc')
    }
    nowTime() {
        const now = new Date();
        const hours = now.getHours().toString()
        const minutes = now.getMinutes().toString()
        const seconds = now.getSeconds().toString()
        const milliseconds = now.getMilliseconds().toString().padStart(3, '0')
        return `${hours}:${minutes}:${seconds}.${milliseconds}`;
    }
}

const log = new LogInstance()

export { log, LogSettings }