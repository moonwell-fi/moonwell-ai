import { describe, it, expect } from "vitest";
import {
  MoonwellError,
  statusFor,
  usage,
  unsupported,
  unavailable,
  notFound,
  HTTP_STATUS,
} from "../src/lib/errors.js";

describe("MoonwellError HTTP status mapping", () => {
  it("usage() → 400", () => {
    expect(statusFor(usage("bad input"))).toBe(400);
  });

  it("unsupported() → 400", () => {
    expect(statusFor(unsupported("nope"))).toBe(400);
  });

  it("unavailable() → 503", () => {
    expect(statusFor(unavailable("rpc down"))).toBe(503);
  });

  it("notFound() → 404", () => {
    expect(statusFor(notFound("market X"))).toBe(404);
  });

  it("plain Error → 500", () => {
    expect(statusFor(new Error("boom"))).toBe(500);
  });

  it("HTTP_STATUS table covers every MoonwellError code", () => {
    const codes: MoonwellError["code"][] = [
      "USAGE",
      "UNSUPPORTED",
      "UNAVAILABLE",
      "INTERNAL",
      "NOT_FOUND",
    ];
    for (const c of codes) {
      expect(HTTP_STATUS[c]).toBeTypeOf("number");
    }
  });
});
