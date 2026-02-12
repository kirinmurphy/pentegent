/**
 * Formats a job summary object into human-readable lines.
 * Handles nested objects, arrays, and primitive values.
 *
 * @param summary - The summary object to format
 * @param indent - The indentation string (default: "  ")
 * @returns Array of formatted lines
 */
export function formatSummary(
  summary: Record<string, unknown>,
  indent = "  ",
): string[] {
  const lines: string[] = [];

  for (const [key, value] of Object.entries(summary)) {
    if (Array.isArray(value)) {
      // Special handling for criticalFindings
      if (key === "criticalFindings" && value.length > 0) {
        if (value.length === 1) {
          // Single finding - show inline
          lines.push(`${indent}${key}: ${value[0]}`);
        } else {
          // Multiple findings - show as bullet list
          lines.push("");
          lines.push("Critical Findings:");
          for (const finding of value) {
            lines.push(`  • ${finding}`);
          }
        }
      } else {
        // Regular arrays - join with commas
        lines.push(`${indent}${key}: ${value.join(", ") || "none"}`);
      }
    } else if (typeof value === "object" && value !== null) {
      lines.push(`${indent}${key}:`);
      for (const [nestedKey, nestedValue] of Object.entries(value)) {
        lines.push(`${indent}  ${nestedKey}: ${nestedValue}`);
      }
    } else {
      lines.push(`${indent}${key}: ${value}`);
    }
  }

  return lines;
}
