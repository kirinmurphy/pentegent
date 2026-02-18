import type { TlsReportData } from "@penetragent/shared";
import type { SecurityExplanation } from "../config/security-explanations.js";

export interface FrameworkFix {
  framework: string;
  slug: string;
  fix: string;
}

export interface AggregatedIssue {
  issue: string;
  pages: string[];
  isCritical: boolean;
  explanationKey: string;
  explanation: SecurityExplanation | undefined;
  matchedFrameworks: FrameworkFix[];
}

export interface HeaderGradeSummary {
  good: number;
  weak: number;
  missing: number;
}

export interface AiPromptData {
  promptText: string;
  techStackLabel: string;
  findings: string[];
}

export interface PrintChecklistItem {
  issue: string;
  genericFix: string;
  frameworkFixes: FrameworkFix[];
}

export interface PrintChecklistSection {
  label: string;
  items: PrintChecklistItem[];
}

export interface GroupedScriptIssue {
  issueType: string;
  scripts: string[];
  isCritical: boolean;
  explanationKey: string;
  explanation: SecurityExplanation | undefined;
  matchedFrameworks: FrameworkFix[];
}

export interface CookieSummary {
  totalCookies: number;
  insecureCookies: number;
}

export interface ScriptSummary {
  externalScripts: number;
  missingSri: number;
  vulnerableLibraries: number;
}

export interface CorsSummary {
  pagesTested: number;
  issuesFound: number;
}

export interface TlsProcessedData {
  host: string;
  port: number;
  certificate: TlsReportData["certificate"];
  chain: TlsReportData["chain"];
  protocols: TlsReportData["protocols"];
  cipher: TlsReportData["cipher"];
  grades: TlsReportData["grades"];
  gradeSummary: { good: number; weak: number; missing: number };
  issues: AggregatedIssue[];
}

export interface ProcessedReportData {
  targetUrl: string;
  timestamp: string;
  formattedDate: string;
  isMultiPage: boolean;
  totalPages: number;
  redirectChain: string[];
  headerGradeSummary: HeaderGradeSummary;
  issues: AggregatedIssue[];
  cookieIssues: AggregatedIssue[];
  scriptIssues: AggregatedIssue[];
  groupedScriptIssues: GroupedScriptIssue[];
  corsIssues: AggregatedIssue[];
  cookieSummary: CookieSummary;
  scriptSummary: ScriptSummary;
  corsSummary: CorsSummary;
  matchedFrameworks: { name: string; slug: string }[];
  aiPrompt: AiPromptData | null;
  scannedPages: { url: string; statusCode: number; contentType: string | null }[];
  printChecklist: PrintChecklistSection[];
  tls: TlsProcessedData | null;
}
