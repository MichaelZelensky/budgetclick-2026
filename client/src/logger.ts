import { LogLevel } from "@/types/Logger";

let logLevel = LogLevel.Error;

export const initializeLogger = (level: LogLevel): void => {
    logLevel = level;
};

const shouldLog = (level: LogLevel): boolean => level <= logLevel;

export const logger = {
    error: (...args: unknown[]) => {
        if (shouldLog(LogLevel.Error)) {
            console.error(...args);
        }
    },

    warn: (...args: unknown[]) => {
        if (shouldLog(LogLevel.Warn)) {
            console.warn(...args);
        }
    },

    info: (...args: unknown[]) => {
        if (shouldLog(LogLevel.Info)) {
            console.info(...args);
        }
    },

    debug: (...args: unknown[]) => {
        if (shouldLog(LogLevel.Debug)) {
            console.debug(...args);
        }
    },
};