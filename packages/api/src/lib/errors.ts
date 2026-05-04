export class MoonwellError extends Error {
  constructor(
    public code: "USAGE" | "UNSUPPORTED" | "UNAVAILABLE" | "INTERNAL",
    message: string,
    public cause?: unknown,
  ) {
    super(message);
    this.name = "MoonwellError";
  }
}

export function usage(message: string): MoonwellError {
  return new MoonwellError("USAGE", message);
}

export function unsupported(message: string): MoonwellError {
  return new MoonwellError("UNSUPPORTED", message);
}

export function unavailable(message: string, cause?: unknown): MoonwellError {
  return new MoonwellError("UNAVAILABLE", message, cause);
}

export const EXIT_CODES: Record<MoonwellError["code"], number> = {
  USAGE: 2,
  UNSUPPORTED: 3,
  UNAVAILABLE: 4,
  INTERNAL: 1,
};

export function exitCode(err: unknown): number {
  if (err instanceof MoonwellError) {
    return EXIT_CODES[err.code];
  }
  return 1;
}

/**
 * HTTP status mapping for the worker API. Exported here (rather than in API
 * package code) so this module stays a single source of truth across CLI + API.
 */
export const HTTP_STATUS: Record<MoonwellError["code"], number> = {
  USAGE: 400,
  UNSUPPORTED: 400,
  UNAVAILABLE: 503,
  INTERNAL: 500,
};

export function statusFor(err: unknown): number {
  if (err instanceof MoonwellError) {
    return HTTP_STATUS[err.code];
  }
  return 500;
}
