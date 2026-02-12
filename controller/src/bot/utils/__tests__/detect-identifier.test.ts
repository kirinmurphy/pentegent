import { describe, it, expect } from "vitest";
import { detectIdentifier } from "../detect-identifier.js";

describe("detectIdentifier", () => {
  it("should detect jobId pattern (8+ alphanumeric)", () => {
    const result = detectIdentifier("abc123def456");

    expect(result).toEqual({
      type: "jobId",
      value: "abc123def456",
    });
  });

  it("should detect short jobId (8 chars)", () => {
    const result = detectIdentifier("12345678");

    expect(result).toEqual({
      type: "jobId",
      value: "12345678",
    });
  });

  it("should detect targetId (domain without protocol)", () => {
    const result = detectIdentifier("example.com");

    expect(result).toEqual({
      type: "targetId",
      value: "example.com",
    });
  });

  it("should detect targetId with path", () => {
    const result = detectIdentifier("example.com/admin");

    expect(result).toEqual({
      type: "targetId",
      value: "example.com/admin",
    });
  });

  it("should detect full URL with https", () => {
    const result = detectIdentifier("https://example.com");

    expect(result).toEqual({
      type: "url",
      value: "https://example.com",
    });
  });

  it("should detect full URL with http", () => {
    const result = detectIdentifier("http://example.com");

    expect(result).toEqual({
      type: "url",
      value: "http://example.com",
    });
  });

  it("should detect full URL with path", () => {
    const result = detectIdentifier("https://example.com/admin");

    expect(result).toEqual({
      type: "url",
      value: "https://example.com/admin",
    });
  });

  it("should prefer jobId over targetId for ambiguous short strings", () => {
    // "abc123de" could be a subdomain, but if it's 8+ alphanumeric, it's more likely a jobId
    const result = detectIdentifier("abc123de");

    expect(result.type).toBe("jobId");
  });

  it("should detect targetId when it contains dots", () => {
    const result = detectIdentifier("api.example.com");

    expect(result).toEqual({
      type: "targetId",
      value: "api.example.com",
    });
  });

  it("should handle localhost as targetId", () => {
    const result = detectIdentifier("localhost:3000");

    expect(result).toEqual({
      type: "targetId",
      value: "localhost:3000",
    });
  });

  it("should handle IP addresses as targetId", () => {
    const result = detectIdentifier("192.168.1.1");

    expect(result).toEqual({
      type: "targetId",
      value: "192.168.1.1",
    });
  });

  it("should return unknown for empty string", () => {
    const result = detectIdentifier("");

    expect(result).toEqual({
      type: "unknown",
      value: "",
    });
  });

  it("should return unknown for very short strings (< 3 chars)", () => {
    const result = detectIdentifier("ab");

    expect(result).toEqual({
      type: "unknown",
      value: "ab",
    });
  });

  it("should handle mixed case URLs", () => {
    const result = detectIdentifier("HTTPS://EXAMPLE.COM");

    expect(result).toEqual({
      type: "url",
      value: "HTTPS://EXAMPLE.COM",
    });
  });

  it("should detect targetId with port", () => {
    const result = detectIdentifier("example.com:8080");

    expect(result).toEqual({
      type: "targetId",
      value: "example.com:8080",
    });
  });

  it("should handle jobId with dashes or underscores", () => {
    const result = detectIdentifier("abc-123_def");

    expect(result).toEqual({
      type: "jobId",
      value: "abc-123_def",
    });
  });
});
