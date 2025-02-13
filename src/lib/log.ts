type LogLevel = "log" | "info" | "debug" | "warn" | "error" | "success";

const colors: Record<LogLevel, string> = {
  log: "\x1b[36m",
  info: "\x1b[36m",
  debug: "\x1b[34m",
  warn: "\x1b[33m",
  error: "\x1b[31m",
  success: "\x1b[32m",
};

const resetColor = "\x1b[0m";

const tagSuffix = "-tag";

class ConsoleHandler implements ProxyHandler<Console> {
  get nowTime(): string {
    const now: Date = new Date();
    const hours: string = now.getHours().toString();
    const minutes: string = now.getMinutes().toString();
    const seconds: string = now.getSeconds().toString();
    const milliseconds: string = now.getMilliseconds().toString().padStart(3, '0');
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }
  get caller(): string {
    const stack = new Error().stack;
    if (stack) {
      const stackLines = stack.split("\n");
      const callerLine = stackLines.find(item =>
        ["Error", "log.ts", "consola"].every(substr => !item.includes(substr))
      )
      if (callerLine) {
        const match = callerLine.match(/at (.+):(\d+):(\d+)/);
        if (match) {
          const [, filePath, line,] = match;
          const fileName = filePath.split("/").pop()?.split("?").at(0);
          return `${fileName}:${line}`;
        }
      }
    }
    return "unknown";
  }
  get(target: Console, prop: string | symbol) {
    const original = target[prop as keyof Console];
    if (typeof original === 'function') {
      let propName: string = '';
      if (typeof prop === 'string') {
        if (['info', 'debug', 'warn', 'error', 'success'].includes(prop)) {
          propName = `:${prop}`;
        }
      }
      return (...args: any[]) => {
        let firstItem = args[0];
        if (firstItem && firstItem.endsWith(tagSuffix)) {
          firstItem = firstItem.slice(0, -tagSuffix.length);
          propName = `:${firstItem}`;
          args.shift();
        }
        const color = colors[prop as LogLevel] || "";
        target.log(`${color}[${this.nowTime}${propName}]${resetColor}`, ...args);
      };
    }
    return original;
  }
}

const consoleProxy = new Proxy(console, new ConsoleHandler());

class Logger {
  json(tag: string, ...args: any[]) {
    if (args.length === 1)
      args = args[0];
    return consoleProxy.log(`${tag}${tagSuffix}`, JSON.stringify(args, null, 2));
  }
  react(...args: any[]) {
    return consoleProxy.log(`react${tagSuffix}`, ...args);
  }
  webrtc(...args: any[]) {
    return consoleProxy.log(`webrtc${tagSuffix}`, ...args);
  }
}

export const log = new Logger();
