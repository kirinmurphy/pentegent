import type { UnifiedReport, DetectedTechnology } from "@penetragent/shared";
import { findExplanation, SECURITY_EXPLANATIONS } from "../config/security-explanations.js";
import { HTTP_SCAN_CONFIG } from "../config/scan-rules.js";
import { computeWorstCaseGrades as computeWorstCaseGradesShared } from "../scanTypes/http/compute-worst-grades.js";
import { collectFindingsByPage } from "../scanTypes/http/collect-findings.js";
import { classifyByPrefix } from "../grading/issue-classification.js";
import { slugify } from "../utils/string.js";
import type { FrameworkFix, AggregatedIssue, HeaderGradeSummary, GroupedScriptIssue } from "./report-types.js";

export function getExplanationKey(issue: string): string {
  if (issue.startsWith("Missing ") && issue.includes(" header")) {
    return issue.replace("Missing ", "").replace(" header", "");
  }
  if (issue.startsWith("Weak ")) {
    return issue.replace("Weak ", "").split(":")[0];
  }
  return issue;
}

export function aggregateIssues(
  httpData: NonNullable<UnifiedReport["scans"]["http"]>,
): Map<string, { pages: string[] }> {
  const findingsMap = collectFindingsByPage(httpData.pages);
  const issueMap = new Map<string, { pages: string[] }>();
  for (const [key, pages] of findingsMap) {
    issueMap.set(key, { pages });
  }
  return issueMap;
}

export function collectMatchedFrameworks(
  detectedTechs: DetectedTechnology[],
): { name: string; slug: string }[] {
  const techNames = new Set(detectedTechs.map((t) => t.name));
  const matched = new Set<string>();

  for (const explanation of Object.values(SECURITY_EXPLANATIONS)) {
    if (!explanation.remediation.frameworks) continue;
    for (const framework of Object.keys(explanation.remediation.frameworks)) {
      if (techNames.has(framework)) {
        matched.add(framework);
      }
    }
  }

  return Array.from(matched).map((name) => ({ name, slug: slugify(name) }));
}

export function computeWorstCaseGrades(
  httpData: NonNullable<UnifiedReport["scans"]["http"]>,
): HeaderGradeSummary {
  return computeWorstCaseGradesShared(httpData.pages);
}

export function classifyAndSortIssues(config: {
  issueMap: Map<string, { pages: string[] }>;
  detectedTechs: DetectedTechnology[];
  criticalPatterns?: string[];
}): AggregatedIssue[] {
  const { issueMap, detectedTechs } = config;
  const patterns = config.criticalPatterns ?? HTTP_SCAN_CONFIG.criticalFindingPatterns;
  const techNames = detectedTechs.map((t) => t.name);

  return Array.from(issueMap.entries())
    .sort((a, b) => b[1].pages.length - a[1].pages.length)
    .map(([issue, { pages }]) => {
      const isCritical = patterns.some((p) => issue.includes(p));
      const explanationKey = getExplanationKey(issue);
      const explanation = findExplanation(explanationKey);

      const matchedFrameworks = findMatchedFrameworks(explanation?.remediation.frameworks, techNames);

      return { issue, pages, isCritical, explanationKey, explanation, matchedFrameworks };
    });
}

export function classifyIssuesByType(allIssues: AggregatedIssue[]): {
  headerIssues: AggregatedIssue[];
  cookieIssues: AggregatedIssue[];
  scriptIssues: AggregatedIssue[];
  corsIssues: AggregatedIssue[];
} {
  const classified = classifyByPrefix({
    items: allIssues,
    getText: (issue) => issue.issue,
  });
  return {
    headerIssues: classified.headers,
    cookieIssues: classified.cookies,
    scriptIssues: classified.scripts,
    corsIssues: classified.cors,
  };
}

export function groupScriptIssues(
  issues: AggregatedIssue[],
  globalFrameworks: { name: string; slug: string }[],
  techNames: string[],
): GroupedScriptIssue[] {
  const groups = new Map<string, { scripts: string[]; base: AggregatedIssue }>();

  for (const issue of issues) {
    const colonIdx = issue.issue.indexOf(": ");
    const type = colonIdx >= 0 ? issue.issue.substring(0, colonIdx) : issue.issue;
    const detail = colonIdx >= 0 ? issue.issue.substring(colonIdx + 2) : "";

    if (!groups.has(type)) {
      groups.set(type, { scripts: [], base: issue });
    }
    if (detail) {
      groups.get(type)!.scripts.push(detail);
    }
  }

  return Array.from(groups.entries()).map(([type, { scripts, base }]) => {
    const explanationKey = getExplanationKey(type);
    const explanation = findExplanation(explanationKey);

    const matchedFrameworks = findMatchedFrameworks(explanation?.remediation.frameworks, techNames);

    return {
      issueType: type,
      scripts,
      isCritical: base.isCritical,
      explanationKey,
      explanation,
      matchedFrameworks,
    };
  });
}

function findMatchedFrameworks(
  frameworks: Record<string, string> | undefined,
  techNames: string[],
): FrameworkFix[] {
  if (!frameworks) return [];
  return Object.entries(frameworks)
    .filter(([framework]) => techNames.includes(framework))
    .map(([framework, fix]) => ({ framework, slug: slugify(framework), fix }));
}
