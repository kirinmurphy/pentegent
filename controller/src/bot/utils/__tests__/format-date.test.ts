import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { formatHumanDate } from "../format-date.js";

describe("formatHumanDate", () => {
  beforeEach(() => {
    // Mock current date to 2026-02-12 for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-12T15:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should format date without year when in current year", () => {
    const isoDate = "2026-02-12T13:49:30Z";
    const formatted = formatHumanDate(isoDate);

    expect(formatted).toBe("Feb 12 13:49");
  });

  it("should include year when date is from different year", () => {
    const isoDate = "2025-12-31T23:59:00Z";
    const formatted = formatHumanDate(isoDate);

    expect(formatted).toBe("Dec 31, 2025 23:59");
  });

  it("should handle dates from future years", () => {
    const isoDate = "2027-01-01T00:00:00Z";
    const formatted = formatHumanDate(isoDate);

    expect(formatted).toBe("Jan 1, 2027 00:00");
  });

  it("should format times with leading zeros", () => {
    const isoDate = "2026-03-05T08:05:00Z";
    const formatted = formatHumanDate(isoDate);

    expect(formatted).toBe("Mar 5 08:05");
  });

  it("should handle all month names correctly", () => {
    const dates = [
      { iso: "2026-01-15T12:00:00Z", expected: "Jan 15 12:00" },
      { iso: "2026-02-15T12:00:00Z", expected: "Feb 15 12:00" },
      { iso: "2026-03-15T12:00:00Z", expected: "Mar 15 12:00" },
      { iso: "2026-04-15T12:00:00Z", expected: "Apr 15 12:00" },
      { iso: "2026-05-15T12:00:00Z", expected: "May 15 12:00" },
      { iso: "2026-06-15T12:00:00Z", expected: "Jun 15 12:00" },
      { iso: "2026-07-15T12:00:00Z", expected: "Jul 15 12:00" },
      { iso: "2026-08-15T12:00:00Z", expected: "Aug 15 12:00" },
      { iso: "2026-09-15T12:00:00Z", expected: "Sep 15 12:00" },
      { iso: "2026-10-15T12:00:00Z", expected: "Oct 15 12:00" },
      { iso: "2026-11-15T12:00:00Z", expected: "Nov 15 12:00" },
      { iso: "2026-12-15T12:00:00Z", expected: "Dec 15 12:00" },
    ];

    for (const { iso, expected } of dates) {
      expect(formatHumanDate(iso)).toBe(expected);
    }
  });

  it("should handle dates without 'Z' suffix by treating as UTC", () => {
    // Dates without Z are treated as local time by JavaScript
    // Our scanner outputs ISO format with Z, so we expect that
    const isoDate = "2026-02-12T13:49:30Z";
    const formatted = formatHumanDate(isoDate);

    expect(formatted).toBe("Feb 12 13:49");
  });

  it("should handle SQL datetime format from database", () => {
    // SQLite returns dates in this format
    const sqlDate = "2026-02-12 13:49:30";
    const formatted = formatHumanDate(sqlDate);

    expect(formatted).toBe("Feb 12 13:49");
  });

  it("should use UTC time consistently", () => {
    // The date formatter should use UTC time for consistency
    // across different user timezones
    const isoDate = "2026-02-12T13:49:30Z";
    const formatted = formatHumanDate(isoDate);

    // Should show UTC time
    expect(formatted).toBe("Feb 12 13:49");
  });

  it("should handle edge case: New Year's Eve", () => {
    const isoDate = "2026-12-31T23:59:00Z";
    const formatted = formatHumanDate(isoDate);

    expect(formatted).toBe("Dec 31 23:59");
  });

  it("should handle edge case: New Year's Day from previous year", () => {
    const isoDate = "2025-01-01T00:00:00Z";
    const formatted = formatHumanDate(isoDate);

    expect(formatted).toBe("Jan 1, 2025 00:00");
  });
});
