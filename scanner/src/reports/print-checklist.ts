import type { AggregatedIssue, FrameworkFix, PrintChecklistItem, PrintChecklistSection } from "./report-types.js";

function buildChecklistItems(
  issues: AggregatedIssue[],
  matchedFrameworks: { name: string; slug: string }[],
): PrintChecklistItem[] {
  return issues.map((aggregated) => {
    const genericFix = aggregated.explanation?.remediation.generic ?? "";

    const frameworkFixes: FrameworkFix[] = matchedFrameworks
      .map((fw) => {
        const fix = aggregated.explanation?.remediation.frameworks?.[fw.name];
        if (!fix) return null;
        return { framework: fw.name, slug: fw.slug, fix };
      })
      .filter((f): f is FrameworkFix => f !== null);

    return { issue: aggregated.issue, genericFix, frameworkFixes };
  });
}

export function buildPrintChecklist(config: {
  headerIssues: AggregatedIssue[];
  tlsIssues: AggregatedIssue[];
  cookieIssues: AggregatedIssue[];
  scriptIssues: AggregatedIssue[];
  corsIssues: AggregatedIssue[];
  matchedFrameworks: { name: string; slug: string }[];
}): PrintChecklistSection[] {
  const { matchedFrameworks } = config;

  const sections: { label: string; issues: AggregatedIssue[] }[] = [
    { label: "Security Headers", issues: config.headerIssues },
    { label: "SSL/TLS", issues: config.tlsIssues },
    { label: "Cookie Security", issues: config.cookieIssues },
    { label: "Script & Dependency Security", issues: config.scriptIssues },
    { label: "CORS Configuration", issues: config.corsIssues },
  ];

  return sections
    .filter(({ issues }) => issues.length > 0)
    .map(({ label, issues }) => ({
      label,
      items: buildChecklistItems(issues, matchedFrameworks),
    }));
}
