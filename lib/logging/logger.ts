/**
 * Structured server logging. One JSON object per line so Netlify's function logs
 * (and any future log drain) can filter on `event` and `level` instead of
 * regex-matching prose. Values are never secrets: callers pass codes and ids.
 *
 * Why not a library: at this scale a 20-line wrapper over console.warn/error is
 * easier to audit than pino's transports, and the lint rule already forbids
 * console.log, so every log line goes through here or the two allowed methods.
 */
type Level = "info" | "warn" | "error";
type Fields = Record<string, string | number | boolean | null | undefined>;

function emit(level: Level, event: string, fields: Fields = {}): void {
  const line = JSON.stringify({ level, event, time: new Date().toISOString(), ...fields });
  // console.log is banned by lint; info goes through warn's stream deliberately so
  // Netlify shows it without needing a debug flag.
  if (level === "error") console.error(line);
  else console.warn(line);
}

export const logger = {
  info: (event: string, fields?: Fields) => emit("info", event, fields),
  warn: (event: string, fields?: Fields) => emit("warn", event, fields),
  error: (event: string, fields?: Fields) => emit("error", event, fields),
};
