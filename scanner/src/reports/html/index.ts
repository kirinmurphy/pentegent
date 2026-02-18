import fs from "node:fs";
import path from "node:path";
import type { UnifiedReport } from "@penetragent/shared";
import { loadUnifiedReport } from "../unified-report-service.js";
import { processReportData } from "../report-data-service.js";
import { escapeHtml } from "../../utils/string.js";
import { formatTimestamp } from "../../utils/format.js";
import { HTML_STYLES } from "./styles.js";
import { CONTROL_BAR_SCRIPT } from "./scripts.js";
import { renderControlBar } from "./render-shared.js";
import {
  renderHeadersSection,
  renderTlsSection,
  renderCookieSection,
  renderScriptSection,
  renderCorsSection,
  renderPrintChecklistBar,
  renderAiPromptSection,
  renderPrintView,
} from "./render-sections.js";

export function generateHtmlReport(report: UnifiedReport): string {
  const data = processReportData(report);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Security Scan Report - ${escapeHtml(data.targetUrl)}</title>
  <style>${HTML_STYLES}</style>
</head>
<body>
  <div class="container">
    <h1>Security Scan Report</h1>
    <div class="meta">
      <p><a href="${escapeHtml(data.targetUrl)}" target="_blank" rel="noopener">${escapeHtml(data.targetUrl)}</a></p>
      <p>${formatTimestamp(data.timestamp)}</p>
    </div>

    ${renderControlBar(data.matchedFrameworks)}
    ${renderHeadersSection(data)}
    ${renderTlsSection(data.tls, data.matchedFrameworks)}
    ${renderCookieSection(data)}
    ${renderScriptSection(data)}
    ${renderCorsSection(data)}
    ${renderPrintChecklistBar(data.printChecklist, data.matchedFrameworks)}
    ${renderAiPromptSection(data.aiPrompt)}
    ${renderPrintView(data)}
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
  const date = report.timestamp ? report.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const htmlPath = path.join(jobDir, `report-${targetId}-${date}.html`);

  fs.writeFileSync(htmlPath, html, "utf-8");
}
