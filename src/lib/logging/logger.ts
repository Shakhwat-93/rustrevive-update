/**
 * Structured Logging Foundation
 * Complies with OWASP security guidelines (Automatic masking of sensitive data)
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_PRIORITIES: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY_PATTERNS = [
  "password",
  "token",
  "secret",
  "auth",
  "apikey",
  "api_key",
  "service_role",
  "access_key",
  "creditcard",
  "credit_card",
  "cardnumber",
  "card_number",
  "cvv",
  "cvc",
];

function isSensitiveKey(key: string): boolean {
  const lower = key.toLowerCase();
  return SENSITIVE_KEY_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Recursively sanitizes objects to mask sensitive credentials and PII
 */
export function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 5) return "[Max Depth Reached]";
  if (data === null || data === undefined) return data;
  if (typeof data !== "object") return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, depth + 1));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (isSensitiveKey(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeLogData(value, depth + 1);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

class Logger {
  private currentLevel: LogLevel = (process.env["LOG_LEVEL"] as LogLevel) || "info";
  private isProduction: boolean = process.env["NODE_ENV"] === "production";

  private shouldLog(level: LogLevel): boolean {
    const configuredPriority = LOG_LEVEL_PRIORITIES[this.currentLevel] ?? 20;
    const messagePriority = LOG_LEVEL_PRIORITIES[level] ?? 20;
    return messagePriority >= configuredPriority;
  }

  private formatEntry(level: LogLevel, message: string, context?: string, data?: unknown, error?: Error): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (context) {
      entry.context = context;
    }

    if (data !== undefined) {
      entry.data = sanitizeLogData(data);
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        ...(process.env["NODE_ENV"] !== "production" && { stack: error.stack }),
      };
    }

    return entry;
  }

  private write(entry: LogEntry): void {
    if (this.isProduction) {
      const line = JSON.stringify(entry);
      if (entry.level === "error") {
        process.stderr.write(line + "\n");
      } else {
        process.stdout.write(line + "\n");
      }
    } else {
      const color =
        entry.level === "error"
          ? "\x1b[31m"
          : entry.level === "warn"
            ? "\x1b[33m"
            : entry.level === "info"
              ? "\x1b[36m"
              : "\x1b[90m";
      const reset = "\x1b[0m";
      const ctx = entry.context ? `[${entry.context}] ` : "";
      const prefix = `${color}[${entry.timestamp}] [${entry.level.toUpperCase()}]${reset} ${ctx}`;
      const dataStr = entry.data !== undefined ? " " + JSON.stringify(entry.data) : "";
      const errorStr = entry.error ? " " + (entry.error.stack || entry.error.message) : "";

      if (entry.level === "error") {
        process.stderr.write(`${prefix}${entry.message}${dataStr}${errorStr}\n`);
      } else {
        process.stdout.write(`${prefix}${entry.message}${dataStr}${errorStr}\n`);
      }
    }
  }

  public debug(message: string, context?: string, data?: unknown): void {
    if (this.shouldLog("debug")) {
      this.write(this.formatEntry("debug", message, context, data));
    }
  }

  public info(message: string, context?: string, data?: unknown): void {
    if (this.shouldLog("info")) {
      this.write(this.formatEntry("info", message, context, data));
    }
  }

  public warn(message: string, context?: string, data?: unknown): void {
    if (this.shouldLog("warn")) {
      this.write(this.formatEntry("warn", message, context, data));
    }
  }

  public error(message: string, error?: Error | unknown, context?: string, data?: unknown): void {
    if (this.shouldLog("error")) {
      const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
      this.write(this.formatEntry("error", message, context, data, err));
    }
  }
}

export const logger = new Logger();
