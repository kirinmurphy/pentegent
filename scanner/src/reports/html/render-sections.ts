import { escapeHtml } from "../../utils/string.js";
import { humanizeContentType } from "../../utils/format.js";
import { renderIssueCards, renderGroupedScriptCards } from "./render-shared.js";
import { COPY_PROMPT_SCRIPT } from "./scripts.js";
import type {
  ProcessedReportData,
  PrintChecklistSection,
  AiPromptData,
} from "../report-data-service.js";

export { renderTlsSection } from "./render-tls-section.js";

export function renderHeadersSection(data: ProcessedReportData): string {
  if (data.totalPages === 0) return "";

  const { good, weak, missing } = data.headerGradeSummary;

  const summaryCards = `
    <div class="summary">
      <div class="summary-card good">
        <h4>Good</h4>
        <div class="value">${good}</div>
      </div>
      <div class="summary-card">
        <h4>Weak</h4>
        <div class="value">${weak}</div>
      </div>
      <div class="summary-card critical">
        <h4>Missing</h4>
        <div class="value">${missing}</div>
      </div>
    </div>
  `;

  const redirectInfo = data.redirectChain.length > 1
    ? `<div class="url-info">
        <p><strong>Redirect Chain:</strong> ${data.redirectChain.map(escapeHtml).join(" &rarr; ")}</p>
       </div>`
    : "";

  const issueCards = renderIssueCards(data.issues, data.isMultiPage, data.totalPages, data.matchedFrameworks);

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
              .map((page) => `
                <tr>
                  <td>${escapeHtml(page.url)}</td>
                  <td>${page.statusCode}</td>
                  <td>${escapeHtml(humanizeContentType(page.contentType))}</td>
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
      ${issueCards}
      ${scannedPagesTable}
    </div>
  `;
}

export function renderCookieSection(data: ProcessedReportData): string {
  if (data.totalPages === 0) return "";

  const hasIssues = data.cookieIssues.length > 0;
  const { totalCookies, insecureCookies } = data.cookieSummary;

  const summaryCards = hasIssues ? `
    <div class="summary">
      <div class="summary-card">
        <h4>Cookies Found</h4>
        <div class="value">${totalCookies}</div>
      </div>
      <div class="summary-card${insecureCookies > 0 ? " critical" : " good"}">
        <h4>Insecure Cookies</h4>
        <div class="value">${insecureCookies}</div>
      </div>
    </div>
  ` : "";

  const issueCards = hasIssues
    ? renderIssueCards(data.cookieIssues, data.isMultiPage, data.totalPages, data.matchedFrameworks)
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

  const hasIssues = data.groupedScriptIssues.length > 0;
  const { externalScripts, missingSri, vulnerableLibraries } = data.scriptSummary;

  const summaryCards = hasIssues ? `
    <div class="summary">
      <div class="summary-card">
        <h4>External Scripts</h4>
        <div class="value">${externalScripts}</div>
      </div>
      <div class="summary-card${missingSri > 0 ? " critical" : " good"}">
        <h4>Missing SRI</h4>
        <div class="value">${missingSri}</div>
      </div>
      <div class="summary-card${vulnerableLibraries > 0 ? " critical" : " good"}">
        <h4>Vulnerable Libraries</h4>
        <div class="value">${vulnerableLibraries}</div>
      </div>
    </div>
  ` : "";

  const issueCards = hasIssues
    ? renderGroupedScriptCards(data.groupedScriptIssues, data.matchedFrameworks)
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

  const hasIssues = data.corsIssues.length > 0;
  const { pagesTested, issuesFound } = data.corsSummary;

  const summaryCards = hasIssues ? `
    <div class="summary">
      <div class="summary-card">
        <h4>Pages Tested</h4>
        <div class="value">${pagesTested}</div>
      </div>
      <div class="summary-card${issuesFound > 0 ? " critical" : " good"}">
        <h4>Issues Found</h4>
        <div class="value">${issuesFound}</div>
      </div>
    </div>
  ` : "";

  const issueCards = hasIssues
    ? renderIssueCards(data.corsIssues, false, 0, data.matchedFrameworks)
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

  const buttons = matchedFrameworks.length > 0
    ? [
        `<button class="fix-btn print-btn" data-fw="generic">Default</button>`,
        ...matchedFrameworks.map((fw) =>
          `<button class="fix-btn print-btn" data-fw="${fw.slug}">${escapeHtml(fw.name)}</button>`
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
    ...data.matchedFrameworks.map((fw) =>
      `<p class="print-subtitle print-subtitle-${fw.slug}" style="display:none">Recommended Fixes for ${escapeHtml(fw.name)}</p>`
    ),
  ].join("\n");

  const sections = data.printChecklist.map((section) => {
    const items = section.items.map((item) => {
      const frameworkFixes = item.frameworkFixes
        .map(({ slug, fix }) =>
          `<div class="print-item-fix print-fix-${slug}" style="display:none">${escapeHtml(fix)}</div>`)
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
    }).join("");

    return `
      <h3 class="print-section-header">${escapeHtml(section.label)}</h3>
      ${items}
    `;
  }).join("");

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
