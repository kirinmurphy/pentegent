import fs from "node:fs";
import path from "node:path";
import { CRAWL_CONFIG } from "./crawl-config.js";
import { extractLinks } from "./extract-links.js";
import { checkSecurityIssues } from "./check-security-issues.js";

export interface CrawlPage {
  url: string;
  statusCode: number;
  contentType: string | null;
  securityIssues: string[];
}

export interface CrawlReport {
  startUrl: string;
  pagesScanned: number;
  pages: CrawlPage[];
  findings: string[];
  timestamp: string;
}

export interface CrawlSummary {
  pagesScanned: number;
  issuesFound: number;
  criticalFindings: string[];
}

export async function runCrawlScan(
  baseUrl: string,
  reportsDir: string,
  jobId: string,
): Promise<{ report: CrawlReport; summary: CrawlSummary }> {
  const visited: Set<string> = new Set();
  const toVisit: string[] = [baseUrl];
  const pages: CrawlPage[] = [];
  const allFindings: Set<string> = new Set();

  while (toVisit.length > 0 && pages.length < CRAWL_CONFIG.maxPages) {
    const url = toVisit.shift()!;
    if (visited.has(url)) continue;
    visited.add(url);

    try {
      const response = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent": CRAWL_CONFIG.userAgent,
        },
      });

      const contentType = response.headers.get("content-type");
      const isHtml = contentType?.includes("text/html");

      let body = "";
      if (isHtml) {
        body = await response.text();
      }

      const securityIssues = checkSecurityIssues(response, body);
      securityIssues.forEach((issue) => allFindings.add(issue));

      pages.push({
        url,
        statusCode: response.status,
        contentType,
        securityIssues,
      });

      if (isHtml && pages.length < CRAWL_CONFIG.maxPages) {
        const links = extractLinks(body, url);
        for (const link of links) {
          if (!visited.has(link) && !toVisit.includes(link)) {
            toVisit.push(link);
          }
        }
      }
    } catch (err) {
      pages.push({
        url,
        statusCode: 0,
        contentType: null,
        securityIssues: [
          `Failed to fetch: ${err instanceof Error ? err.message : String(err)}`,
        ],
      });
    }
  }

  const report: CrawlReport = {
    startUrl: baseUrl,
    pagesScanned: pages.length,
    pages,
    findings: Array.from(allFindings),
    timestamp: new Date().toISOString(),
  };

  const criticalFindings = report.findings.filter(
    (finding) =>
      CRAWL_CONFIG.criticalFindingPatterns.some((pattern) =>
        finding.includes(pattern),
      ),
  );

  const summary: CrawlSummary = {
    pagesScanned: pages.length,
    issuesFound: allFindings.size,
    criticalFindings,
  };

  const jobDir = path.join(reportsDir, jobId);
  fs.mkdirSync(jobDir, { recursive: true });
  fs.writeFileSync(
    path.join(jobDir, "crawl.json"),
    JSON.stringify(report, null, 2),
  );

  return { report, summary };
}
