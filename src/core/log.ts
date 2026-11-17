/**
 * Single logging exit. Silent by default; the UI never shows stack traces,
 * so anything worth surfacing belongs in the console behind this switch.
 */

let debugEnabled = false;

export function setDebugLogging(enabled: boolean): void {
  debugEnabled = enabled;
}

function emit(level: 'debug' | 'warn' | 'error', message: string, detail?: unknown): void {
  if (!debugEnabled && level !== 'error') {
    return;
  }
  const target = typeof console === 'undefined' ? undefined : console;
  if (!target) {
    return;
  }
  const sink = level === 'error' ? target.error : level === 'warn' ? target.warn : target.debug;
  if (detail === undefined) {
    sink.call(target, `[h5-renderer] ${message}`);
    return;
  }
  sink.call(target, `[h5-renderer] ${message}`, detail);
}

export const log = {
  debug: (message: string, detail?: unknown): void => emit('debug', message, detail),
  warn: (message: string, detail?: unknown): void => emit('warn', message, detail),
  error: (message: string, detail?: unknown): void => emit('error', message, detail),
};
