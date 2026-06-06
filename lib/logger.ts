type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

function formatLog(entry: LogEntry): string {
  const contextStr = entry.context
    ? ` | ${JSON.stringify(entry.context)}`
    : "";
  return `[${entry.timestamp}] [${entry.level.toUpperCase()}] ${entry.message}${contextStr}`;
}

function createLogEntry(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    context,
  };
}

export const logger = {
  info(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry("info", message, context);
    if (process.env.NODE_ENV !== "test") {
      // Using structured output instead of console.log
      process.stdout.write(formatLog(entry) + "\n");
    }
  },

  warn(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry("warn", message, context);
    process.stdout.write(formatLog(entry) + "\n");
  },

  error(message: string, context?: Record<string, unknown>): void {
    const entry = createLogEntry("error", message, context);
    process.stderr.write(formatLog(entry) + "\n");
  },

  debug(message: string, context?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      const entry = createLogEntry("debug", message, context);
      process.stdout.write(formatLog(entry) + "\n");
    }
  },
};

export default logger;
