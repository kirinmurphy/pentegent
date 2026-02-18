import { escapeHtml } from "../../utils/string.js";
import { humanizeContentType } from "../../utils/format.js";
import { renderIssueCards, renderGroupedScriptCards } from "./render-shared.js";
import { COPY_PROMPT_SCRIPT } from "./scripts.js";
import type {
  ProcessedReportData,
  PrintChecklistSection,
  AiPromptData,
  AggregatedIssue,
} from "../report-data-service.js";

export { renderTlsSection } from "./render-tls-section.js";

export function renderHeadersSection(data: ProcessedReportData): string {
  if (data.totalPages === 0) return "";

  const { good } = data.headerGradeSummary;
  const sortedIssues = sortBySeverity(data.issues);
  const criticalCount = sortedIssues.filter((i) => i.isCritical).length;
  const warningCount = sortedIssues.length - criticalCount;

  const summaryCards = `
    <div class="summary">
      <div class="summary-card good">
        <h4>Good</h4>
        <div class="value">${good}</div>
      </div>
      <div class="summary-card${criticalCount > 0 ? " critical" : ""}">
        <h4>Critical</h4>
        <div class="value">${criticalCount}</div>
      </div>
      <div class="summary-card${warningCount > 0 ? " warning" : ""}">
        <h4>Warning</h4>
        <div class="value">${warningCount}</div>
      </div>
    </div>
  `;

  const redirectInfo =
    data.redirectChain.length > 1
      ? `<div class="url-info">
        <p><strong>Redirect Chain:</strong> ${data.redirectChain.map(escapeHtml).join(" &rarr; ")}</p>
       </div>`
      : "";

  const issueCards = renderIssueCards(
    sortedIssues,
    data.isMultiPage,
    data.totalPages,
    data.matchedFrameworks,
  );

  const scannedPagesTable = data.isMultiPage
    ? `
    <details id="scanned-pages">
      <summary>Scanned Pages (${data.totalPages})</summary>
      <div class="explanation">
        <table>
          <thead>
            <tr><th>URL</th><th>Status</th><th>Page Type</th></tr>
          </thead>
          <tbody>
            ${data.scannedPages
              .map(
                (page) => `
                <tr>
                  <td>${escapeHtml(page.url)}</td>
                  <td>${page.statusCode}</td>
                  <td>${escapeHtml(humanizeContentType(page.contentType))}</td>
                </tr>
              `,
              )
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
      ${issueCards}
      ${scannedPagesTable}
    </div>
  `;
}

export function renderCookieSection(data: ProcessedReportData): string {
  if (data.totalPages === 0) return "";

  const sortedCookieIssues = sortBySeverity(data.cookieIssues);
  const hasIssues = sortedCookieIssues.length > 0;
  const { totalCookies } = data.cookieSummary;
  const cookieCritical = sortedCookieIssues.filter((i) => i.isCritical).length;
  const cookieWarning = sortedCookieIssues.length - cookieCritical;

  const summaryCards = hasIssues
    ? `
    <div class="summary">
      <div class="summary-card">
        <h4>Cookies Found</h4>
        <div class="value">${totalCookies}</div>
      </div>
      <div class="summary-card${cookieCritical > 0 ? " critical" : ""}">
        <h4>Critical</h4>
        <div class="value">${cookieCritical}</div>
      </div>
      <div class="summary-card${cookieWarning > 0 ? " warning" : ""}">
        <h4>Warning</h4>
        <div class="value">${cookieWarning}</div>
      </div>
    </div>
  `
    : "";

  const issueCards = hasIssues
    ? renderIssueCards(
        sortedCookieIssues,
        data.isMultiPage,
        data.totalPages,
        data.matchedFrameworks,
      )
    : `<p class="empty-state">No cookie security issues found</p>`;

  return `
    <div class="section">
      <h2>Cookie Security</h2>
      ${summaryCards}
      ${issueCards}
    </div>
  `;
}

export function renderScriptSection(data: ProcessedReportData): string {
  if (data.totalPages === 0) return "";

  const sortedScriptIssues = [...data.groupedScriptIssues].sort(
    (a, b) => Number(b.isCritical) - Number(a.isCritical),
  );
  const hasIssues = sortedScriptIssues.length > 0;
  const { externalScripts } = data.scriptSummary;
  const scriptCritical = sortedScriptIssues.filter((i) => i.isCritical).length;
  const scriptWarning = sortedScriptIssues.length - scriptCritical;

  const summaryCards = hasIssues
    ? `
    <div class="summary">
      <div class="summary-card">
        <h4>External Scripts</h4>
        <div class="value">${externalScripts}</div>
      </div>
      <div class="summary-card${scriptCritical > 0 ? " critical" : ""}">
        <h4>Critical</h4>
        <div class="value">${scriptCritical}</div>
      </div>
      <div class="summary-card${scriptWarning > 0 ? " warning" : ""}">
        <h4>Warning</h4>
        <div class="value">${scriptWarning}</div>
      </div>
    </div>
  `
    : "";

  const issueCards = hasIssues
    ? renderGroupedScriptCards(sortedScriptIssues, data.matchedFrameworks)
    : `<p class="empty-state">No script security issues found</p>`;

  return `
    <div class="section">
      <h2>Script &amp; Dependency Security</h2>
      ${summaryCards}
      ${issueCards}
    </div>
  `;
}

export function renderCorsSection(data: ProcessedReportData): string {
  if (data.totalPages === 0) return "";

  const sortedCorsIssues = sortBySeverity(data.corsIssues);
  const hasIssues = sortedCorsIssues.length > 0;
  const { pagesTested } = data.corsSummary;
  const corsCritical = sortedCorsIssues.filter((i) => i.isCritical).length;
  const corsWarning = sortedCorsIssues.length - corsCritical;

  const summaryCards = hasIssues
    ? `
    <div class="summary">
      <div class="summary-card">
        <h4>Pages Tested</h4>
        <div class="value">${pagesTested}</div>
      </div>
      <div class="summary-card${corsCritical > 0 ? " critical" : ""}">
        <h4>Critical</h4>
        <div class="value">${corsCritical}</div>
      </div>
      <div class="summary-card${corsWarning > 0 ? " warning" : ""}">
        <h4>Warning</h4>
        <div class="value">${corsWarning}</div>
      </div>
    </div>
  `
    : "";

  const issueCards = hasIssues
    ? renderIssueCards(sortedCorsIssues, false, 0, data.matchedFrameworks)
    : `<p class="empty-state">No CORS issues found</p>`;

  return `
    <div class="section">
      <h2>CORS Configuration</h2>
      ${summaryCards}
      ${issueCards}
    </div>
  `;
}

export function renderAiPromptSection(aiPrompt: AiPromptData | null): string {
  if (!aiPrompt) return "";

  return `
    <div class="section">
      <div class="ai-prompt-collapsible">
        <div class="ai-prompt-header">
          <span>Prompt for AI Agent Fix</span>
        </div>
        <div class="ai-prompt-description">
          <span>Copy this prompt into an AI assistant to get specific configuration fixes for your technology stack.</span>
          <button class="ctrl-btn ai-copy-btn" onclick="copyPrompt()">Copy to clipboard</button>
        </div>
        <div class="ai-prompt-body" id="ai-prompt-text">${escapeHtml(aiPrompt.promptText)}</div>
      </div>
    </div>
    ${COPY_PROMPT_SCRIPT}
  `;
}

export function renderPrintChecklistBar(
  printChecklist: PrintChecklistSection[],
  matchedFrameworks: ProcessedReportData["matchedFrameworks"],
): string {
  if (printChecklist.length === 0) return "";

  const buttons =
    matchedFrameworks.length > 0
      ? [
          `<button class="fix-btn print-btn" data-fw="generic">Default</button>`,
          ...matchedFrameworks.map(
            (fw) =>
              `<button class="fix-btn print-btn" data-fw="${fw.slug}">${escapeHtml(fw.name)}</button>`,
          ),
        ].join("")
      : `<button class="fix-btn print-btn" data-fw="generic">Print</button>`;

  return `
    <div class="print-checklist-bar">
      <span class="bar-title">Print Resolution Checklist</span>
      <div class="group">
        ${buttons}
      </div>
    </div>
  `;
}

export function renderPrintView(data: ProcessedReportData): string {
  if (data.printChecklist.length === 0) return "";

  const subtitles = [
    `<p class="print-subtitle print-subtitle-generic">Recommended Fixes</p>`,
    ...data.matchedFrameworks.map(
      (fw) =>
        `<p class="print-subtitle print-subtitle-${fw.slug}" style="display:none">Recommended Fixes for ${escapeHtml(fw.name)}</p>`,
    ),
  ].join("\n");

  const sections = data.printChecklist
    .map((section) => {
      const items = section.items
        .map((item) => {
          const frameworkFixes = item.frameworkFixes
            .map(
              ({ slug, fix }) =>
                `<div class="print-item-fix print-fix-${slug}" style="display:none">${escapeHtml(fix)}</div>`,
            )
            .join("");

          return `
        <div class="print-item">
          <input type="checkbox">
          <div class="print-item-label">
            <div>${escapeHtml(item.issue)}</div>
            ${item.genericFix ? `<div class="print-item-fix print-fix-generic">${escapeHtml(item.genericFix)}</div>` : ""}
            ${frameworkFixes}
          </div>
        </div>
      `;
        })
        .join("");

      return `
      <h3 class="print-section-header">${escapeHtml(section.label)}</h3>
      ${items}
    `;
    })
    .join("");

  return `
    <div class="print-view">
      <h2>Security Scan Resolution Checklist</h2>
      <p class="print-meta"><a href="${escapeHtml(data.targetUrl)}">${escapeHtml(data.targetUrl)}</a></p>
      <p class="print-meta">${data.formattedDate}</p>
      ${subtitles}
      ${sections}
    </div>
  `;
}

function sortBySeverity(issues: AggregatedIssue[]): AggregatedIssue[] {
  return [...issues].sort(
    (a, b) => Number(b.isCritical) - Number(a.isCritical),
  );
}
