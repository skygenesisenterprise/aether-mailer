import { LogLevel } from '../types/commands.js';

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  gray: '\x1b[90m',
};

class Logger {
  private useColors: boolean;
  private logLevel: LogLevel;

  constructor(useColors = true, logLevel: LogLevel = 'info') {
    this.useColors = useColors && !process.env.NO_COLOR;
    this.logLevel = logLevel;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'info', 'debug'];
    return levels.indexOf(level) <= levels.indexOf(this.logLevel);
  }

  private colorize(text: string, color: keyof typeof COLORS): string {
    if (!this.useColors) return text;
    return `${COLORS[color]}${text}${COLORS.reset}`;
  }

  error(message: string, ...args: any[]): void {
    if (this.shouldLog('error')) {
      console.error(this.colorize('✗ ERROR:', 'red'), message, ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.colorize('⚠ WARN:', 'yellow'), message, ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.colorize('ℹ INFO:', 'blue'), message, ...args);
    }
  }

  success(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.log(this.colorize('✓ SUCCESS:', 'green'), message, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.colorize('⚙ DEBUG:', 'gray'), message, ...args);
    }
  }

  log(message: string, ...args: any[]): void {
    console.log(message, ...args);
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setColors(enabled: boolean): void {
    this.useColors = enabled && !process.env.NO_COLOR;
  }
}

export const logger = new Logger();
export default logger;
