export type IdentifierType = "jobId" | "targetId" | "url" | "unknown";

export interface IdentifierResult {
  type: IdentifierType;
  value: string;
}

/**
 * Detects what type of identifier the user provided
 * - 8+ alphanumeric chars (with dashes/underscores) → jobId
 * - URL with protocol (http/https) → url
 * - Domain/hostname/IP → targetId
 * - Empty or very short (< 3 chars) → unknown
 */
export function detectIdentifier(input: string): IdentifierResult {
  // Handle empty or very short strings
  if (!input || input.length < 3) {
    return { type: "unknown", value: input };
  }

  // Check if it's a URL with protocol
  if (input.match(/^https?:\/\//i)) {
    return { type: "url", value: input };
  }

  // Check if it's a jobId pattern (8+ alphanumeric with optional dashes/underscores)
  // But exclude things that look like domains (contain dots)
  const jobIdPattern = /^[a-z0-9_-]{8,}$/i;
  if (jobIdPattern.test(input) && !input.includes(".")) {
    return { type: "jobId", value: input };
  }

  // Everything else is treated as targetId (domain, IP, hostname with port, etc.)
  return { type: "targetId", value: input };
}
