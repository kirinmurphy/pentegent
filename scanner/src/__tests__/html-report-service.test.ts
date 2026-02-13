import { describe, it, expect } from "vitest";
import { generateHtmlReport } from "../services/html-report-service.js";
import type { UnifiedReport } from "@penetragent/shared";

function makeReport(overrides?: Partial<UnifiedReport>): UnifiedReport {
  return {
    jobId: "test-job",
    targetUrl: "https://example.com",
    scanTypes: ["http"],
    timestamp: new Date().toISOString(),
    scans: {
      http: {
        startUrl: "https://example.com",
        pagesScanned: 2,
        pages: [
          {
            url: "https://example.com",
            statusCode: 200,
            contentType: "text/html",
            headerGrades: [
              { header: "Strict-Transport-Security", value: null, grade: "missing", reason: "Header not present" },
              { header: "Content-Security-Policy", value: "default-src 'self'", grade: "good", reason: "Present without unsafe directives" },
              { header: "X-Content-Type-Options", value: "nosniff", grade: "good", reason: "Correctly set to nosniff" },
              { header: "X-Frame-Options", value: null, grade: "missing", reason: "Header not present" },
              { header: "Referrer-Policy", value: "unsafe-url", grade: "weak", reason: "Set to unsafe-url which leaks full URL" },
              { header: "Permissions-Policy", value: null, grade: "missing", reason: "Header not present" },
            ],
            infoLeakage: [{ header: "Server", value: "Apache/2.4" }],
            contentIssues: [],
          },
          {
            url: "https://example.com/about",
            statusCode: 200,
            contentType: "text/html",
            headerGrades: [
              { header: "Strict-Transport-Security", value: null, grade: "missing", reason: "Header not present" },
              { header: "Content-Security-Policy", value: null, grade: "missing", reason: "Header not present" },
              { header: "X-Content-Type-Options", value: null, grade: "missing", reason: "Header not present" },
              { header: "X-Frame-Options", value: null, grade: "missing", reason: "Header not present" },
              { header: "Referrer-Policy", value: null, grade: "missing", reason: "Header not present" },
              { header: "Permissions-Policy", value: null, grade: "missing", reason: "Header not present" },
            ],
            infoLeakage: [],
            contentIssues: [],
          },
        ],
        findings: [
          "Missing Strict-Transport-Security header",
          "Missing X-Frame-Options header",
          "Missing Permissions-Policy header",
          "Weak Referrer-Policy: Set to unsafe-url which leaks full URL",
          "Server header disclosed: Apache/2.4",
        ],
        redirectChain: ["https://example.com"],
        metaGenerators: ["WordPress 6.3"],
        timestamp: new Date().toISOString(),
      },
    },
    summary: {
      http: {
        pagesScanned: 2,
        issuesFound: 5,
        good: 0,
        weak: 0,
        missing: 6,
        criticalFindings: ["Missing Strict-Transport-Security header"],
      },
    },
    detectedTechnologies: [
      { name: "WordPress", confidence: "high", source: "meta generator: WordPress 6.3" },
      { name: "Apache", confidence: "high", source: "Server: Apache/2.4" },
    ],
    criticalFindings: ["Missing Strict-Transport-Security header"],
    ...overrides,
  };
}

const cases = [
  {
    name: "shows all four columns for missing headers",
    check: (html: string) => {
      expect(html).toContain("Not configured");
      expect(html).toContain('<span class="badge missing">MISSING</span>');
    },
  },
  {
    name: "contains issue-details and issue-fix elements for control bar",
    check: (html: string) => {
      expect(html).toContain("issue-details");
      expect(html).toContain("issue-fix");
      expect(html).toContain("issue-fix-generic");
    },
  },
  {
    name: "contains sticky control bar with Show Details and To Fix buttons",
    check: (html: string) => {
      expect(html).toContain("control-bar");
      expect(html).toContain("toggle-details");
      expect(html).toContain("Show Details");
      expect(html).toContain("To Fix:");
      expect(html).toContain('data-fw="generic"');
      expect(html).toContain("Default");
    },
  },
  {
    name: "shows detected framework buttons in control bar",
    check: (html: string) => {
      expect(html).toContain('data-fw="wordpress"');
      expect(html).toContain('data-fw="apache"');
      expect(html).toContain(">WordPress</button>");
      expect(html).toContain(">Apache</button>");
    },
  },
  {
    name: "shows cross-page issues with page counts for multi-page scans",
    check: (html: string) => {
      expect(html).toContain("Issues Across Pages");
      expect(html).toContain("issue-card");
      expect(html).toContain("page");
    },
  },
  {
    name: "contains AI remediation prompt",
    check: (html: string) => {
      expect(html).toContain("AI Remediation Prompt");
      expect(html).toContain("copyPrompt");
      expect(html).toContain("Copy to clipboard");
    },
  },
  {
    name: "shows framework-specific fix sections for detected tech",
    check: (html: string) => {
      expect(html).toContain("issue-fix-wordpress");
      expect(html).toContain("issue-fix-apache");
    },
  },
  {
    name: "target URL is a clickable link with larger font",
    check: (html: string) => {
      expect(html).toContain('href="https://example.com"');
      expect(html).toContain('target="_blank"');
      expect(html).toContain("font-size: 1.3em");
    },
  },
  {
    name: "timestamp is shown without label",
    check: (html: string) => {
      expect(html).not.toContain("<strong>Timestamp:</strong>");
    },
  },
  {
    name: "does not show Job ID",
    check: (html: string) => {
      expect(html).not.toContain("Job ID:");
    },
  },
  {
    name: "does not contain Detected Technologies section",
    check: (html: string) => {
      expect(html).not.toContain("<h2>Detected Technologies</h2>");
    },
  },
  {
    name: "does not contain tech badges in subheader",
    check: (html: string) => {
      expect(html).not.toContain("tech-badge");
    },
  },
  {
    name: "does not contain Issues by Type section",
    check: (html: string) => {
      expect(html).not.toContain("<h2>Issues by Type</h2>");
    },
  },
  {
    name: "scanned pages collapsed in details",
    check: (html: string) => {
      expect(html).toContain("Scanned Pages (2)");
    },
  },
  {
    name: "contains control bar JavaScript",
    check: (html: string) => {
      expect(html).toContain("toggle-details");
      expect(html).toContain("issue-fix-");
      expect(html).toContain("classList");
    },
  },
  {
    name: "explanation content uses inline format without What label",
    check: (html: string) => {
      expect(html).not.toContain("<dt>What:</dt>");
      expect(html).toContain("Why it matters:");
    },
  },
];

describe("generateHtmlReport", () => {
  const report = makeReport();
  const html = generateHtmlReport(report);

  for (const { name, check } of cases) {
    it(name, () => check(html));
  }

  it("hides cross-page section for single-page scans", () => {
    const singlePageReport = makeReport({
      scans: {
        http: {
          ...makeReport().scans.http!,
          pages: [makeReport().scans.http!.pages[0]],
          pagesScanned: 1,
        },
      },
    });
    const singlePageHtml = generateHtmlReport(singlePageReport);
    expect(singlePageHtml).not.toContain("Issues Across Pages");
    expect(singlePageHtml).not.toContain("Scanned Pages");
  });

  it("hides AI prompt when no findings", () => {
    const noFindingsReport = makeReport({
      scans: {
        http: {
          ...makeReport().scans.http!,
          findings: [],
        },
      },
    });
    const noFindingsHtml = generateHtmlReport(noFindingsReport);
    expect(noFindingsHtml).not.toContain("AI Remediation Prompt");
  });

  it("shows no framework buttons when no technologies detected", () => {
    const noTechReport = makeReport({ detectedTechnologies: [] });
    const noTechHtml = generateHtmlReport(noTechReport);
    expect(noTechHtml).toContain('data-fw="generic"');
    expect(noTechHtml).not.toContain('data-fw="wordpress"');
    expect(noTechHtml).not.toContain('data-fw="apache"');
  });
});
