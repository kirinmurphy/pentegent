import fs from "node:fs";
import path from "node:path";
import type { UnifiedReport, DetectedTechnology } from "@penetragent/shared";
import { loadUnifiedReport } from "./unified-report-service.js";
import { findExplanation, SECURITY_EXPLANATIONS } from "../scanTypes/security-explanations.js";

const HTML_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    background: #f5f5f5;
    padding: 20px;
  }
  .container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }
  h1 {
    color: #2c3e50;
    margin-bottom: 10px;
    font-size: 2.5em;
  }
  h2 {
    color: #34495e;
    margin: 30px 0 15px 0;
    padding-bottom: 10px;
    border-bottom: 2px solid #3498db;
    font-size: 1.8em;
  }
  h3 {
    color: #555;
    margin: 20px 0 10px 0;
    font-size: 1.3em;
  }
  .meta {
    color: #7f8c8d;
    margin-bottom: 20px;
    padding: 15px;
    background: #ecf0f1;
    border-radius: 4px;
  }
  .meta p {
    margin: 5px 0;
  }
  .meta a {
    color: #2980b9;
    text-decoration: none;
    font-size: 1.3em;
    font-weight: 500;
  }
  .meta a:hover {
    text-decoration: underline;
  }
  .control-bar {
    position: sticky;
    top: 0;
    z-index: 100;
    background: #2c3e50;
    color: white;
    padding: 10px 16px;
    border-radius: 6px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
  .control-bar .group {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .control-bar .group-label {
    font-size: 0.85em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    opacity: 0.8;
  }
  .ctrl-btn, .fix-btn {
    padding: 6px 14px;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 4px;
    background: transparent;
    color: white;
    cursor: pointer;
    font-size: 0.85em;
    font-weight: 600;
    transition: background 0.15s, border-color 0.15s;
  }
  .ctrl-btn:hover, .fix-btn:hover {
    background: rgba(255,255,255,0.15);
  }
  .ctrl-btn.active, .fix-btn.active {
    background: #3498db;
    border-color: #3498db;
  }
  .summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin: 20px 0;
  }
  .summary-card {
    padding: 20px;
    border-radius: 6px;
    background: #f8f9fa;
    border-left: 4px solid #3498db;
  }
  .summary-card.critical {
    border-left-color: #e74c3c;
    background: #fef5f5;
  }
  .summary-card.good {
    border-left-color: #27ae60;
    background: #f0faf4;
  }
  .summary-card h4 {
    font-size: 0.9em;
    color: #7f8c8d;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }
  .summary-card .value {
    font-size: 2em;
    font-weight: bold;
    color: #2c3e50;
  }
  .findings {
    margin: 20px 0;
  }
  .finding {
    padding: 12px 15px;
    margin: 8px 0;
    border-radius: 4px;
    background: #fff3cd;
    border-left: 4px solid #ffc107;
  }
  .finding.critical {
    background: #f8d7da;
    border-left-color: #dc3545;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 20px 0;
  }
  th, td {
    padding: 12px;
    text-align: left;
    border-bottom: 1px solid #ddd;
  }
  th {
    background: #34495e;
    color: white;
    font-weight: 600;
  }
  tr:hover {
    background: #f8f9fa;
  }
  .explanation-row:hover {
    background: transparent;
  }
  .explanation-row td {
    padding: 0;
    border-bottom: none;
  }
  .badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 0.85em;
    font-weight: 600;
  }
  .badge.good {
    background: #d4edda;
    color: #155724;
  }
  .badge.weak {
    background: #fff3cd;
    color: #856404;
  }
  .badge.missing {
    background: #f8d7da;
    color: #721c24;
  }
  .badge.count {
    background: #e2e3e5;
    color: #383d41;
    margin-left: 8px;
  }
  .url-info {
    background: #e8f4f8;
    padding: 15px;
    border-radius: 4px;
    margin: 15px 0;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }
  .section {
    margin: 40px 0;
  }
  code {
    background: #f4f4f4;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Courier New', monospace;
    font-size: 0.9em;
  }
  .empty-state {
    text-align: center;
    padding: 40px;
    color: #95a5a6;
    font-style: italic;
  }
  details {
    margin: 8px 0;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    overflow: hidden;
  }
  details summary {
    padding: 10px 15px;
    background: #f8f9fa;
    cursor: pointer;
    font-weight: 600;
    color: #34495e;
    user-select: none;
  }
  details summary:hover {
    background: #ecf0f1;
  }
  details[open] summary {
    border-bottom: 1px solid #e0e0e0;
  }
  .explanation {
    padding: 15px;
    background: #fafbfc;
    font-size: 0.9em;
    line-height: 1.7;
  }
  .issue-details {
    padding: 12px 15px;
    background: #fafbfc;
    font-size: 0.9em;
    line-height: 1.7;
  }
  .issue-details p {
    color: #555;
    margin-bottom: 4px;
  }
  .issue-details p:last-child {
    margin-bottom: 0;
  }
  .issue-fix {
    padding: 12px 15px;
    background: #f0f7ff;
  }
  .issue-fix pre {
    background: #2d2d2d;
    color: #f8f8f2;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.9em;
    margin: 0;
  }
  .issue-card {
    margin: 12px 0;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    overflow: hidden;
  }
  .issue-card-header {
    padding: 12px 15px;
    background: #fff3cd;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .issue-card-header.critical-issue {
    background: #f8d7da;
  }
  .issue-card-body {
    padding: 0;
  }
  .ai-prompt {
    margin: 30px 0;
    border: 2px solid #3498db;
    border-radius: 8px;
    overflow: hidden;
  }
  .ai-prompt-header {
    padding: 12px 15px;
    background: #3498db;
    color: white;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  .ai-prompt-body {
    padding: 15px;
    background: #f8f9fa;
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    white-space: pre-wrap;
    line-height: 1.5;
    max-height: 400px;
    overflow-y: auto;
  }
  .copy-btn {
    padding: 6px 14px;
    background: white;
    color: #3498db;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85em;
  }
  .copy-btn:hover {
    background: #ecf0f1;
  }
  .not-configured {
    color: #721c24;
    font-size: 0.85em;
    font-style: italic;
  }
`;

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

function formatTimestamp(isoString: string): string {
  return new Date(isoString).toLocaleString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

function slugifyFramework(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function collectFrameworkButtons(detectedTechs: DetectedTechnology[]): string[] {
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

  return Array.from(matched);
}

function generateExplanationContent(
  findingKey: string,
  detectedTechs: DetectedTechnology[],
): string {
  const explanation = findExplanation(findingKey);
  if (!explanation) return "";

  const techNames = detectedTechs.map((t) => t.name);
  const frameworkFixes = explanation.remediation.frameworks
    ? Object.entries(explanation.remediation.frameworks)
        .filter(([framework]) => techNames.includes(framework))
        .map(([framework, fix]) =>
          `<div class="issue-fix issue-fix-${slugifyFramework(framework)}" style="display:none">
            <pre>${escapeHtml(fix)}</pre>
          </div>`)
        .join("")
    : "";

  return `
    <div class="issue-details" style="display:none">
      <p>${escapeHtml(explanation.what)}</p>
      <p><strong>Why it matters:</strong> ${escapeHtml(explanation.why)}</p>
    </div>
    <div class="issue-fix issue-fix-generic" style="display:none">
      <pre>${escapeHtml(explanation.remediation.generic)}</pre>
    </div>
    ${frameworkFixes}
  `;
}

function generateControlBar(detectedTechs: DetectedTechnology[]): string {
  const frameworks = collectFrameworkButtons(detectedTechs);

  const fixButtons = [
    `<button class="fix-btn" data-fw="generic">Default</button>`,
    ...frameworks.map((fw) =>
      `<button class="fix-btn" data-fw="${slugifyFramework(fw)}">${escapeHtml(fw)}</button>`
    ),
  ].join("");

  return `
    <div class="control-bar">
      <div class="group">
        <button class="ctrl-btn" id="toggle-details">Show Details</button>
      </div>
      <div class="group">
        <span class="group-label">To Fix:</span>
        ${fixButtons}
      </div>
    </div>
  `;
}

function generateHeadersSection(report: UnifiedReport): string {
  const httpData = report.scans.http;
  const httpSummary = report.summary.http;
  if (!httpData || !httpSummary) return "";

  const rootPage = httpData.pages[0];
  if (!rootPage) return "";

  const headerGrades = rootPage.headerGrades;
  const detectedTechs = report.detectedTechnologies;
  const isMultiPage = httpData.pages.length > 1;

  const summaryCards = `
    <div class="summary">
      <div class="summary-card good">
        <h4>Good</h4>
        <div class="value">${headerGrades.filter((h) => h.grade === "good").length}</div>
      </div>
      <div class="summary-card">
        <h4>Weak</h4>
        <div class="value">${headerGrades.filter((h) => h.grade === "weak").length}</div>
      </div>
      <div class="summary-card critical">
        <h4>Missing</h4>
        <div class="value">${headerGrades.filter((h) => h.grade === "missing").length}</div>
      </div>
    </div>
  `;

  const redirectInfo = httpData.redirectChain.length > 1
    ? `<div class="url-info">
        <p><strong>Redirect Chain:</strong> ${httpData.redirectChain.map(escapeHtml).join(" &rarr; ")}</p>
       </div>`
    : "";

  const headerRows = headerGrades
    .map((h) => {
      const headerCell = `<td><code>${escapeHtml(h.header)}</code></td>`;

      if (h.grade === "missing") {
        const row = `
          <tr>
            ${headerCell}
            <td><span class="not-configured">Not configured</span></td>
            <td><span class="badge missing">MISSING</span></td>
            <td>${escapeHtml(h.reason)}</td>
          </tr>
        `;
        const content = generateExplanationContent(h.header, detectedTechs);
        return content
          ? `${row}<tr class="explanation-row"><td colspan="4">${content}</td></tr>`
          : row;
      }

      const row = `
        <tr>
          ${headerCell}
          <td>${h.value ? escapeHtml(h.value) : ""}</td>
          <td><span class="badge ${h.grade}">${h.grade.toUpperCase()}</span></td>
          <td>${escapeHtml(h.reason)}</td>
        </tr>
      `;

      if (h.grade === "weak") {
        const content = generateExplanationContent(h.header, detectedTechs);
        return content
          ? `${row}<tr class="explanation-row"><td colspan="4">${content}</td></tr>`
          : row;
      }

      return row;
    })
    .join("");

  const headersTable = `
    <table>
      <thead>
        <tr><th>Header</th><th>Value</th><th>Grade</th><th>Details</th></tr>
      </thead>
      <tbody>${headerRows}</tbody>
    </table>
  `;

  const infoLeakage = rootPage.infoLeakage.length > 0
    ? `
    <h3>Information Leakage</h3>
    <div class="findings">
      ${rootPage.infoLeakage
        .map((leak) => `
          <div class="finding critical">
            <strong>${escapeHtml(leak.header)}:</strong> ${escapeHtml(leak.value)}
          </div>
          ${generateExplanationContent(`${leak.header} header disclosed`, detectedTechs)}
        `)
        .join("")}
    </div>
  `
    : "";

  let crossPageSection = "";
  if (isMultiPage) {
    const issueToPages = new Map<string, string[]>();
    for (const page of httpData.pages) {
      for (const grade of page.headerGrades) {
        if (grade.grade === "missing") {
          const key = `Missing ${grade.header} header`;
          if (!issueToPages.has(key)) issueToPages.set(key, []);
          issueToPages.get(key)!.push(page.url);
        } else if (grade.grade === "weak") {
          const key = `Weak ${grade.header}: ${grade.reason}`;
          if (!issueToPages.has(key)) issueToPages.set(key, []);
          issueToPages.get(key)!.push(page.url);
        }
      }
      for (const leak of page.infoLeakage) {
        const key = `${leak.header} header disclosed: ${leak.value}`;
        if (!issueToPages.has(key)) issueToPages.set(key, []);
        issueToPages.get(key)!.push(page.url);
      }
      for (const issue of page.contentIssues) {
        if (!issueToPages.has(issue)) issueToPages.set(issue, []);
        issueToPages.get(issue)!.push(page.url);
      }
    }

    if (issueToPages.size > 0) {
      const isCritical = (issue: string) =>
        HTTP_CRITICAL_PATTERNS.some((p) => issue.includes(p));

      const isContentIssue = (issue: string) =>
        !issue.startsWith("Missing ") && !issue.startsWith("Weak ") && !issue.includes("header disclosed");

      const issueCards = Array.from(issueToPages.entries())
        .sort((a, b) => b[1].length - a[1].length)
        .map(([issue, pages]) => {
          const critical = isCritical(issue);
          const explanationKey = getExplanationKey(issue);
          const explanationContent = isContentIssue(issue)
            ? generateExplanationContent(explanationKey, detectedTechs)
            : "";

          return `
            <div class="issue-card">
              <div class="issue-card-header${critical ? " critical-issue" : ""}">
                <span>${escapeHtml(issue)}</span>
                <span class="badge count">${pages.length} page${pages.length !== 1 ? "s" : ""}</span>
              </div>
              ${explanationContent ? `<div class="issue-card-body">${explanationContent}</div>` : ""}
            </div>
          `;
        })
        .join("");

      crossPageSection = `
        <h3>Issues Across Pages</h3>
        ${issueCards}
      `;
    }
  }

  const scannedPagesTable = httpData.pages.length > 1
    ? `
    <details>
      <summary>Scanned Pages (${httpData.pages.length})</summary>
      <div class="explanation">
        <table>
          <thead>
            <tr><th>URL</th><th>Status</th><th>Content Type</th></tr>
          </thead>
          <tbody>
            ${httpData.pages
              .map((page) => `
                <tr>
                  <td>${escapeHtml(page.url)}</td>
                  <td>${page.statusCode}</td>
                  <td>${page.contentType ? escapeHtml(page.contentType) : "<em>Unknown</em>"}</td>
                </tr>
              `)
              .join("")}
          </tbody>
        </table>
      </div>
    </details>
  `
    : "";

  return `
    <div class="section">
      <h2>Security Headers</h2>
      ${summaryCards}
      ${redirectInfo}
      ${headersTable}
      ${infoLeakage}
      ${crossPageSection}
      ${scannedPagesTable}
    </div>
  `;
}

const HTTP_CRITICAL_PATTERNS = ["Missing Strict-Transport-Security", "Missing Content-Security-Policy", "Mixed content", "XSS"];

function getExplanationKey(issue: string): string {
  if (issue.startsWith("Missing ")) {
    return issue.replace("Missing ", "").replace(" header", "");
  }
  if (issue.startsWith("Weak ")) {
    return issue.replace("Weak ", "").split(":")[0];
  }
  return issue;
}

function generateAiPromptSection(report: UnifiedReport): string {
  const httpData = report.scans.http;
  if (!httpData) return "";

  const techs = report.detectedTechnologies.map((t) => t.name).join(", ") || "Unknown";
  const findings = httpData.findings;
  if (findings.length === 0) return "";

  const findingsList = findings
    .map((f, i) => `${i + 1}. ${f}`)
    .join("\n");

  const promptText =
`I ran a security scan on ${report.targetUrl} and found the following issues.
Detected technologies: ${techs}

Findings:
${findingsList}

For each finding, provide:
1. A specific configuration snippet or code fix for my technology stack
2. How to verify the fix worked
3. Any caveats or side effects to watch for

Please be specific to my detected technology stack (${techs}).`;

  return `
    <div class="section">
      <div class="ai-prompt">
        <div class="ai-prompt-header">
          <span>AI Remediation Prompt</span>
          <button class="copy-btn" onclick="copyPrompt()">Copy to clipboard</button>
        </div>
        <div class="ai-prompt-body" id="ai-prompt-text">${escapeHtml(promptText)}</div>
      </div>
    </div>
    <script>
    function copyPrompt() {
      var text = document.getElementById('ai-prompt-text').textContent;
      navigator.clipboard.writeText(text).then(function() {
        var btn = document.querySelector('.copy-btn');
        btn.textContent = 'Copied!';
        setTimeout(function() { btn.textContent = 'Copy to clipboard'; }, 2000);
      });
    }
    </script>
  `;
}

const CONTROL_BAR_SCRIPT = `
  <script>
  (function() {
    var detailsBtn = document.getElementById('toggle-details');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', function() {
        var showing = this.classList.toggle('active');
        this.textContent = showing ? 'Hide Details' : 'Show Details';
        var items = document.querySelectorAll('.issue-details');
        for (var i = 0; i < items.length; i++) {
          items[i].style.display = showing ? 'block' : 'none';
        }
      });
    }
    var fixBtns = document.querySelectorAll('.fix-btn');
    for (var i = 0; i < fixBtns.length; i++) {
      fixBtns[i].addEventListener('click', function() {
        var fw = this.getAttribute('data-fw');
        var wasActive = this.classList.contains('active');
        for (var j = 0; j < fixBtns.length; j++) {
          fixBtns[j].classList.remove('active');
        }
        var allFixes = document.querySelectorAll('.issue-fix');
        for (var j = 0; j < allFixes.length; j++) {
          allFixes[j].style.display = 'none';
        }
        if (wasActive) return;
        this.classList.add('active');
        var matches = document.querySelectorAll('.issue-fix-' + fw);
        for (var j = 0; j < matches.length; j++) {
          matches[j].style.display = 'block';
        }
      });
    }
  })();
  </script>
`;

export function generateHtmlReport(report: UnifiedReport): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Scan Report - ${escapeHtml(report.targetUrl)}</title>
  <style>${HTML_STYLES}</style>
</head>
<body>
  <div class="container">
    <h1>Security Scan Report</h1>
    <div class="meta">
      <p><a href="${escapeHtml(report.targetUrl)}" target="_blank" rel="noopener">${escapeHtml(report.targetUrl)}</a></p>
      <p>${formatTimestamp(report.timestamp)}</p>
    </div>

    ${generateControlBar(report.detectedTechnologies)}
    ${generateHeadersSection(report)}
    ${generateAiPromptSection(report)}
  </div>
  ${CONTROL_BAR_SCRIPT}
</body>
</html>`;
}

export function writeHtmlReport(
  reportsDir: string,
  jobId: string,
  targetId: string,
): void {
  const report = loadUnifiedReport(reportsDir, jobId);
  if (!report) {
    throw new Error(`Unified report not found for job ${jobId}`);
  }

  const html = generateHtmlReport(report);
  const jobDir = path.join(reportsDir, jobId);
  const date = new Date().toISOString().slice(0, 10);
  const htmlPath = path.join(jobDir, `report-${targetId}-${date}.html`);

  fs.writeFileSync(htmlPath, html, "utf-8");
}
