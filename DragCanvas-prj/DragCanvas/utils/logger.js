const SECRET_FIELD = /password|token|secret|authorization|cookie|api[-_]?key/i;

export function safeDetails(value, depth = 0) {
    if (depth > 4) return '[truncated]';
    if (Array.isArray(value)) return value.map((item) => safeDetails(item, depth + 1));
    if (!value || typeof value !== 'object') return value;

    return Object.fromEntries(Object.entries(value).map(([key, item]) => [
        key,
        SECRET_FIELD.test(key) ? '[redacted]' : safeDetails(item, depth + 1),
    ]));
}

export function writeLog(level, event, details = {}, sink = console) {
    const record = {
        timestamp: new Date().toISOString(),
        level,
        event,
        ...safeDetails(details),
    };
    const method = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'info';
    sink[method](JSON.stringify(record));
    return record;
}

export const log = {
    info: (event, details) => writeLog('info', event, details),
    warn: (event, details) => writeLog('warn', event, details),
    error: (event, details) => writeLog('error', event, details),
};
