export const TLS_SCAN_CONFIG = {
  connectionTimeoutMs: 10_000,
  port: 443,
  certExpiryWarningDays: 30,

  deprecatedProtocols: ["TLSv1", "TLSv1.1"],
  requiredProtocols: ["TLSv1.2", "TLSv1.3"],

  protocolVersionMap: {
    "TLSv1": { minVersion: "TLSv1" as const, maxVersion: "TLSv1" as const },
    "TLSv1.1": { minVersion: "TLSv1.1" as const, maxVersion: "TLSv1.1" as const },
    "TLSv1.2": { minVersion: "TLSv1.2" as const, maxVersion: "TLSv1.2" as const },
    "TLSv1.3": { minVersion: "TLSv1.3" as const, maxVersion: "TLSv1.3" as const },
  },

  weakCipherPatterns: [
    /RC4/i,
    /\bDES\b/i,
    /3DES/i,
    /EXPORT/i,
    /NULL/i,
    /anon/i,
    /MD5/i,
  ],

  forwardSecrecyPatterns: [
    /ECDHE/i,
    /DHE/i,
  ],

  criticalFindingPatterns: [
    "Certificate expired",
    "Self-signed certificate",
    "Hostname mismatch",
    "TLS 1.0 supported",
    "Weak cipher",
  ],
};
