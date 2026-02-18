import { escapeHtml } from "../../utils/string.js";
import type { SecurityExplanation } from "../../config/security-explanations.js";
import type {
  AggregatedIssue,
  GroupedScriptIssue,
  ProcessedReportData,
  FrameworkFix,
} from "../report-data-service.js";

export const WARNING_ICON = `<svg class="issue-icon" viewBox="0 0 20 20" fill="none"><path d="M10 2L1 18h18L10 2z" fill="#b8860b" opacity="0.85"/><rect x="9" y="8" width="2" height="5" rx="1" fill="#fff"/><circle cx="10" cy="15" r="1" fill="#fff"/></svg>`;
export const ALERT_ICON = `<svg class="issue-icon" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="9" fill="#c0392b" opacity="0.85"/><rect x="9" y="5" width="2" height="6" rx="1" fill="#fff"/><circle cx="10" cy="14" r="1.2" fill="#fff"/></svg>`;

export function renderExplanation(config: {
  explanation: SecurityExplanation | undefined;
  matchedFrameworks: FrameworkFix[];
  globalFrameworks: { name: string; slug: string }[];
}): string {
  const { explanation, matchedFrameworks, globalFrameworks } = config;
  if (!explanation) return "";

  const genericFix = explanation.remediation.generic;
  const specificFixMap = new Map(matchedFrameworks.map(({ slug, fix }) => [slug, fix]));

  const frameworkFixes = globalFrameworks
    .map(({ slug }) => {
      const fix = specificFixMap.get(slug) ?? genericFix;
      return `<div class="issue-fix issue-fix-${slug}" style="display:none">
            <pre>${escapeHtml(fix)}</pre>
          </div>`;
    })
    .join("");

  return `
    <div class="issue-details" style="display:none">
      <p>${escapeHtml(explanation.what)}</p>
      <p><strong>Why it matters:</strong> ${escapeHtml(explanation.why)}</p>
    </div>
    <div class="issue-fix issue-fix-generic" style="display:none">
      <pre>${escapeHtml(genericFix)}</pre>
    </div>
    ${frameworkFixes}
  `;
}

export function renderControlBar(
  matchedFrameworks: ProcessedReportData["matchedFrameworks"],
): string {
  const fixGroup = matchedFrameworks.length > 0
    ? `<span class="group-label">Suggested Solutions</span>
       <button class="fix-btn" data-fw="generic">Default</button>
       ${matchedFrameworks.map((fw) =>
         `<button class="fix-btn" data-fw="${fw.slug}">${escapeHtml(fw.name)}</button>`
       ).join("")}`
    : `<button class="fix-btn" data-fw="generic">Suggested Solutions</button>`;

  return `
    <div class="control-bar">
      <div class="group">
        <button class="ctrl-btn" id="toggle-details">Show Issue Explanations</button>
      </div>
      <div class="group">
        ${fixGroup}
      </div>
    </div>
  `;
}

export function renderIssueCards(
  issues: AggregatedIssue[],
  isMultiPage: boolean,
  totalPages: number,
  globalFrameworks: { name: string; slug: string }[] = [],
): string {
  if (issues.length === 0) return "";

  return issues
    .map((issue) => {
      const explanationContent = renderExplanation({
        explanation: issue.explanation,
        matchedFrameworks: issue.matchedFrameworks,
        globalFrameworks,
      });

      let pageBadge = "";
      let pageList = "";
      if (isMultiPage) {
        if (issue.pages.length === totalPages) {
          pageBadge = `<span class="badge-btn" onclick="openScannedPages()">All pages</span>`;
        } else {
          pageBadge = `<span class="badge-btn" onclick="togglePages(this)">${issue.pages.length} page${issue.pages.length !== 1 ? "s" : ""} <span class="caret">&#9662;</span></span>`;
          pageList = `<div class="issue-card-pages"><ul>${issue.pages.map((url) => `<li>${escapeHtml(url)}</li>`).join("")}</ul></div>`;
        }
      }

      const icon = issue.isCritical ? ALERT_ICON : WARNING_ICON;

      return `
        <div class="issue-card">
          <div class="issue-card-header${issue.isCritical ? " critical-issue" : ""}">
            ${icon}
            <span>${escapeHtml(issue.issue)}</span>
            ${pageBadge}
          </div>
          ${explanationContent ? `<div class="issue-card-body">${explanationContent}</div>` : ""}
          ${pageList}
        </div>
      `;
    })
    .join("");
}

export function renderGroupedScriptCards(
  groups: GroupedScriptIssue[],
  globalFrameworks: { name: string; slug: string }[],
): string {
  if (groups.length === 0) return "";

  return groups
    .map((group) => {
      const explanationContent = renderExplanation({
        explanation: group.explanation,
        matchedFrameworks: group.matchedFrameworks,
        globalFrameworks,
      });

      const icon = group.isCritical ? ALERT_ICON : WARNING_ICON;
      const count = group.scripts.length;
      const badge = count > 0
        ? `<span class="badge-btn" onclick="togglePages(this)">${count} script${count !== 1 ? "s" : ""} <span class="caret">&#9662;</span></span>`
        : "";
      const scriptList = count > 0
        ? `<div class="issue-card-pages"><ul>${group.scripts.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul></div>`
        : "";

      return `
        <div class="issue-card">
          <div class="issue-card-header${group.isCritical ? " critical-issue" : ""}">
            ${icon}
            <span>${escapeHtml(group.issueType)}</span>
            ${badge}
          </div>
          ${explanationContent ? `<div class="issue-card-body">${explanationContent}</div>` : ""}
          ${scriptList}
        </div>
      `;
    })
    .join("");
}
