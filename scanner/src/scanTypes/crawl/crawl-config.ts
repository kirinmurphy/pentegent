export const CRAWL_CONFIG = {
  maxPages: 20,
  userAgent: "PenetragentCrawl/1.0 (Security Scanner)",
  securityChecks: {
    requiredHeaders: [
      { header: "strict-transport-security", finding: "Missing HSTS header" },
      { header: "content-security-policy", finding: "Missing CSP header" },
      { header: "x-content-type-options", finding: "Missing X-Content-Type-Options header" },
      { header: "x-frame-options", finding: "Missing X-Frame-Options header" },
    ],
    infoDisclosureHeaders: [
      { header: "server", displayName: "Server" },
      { header: "x-powered-by", displayName: "X-Powered-By" },
    ],
    mixedContentCheck: true,
    xssPatternCheck: true,
  },
  criticalFindingPatterns: ["Missing HSTS", "Missing CSP", "Mixed content", "XSS"],
};
