/**
 * Enum representing log levels.
 */
export enum LogLevel {
    /**
     * Informational messages.
     */
    INFO = 'INFO',

    /**
     * Warning messages.
     */
    WARN = 'WARN',

    /**
     * Error messages.
     */
    ERROR = 'ERROR',

    /**
     * Debugging messages.
     */
    DEBUG = 'DEBUG'
}

/**
 * Terminal color codes for different log levels.
 */
const CONSOLE_STYLES = {
    [LogLevel.INFO]: 'color: #00a8ff; font-weight: bold;',
    [LogLevel.WARN]: 'color: #fbc531; font-weight: bold;',
    [LogLevel.ERROR]: 'color: #e84118; font-weight: bold;',
    [LogLevel.DEBUG]: 'color: #7f8fa6; font-style: italic;',
    CONTEXT: 'color: #9c88ff; font-weight: bold; background-color: #eee; padding: 2px 4px; border-radius: 3px;'
} as const;

/**
 * Logger class for logging messages with different severity levels.
 */
export class Logger {
    private readonly _context: string;

    /**
     * Creates an instance of Logger.
     * @param context - The context or source of the log messages.
     */
    public constructor(context: string) {
        this._context = context;
    }

    /**
     * Logs an informational message.
     * @param message - The message to log.
     */
    public info(message: string): void {
        this.print(LogLevel.INFO, message, console.log);
    }

    /**
     * Logs a warning message.
     * @param message - The message to log.
     */
    public warn(message: string): void {
        this.print(LogLevel.WARN, message, console.warn);
    }

    /**
     * Logs an error message.
     * @param message - The message to log.
     */
    public error(message: string): void {
        this.print(LogLevel.ERROR, message, console.error);
    }

    /**
     * Logs a debug message.
     * @param message - The message to log.
     */
    public debug(message: string): void {
        this.print(LogLevel.DEBUG, message, console.debug);
    }

    /**
     * Log the formatted message to the console.
     * @param level - The severity level of the log message.
     * @param message - The message to log.
     * @param consoleMethod - The console method to use for logging.
     */
    private print(level: LogLevel, message: string, consoleMethod: Function): void {
        const timestamp = new Date().toLocaleTimeString('fr-FR', { hour12: false });
        
        consoleMethod(
            `%c[${timestamp}] %c[${this._context}] %c${message}`,
            'color: gray;',
            CONSOLE_STYLES.CONTEXT,
            CONSOLE_STYLES[level]
        );
    }
}