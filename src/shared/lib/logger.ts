// Structured logging standar (NFR-009). Output JSON ke stdout.
// Jangan log secret: field sensitif sudah di-redact di bawah.
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "dps-portal" },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "password",
      "*.password",
      "passwordHash",
      "*.passwordHash",
    ],
    censor: "[REDACTED]",
  },
});
