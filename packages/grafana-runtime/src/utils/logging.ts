import { faro, LogContext, LogLevel } from '@grafana/faro-web-sdk';

import { config } from '../config';

export { LogLevel };
export type { LogContext };

/**
 * Check if we're in development mode
 */
function isDevelopment(): boolean {
  return config.buildInfo?.env === 'development';
}

/**
 * Check if console logging is enabled for structured logs
 * Enable via localStorage: localStorage.setItem('grafana.structuredLogging', 'true')
 */
function isConsoleLoggingEnabled(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  // eslint-disable-next-line no-restricted-syntax
  return isDevelopment() || window.localStorage?.getItem('grafana.structuredLogging') === 'true';
}

/**
 * Format a structured log message for console output
 */
function formatConsoleMessage(level: string, message: string, contexts?: LogContext): string {
  const timestamp = new Date().toISOString();
  const contextStr = contexts ? ` ${JSON.stringify(contexts)}` : '';
  return `[${timestamp}] [${level}] ${message}${contextStr}`;
}

/**
 * Log a message at INFO level
 * @public
 */
export function logInfo(message: string, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.INFO,
      context: contexts,
    });
  }

  if (isConsoleLoggingEnabled()) {
    // eslint-disable-next-line no-console
    console.info(formatConsoleMessage('INFO', message, contexts));
  }
}

/**
 * Log a message at WARNING level
 *
 * @public
 */
export function logWarning(message: string, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.WARN,
      context: contexts,
    });
  }

  if (isConsoleLoggingEnabled()) {
    // eslint-disable-next-line no-console
    console.warn(formatConsoleMessage('WARN', message, contexts));
  }
}

/**
 * Log a message at DEBUG level
 *
 * @public
 */
export function logDebug(message: string, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushLog([message], {
      level: LogLevel.DEBUG,
      context: contexts,
    });
  }

  if (isConsoleLoggingEnabled()) {
    // eslint-disable-next-line no-console
    console.debug(formatConsoleMessage('DEBUG', message, contexts));
  }
}

/**
 * Log an error
 *
 * @public
 */
export function logError(err: Error, contexts?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushError(err, {
      context: contexts,
    });
  }

  if (isConsoleLoggingEnabled()) {
    // eslint-disable-next-line no-console
    console.error(formatConsoleMessage('ERROR', err.message, contexts), err);
  }
}

/**
 * Log a measurement
 *
 * @public
 */
export type MeasurementValues = Record<string, number>;
export function logMeasurement(type: string, values: MeasurementValues, context?: LogContext) {
  if (config.grafanaJavascriptAgent.enabled) {
    faro.api.pushMeasurement(
      {
        type,
        values,
      },
      { context: context }
    );
  }

  if (isConsoleLoggingEnabled()) {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    // eslint-disable-next-line no-console
    console.info(`[${timestamp}] [MEASUREMENT] ${type}: ${JSON.stringify(values)}${contextStr}`);
  }
}

export interface MonitoringLogger {
  logDebug: (message: string, contexts?: LogContext) => void;
  logInfo: (message: string, contexts?: LogContext) => void;
  logWarning: (message: string, contexts?: LogContext) => void;
  logError: (error: Error, contexts?: LogContext) => void;
  logMeasurement: (type: string, measurement: MeasurementValues, contexts?: LogContext) => void;
}
/**
 * Creates a monitoring logger with five levels of logging methods: `logDebug`, `logInfo`, `logWarning`, `logError`, and `logMeasurement`.
 * These methods use `faro.api.pushX` web SDK methods to report these logs or errors to the Faro collector.
 *
 * @param {string} source - Identifier for the source of the log messages.
 * @param {LogContext} [defaultContext] - Context to be included in every log message.
 *
 * @returns {MonitoringLogger} Logger object with five methods:
 * - `logDebug(message: string, contexts?: LogContext)`: Logs a debug message.
 * - `logInfo(message: string, contexts?: LogContext)`: Logs an informational message.
 * - `logWarning(message: string, contexts?: LogContext)`: Logs a warning message.
 * - `logError(error: Error, contexts?: LogContext)`: Logs an error message.
 * - `logMeasurement(measurement: Omit<MeasurementEvent, 'timestamp'>, contexts?: LogContext)`: Logs a measurement.
 * Each method combines the `defaultContext` (if provided), the `source`, and an optional `LogContext` parameter into a full context that is included with the log message.
 */
export function createMonitoringLogger(source: string, defaultContext?: LogContext): MonitoringLogger {
  const createFullContext = (contexts?: LogContext) => ({
    source: source,
    ...defaultContext,
    ...contexts,
  });

  return {
    /**
     * Logs a debug message with optional additional context.
     * @param {string} message - The debug message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logDebug: (message: string, contexts?: LogContext) => logDebug(message, createFullContext(contexts)),

    /**
     * Logs an informational message with optional additional context.
     * @param {string} message - The informational message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logInfo: (message: string, contexts?: LogContext) => logInfo(message, createFullContext(contexts)),

    /**
     * Logs a warning message with optional additional context.
     * @param {string} message - The warning message to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logWarning: (message: string, contexts?: LogContext) => logWarning(message, createFullContext(contexts)),

    /**
     * Logs an error with optional additional context.
     * @param {Error} error - The error object to be logged.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logError: (error: Error, contexts?: LogContext) => logError(error, createFullContext(contexts)),

    /**
     * Logs an measurement with optional additional context.
     * @param {MeasurementEvent} measurement - The measurement object to be recorded.
     * @param {LogContext} [contexts] - Optional additional context to be included.
     */
    logMeasurement: (type: string, measurement: MeasurementValues, contexts?: LogContext) =>
      logMeasurement(type, measurement, createFullContext(contexts)),
  };
}
