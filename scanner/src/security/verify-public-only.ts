import dns from "node:dns/promises";
import ipaddr from "ipaddr.js";

export class DnsError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DnsError";
  }
}

function isPublicIp(addr: string): boolean {
  let parsed: ipaddr.IPv4 | ipaddr.IPv6;
  try {
    parsed = ipaddr.parse(addr);
  } catch {
    return false;
  }

  // Normalize IPv4-mapped IPv6 to IPv4
  if (parsed.kind() === "ipv6") {
    const v6 = parsed as ipaddr.IPv6;
    if (v6.isIPv4MappedAddress()) {
      parsed = v6.toIPv4Address();
    }
  }

  const range = parsed.range();

  const privateRanges = new Set([
    "private",
    "loopback",
    "linkLocal",
    "uniqueLocal",
    "carrierGradeNat",
    "unspecified",
  ]);

  return !privateRanges.has(range);
}

export async function verifyPublicOnly(
  hostname: string,
): Promise<string[]> {
  let addresses: string[] = [];

  try {
    const [ipv4Results, ipv6Results] = await Promise.allSettled([
      dns.resolve4(hostname),
      dns.resolve6(hostname),
    ]);

    if (ipv4Results.status === "fulfilled") {
      addresses = addresses.concat(ipv4Results.value);
    }
    if (ipv6Results.status === "fulfilled") {
      addresses = addresses.concat(ipv6Results.value);
    }
  } catch {
    throw new DnsError("DNS_RESOLUTION_FAILED", `DNS resolution failed for ${hostname}`);
  }

  if (addresses.length === 0) {
    throw new DnsError("DNS_NO_RESULTS", `No DNS results for ${hostname}`);
  }

  for (const addr of addresses) {
    if (!isPublicIp(addr)) {
      throw new DnsError(
        "PRIVATE_RANGE_RESTRICTED",
        `Address ${addr} for ${hostname} is in a restricted range`,
      );
    }
  }

  return addresses;
}
