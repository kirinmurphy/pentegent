import { describe, it, expect, vi, beforeEach } from "vitest";
import dns from "node:dns/promises";
import { verifyPublicOnly, DnsError } from "../security/verify-public-only.js";

vi.mock("node:dns/promises", () => ({
  default: {
    resolve4: vi.fn(),
    resolve6: vi.fn(),
  },
}));

const mockResolve4 = vi.mocked(dns.resolve4);
const mockResolve6 = vi.mocked(dns.resolve6);

function mockDns(ipv4: string[] = [], ipv6: string[] = []): void {
  if (ipv4.length > 0) {
    mockResolve4.mockResolvedValue(ipv4);
  } else {
    mockResolve4.mockRejectedValue(new Error("ENODATA"));
  }
  if (ipv6.length > 0) {
    mockResolve6.mockResolvedValue(ipv6);
  } else {
    mockResolve6.mockRejectedValue(new Error("ENODATA"));
  }
}

describe("verifyPublicOnly", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- REJECT private ranges ---

  it("rejects RFC1918 10.x.x.x", async () => {
    mockDns(["10.0.0.1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(
      /restricted range/,
    );
  });

  it("rejects RFC1918 172.16.x.x", async () => {
    mockDns(["172.16.0.1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  it("rejects RFC1918 192.168.x.x", async () => {
    mockDns(["192.168.1.1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  it("rejects loopback 127.0.0.1", async () => {
    mockDns(["127.0.0.1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  it("rejects IPv6 loopback ::1", async () => {
    mockDns([], ["::1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  it("rejects IPv6 link-local fe80::1", async () => {
    mockDns([], ["fe80::1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  it("rejects IPv6 ULA fc00::1", async () => {
    mockDns([], ["fc00::1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  it("rejects CGNAT 100.64.0.1", async () => {
    mockDns(["100.64.0.1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  it("rejects IPv4 link-local 169.254.0.1", async () => {
    mockDns(["169.254.0.1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  // --- REJECT IPv4-mapped IPv6 ---

  it("rejects IPv4-mapped ::ffff:192.168.1.1", async () => {
    mockDns([], ["::ffff:192.168.1.1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  it("rejects IPv4-mapped ::ffff:127.0.0.1", async () => {
    mockDns([], ["::ffff:127.0.0.1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  it("rejects IPv4-mapped ::ffff:10.0.0.1", async () => {
    mockDns([], ["::ffff:10.0.0.1"]);
    await expect(verifyPublicOnly("evil.com")).rejects.toThrow(DnsError);
  });

  // --- ALLOW public addresses ---

  it("allows public IPv4 93.184.216.34", async () => {
    mockDns(["93.184.216.34"]);
    const result = await verifyPublicOnly("example.com");
    expect(result).toEqual(["93.184.216.34"]);
  });

  it("allows public IPv6 2606:2800:220:1::", async () => {
    mockDns([], ["2606:2800:220:1::"]);
    const result = await verifyPublicOnly("example.com");
    expect(result).toEqual(["2606:2800:220:1::"]);
  });

  // --- Mixed results ---

  it("rejects mixed public + private (fail closed)", async () => {
    mockDns(["93.184.216.34", "192.168.1.1"]);
    await expect(verifyPublicOnly("tricky.com")).rejects.toThrow(DnsError);
  });

  it("allows dual-stack public", async () => {
    mockDns(["93.184.216.34"], ["2606:2800:220:1::"]);
    const result = await verifyPublicOnly("dual.com");
    expect(result).toEqual(["93.184.216.34", "2606:2800:220:1::"]);
  });

  // --- Empty results ---

  it("errors on empty DNS results", async () => {
    mockResolve4.mockRejectedValue(new Error("ENODATA"));
    mockResolve6.mockRejectedValue(new Error("ENODATA"));
    await expect(verifyPublicOnly("nope.com")).rejects.toThrow(DnsError);
    try {
      await verifyPublicOnly("nope.com");
    } catch (e) {
      expect((e as DnsError).code).toBe("DNS_NO_RESULTS");
    }
  });
});
