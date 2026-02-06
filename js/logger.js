/**
 * Simple Logger for Debugging
 * Logs events to console with timestamp and structured data.
 */

export function logEvent(event, data = {}) {
    const timestamp = new Date().toISOString();
    console.groupCollapsed(`[${event}] @ ${timestamp}`);
    console.table(data);
    console.groupEnd();
}
