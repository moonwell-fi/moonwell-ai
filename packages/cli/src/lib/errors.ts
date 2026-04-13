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
