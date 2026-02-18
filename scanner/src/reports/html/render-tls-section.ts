import { escapeHtml } from "../../utils/string.js";
import { renderIssueCards } from "./render-shared.js";
import type { TlsProcessedData } from "../report-data-service.js";

export function renderTlsSection(
  tls: TlsProcessedData | null,
  globalFrameworks: { name: string; slug: string }[] = [],
): string {
  if (!tls) return "";

  const { good, weak, missing } = tls.gradeSummary;

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

  const issueCards = tls.issues.length > 0
    ? renderIssueCards(tls.issues, false, 0, globalFrameworks)
    : "";

  return `
    <div class="section">
      <h2>SSL/TLS Analysis</h2>
      ${summaryCards}
      ${issueCards}
      ${renderCertTable(tls.certificate)}
      ${renderChainSection(tls.chain)}
      ${renderProtocolTable(tls.protocols)}
      ${renderCipherInfo(tls.cipher)}
    </div>
  `;
}

function renderCertTable(cert: TlsProcessedData["certificate"]): string {
  return `
    <details>
      <summary>Certificate Details</summary>
      <div class="explanation">
        <table>
          <tbody>
            <tr><td><strong>Subject</strong></td><td>${escapeHtml(cert.subject)}</td></tr>
            <tr><td><strong>Issuer</strong></td><td>${escapeHtml(cert.issuer)}</td></tr>
            <tr><td><strong>Valid From</strong></td><td>${escapeHtml(cert.validFrom)}</td></tr>
            <tr><td><strong>Valid To</strong></td><td>${escapeHtml(cert.validTo)}</td></tr>
            <tr><td><strong>Days Until Expiry</strong></td><td>${cert.isExpired ? `<span class="badge critical">Expired</span>` : cert.daysUntilExpiry}</td></tr>
            <tr><td><strong>Self-Signed</strong></td><td>${cert.isSelfSigned ? "Yes" : "No"}</td></tr>
            <tr><td><strong>Hostname Match</strong></td><td>${cert.hostnameMatch ? "Yes" : `<span class="badge critical">No</span>`}</td></tr>
            <tr><td><strong>SANs</strong></td><td>${cert.subjectAltNames.length > 0 ? cert.subjectAltNames.map(escapeHtml).join(", ") : "<em>None</em>"}</td></tr>
            <tr><td><strong>Serial</strong></td><td><code>${escapeHtml(cert.serialNumber)}</code></td></tr>
          </tbody>
        </table>
      </div>
    </details>
  `;
}

function renderChainSection(chain: TlsProcessedData["chain"]): string {
  if (chain.length === 0) return "";

  return `
    <details>
      <summary>Certificate Chain (${chain.length} certificates)</summary>
      <div class="explanation">
        <table>
          <thead>
            <tr><th>Subject</th><th>Issuer</th><th>Valid From</th><th>Valid To</th><th>Self-Signed</th></tr>
          </thead>
          <tbody>
            ${chain.map((c) => `
              <tr>
                <td>${escapeHtml(c.subject)}</td>
                <td>${escapeHtml(c.issuer)}</td>
                <td>${escapeHtml(c.validFrom)}</td>
                <td>${escapeHtml(c.validTo)}</td>
                <td>${c.isSelfSigned ? "Yes" : "No"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </details>
  `;
}

function renderProtocolTable(protocols: TlsProcessedData["protocols"]): string {
  return `
    <details>
      <summary>Protocol Support</summary>
      <div class="explanation">
        <table>
          <thead>
            <tr><th>Protocol</th><th>Supported</th><th>Assessment</th></tr>
          </thead>
          <tbody>
            ${protocols.map((p) => `
              <tr>
                <td>${escapeHtml(p.protocol)}</td>
                <td>${p.supported ? "Yes" : "No"}</td>
                <td><span class="badge ${p.grade === "good" ? "good" : p.grade === "weak" ? "" : "critical"}">${escapeHtml(p.reason)}</span></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </details>
  `;
}

function renderCipherInfo(cipher: TlsProcessedData["cipher"]): string {
  return `
    <details>
      <summary>Negotiated Cipher Suite</summary>
      <div class="explanation">
        <table>
          <tbody>
            <tr><td><strong>Cipher</strong></td><td>${escapeHtml(cipher.name)}</td></tr>
            <tr><td><strong>Standard Name</strong></td><td>${escapeHtml(cipher.standardName)}</td></tr>
            <tr><td><strong>Forward Secrecy</strong></td><td>${cipher.hasForwardSecrecy ? "Yes" : `<span class="badge critical">No</span>`}</td></tr>
            <tr><td><strong>Assessment</strong></td><td><span class="badge ${cipher.grade === "good" ? "good" : cipher.grade === "weak" ? "" : "critical"}">${escapeHtml(cipher.reason)}</span></td></tr>
          </tbody>
        </table>
      </div>
    </details>
  `;
}
