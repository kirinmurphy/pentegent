import type { UnifiedReport, TlsReportData, DetectedTechnology } from "@penetragent/shared";
import { TLS_SCAN_CONFIG } from "../config/scan-rules.js";
import { countGradeDistribution } from "../grading/count-grades.js";
import { classifyAndSortIssues } from "./issue-processing.js";
import type { CookieSummary, ScriptSummary, CorsSummary, TlsProcessedData } from "./report-types.js";

export function computeCookieSummary(
  pages: NonNullable<UnifiedReport["scans"]["http"]>["pages"],
): CookieSummary {
  let totalCookies = 0;
  let insecureCookies = 0;
  for (const page of pages) {
    totalCookies += page.totalCookiesScanned ?? 0;
    insecureCookies += (page.cookieIssues ?? []).length;
  }
  return { totalCookies, insecureCookies };
}

export function computeScriptSummary(
  pages: NonNullable<UnifiedReport["scans"]["http"]>["pages"],
): ScriptSummary {
  let externalScripts = 0;
  let missingSri = 0;
  let vulnerableLibraries = 0;
  for (const page of pages) {
    externalScripts += page.totalExternalScripts ?? 0;
    for (const script of page.scriptIssues ?? []) {
      if (!script.hasSri) missingSri++;
      if (script.libraryMatch) vulnerableLibraries++;
    }
  }
  return { externalScripts, missingSri, vulnerableLibraries };
}

export function computeCorsSummary(
  pages: NonNullable<UnifiedReport["scans"]["http"]>["pages"],
): CorsSummary {
  let pagesTested = 0;
  let issuesFound = 0;
  for (const page of pages) {
    if (page.corsChecked) pagesTested++;
    issuesFound += (page.corsIssues ?? []).length;
  }
  return { pagesTested, issuesFound };
}

export function processTlsData(
  tlsData: TlsReportData,
  detectedTechs: DetectedTechnology[],
): TlsProcessedData {
  const issueMap = new Map<string, { pages: string[] }>();
  for (const finding of tlsData.findings) {
    issueMap.set(finding, { pages: [tlsData.host] });
  }

  const issues = classifyAndSortIssues({
    issueMap,
    detectedTechs,
    criticalPatterns: TLS_SCAN_CONFIG.criticalFindingPatterns,
  });

  const { good, weak, missing } = countGradeDistribution(tlsData.grades);

  return {
    host: tlsData.host,
    port: tlsData.port,
    certificate: tlsData.certificate,
    chain: tlsData.chain,
    protocols: tlsData.protocols,
    cipher: tlsData.cipher,
    grades: tlsData.grades,
    gradeSummary: { good, weak, missing },
    issues,
  };
}
