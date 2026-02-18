import type { DetectedTechnology } from "@penetragent/shared";
import { classifyByPrefix, SECTION_LABELS } from "../grading/issue-classification.js";
import type { AiPromptData } from "./report-types.js";

export function buildAiPromptData(config: {
  targetUrl: string;
  detectedTechs: DetectedTechnology[];
  findings: string[];
}): AiPromptData | null {
  const { targetUrl, detectedTechs, findings } = config;
  if (findings.length === 0) return null;

  const techStackLabel = formatTechStack(detectedTechs);
  const findingsText = findings.map((f, i) => `${i + 1}. ${f}`).join("\n");

  return { promptText: buildPromptText(targetUrl, techStackLabel, findingsText), techStackLabel, findings };
}

export function classifyFindings(
  httpFindings: string[],
  tlsFindings: string[],
): Record<string, string[]> {
  const classified = classifyByPrefix({
    items: httpFindings,
    getText: (f) => f,
  });
  return {
    ...classified,
    tls: [...tlsFindings],
  };
}

export function buildGroupedAiPromptData(config: {
  targetUrl: string;
  detectedTechs: DetectedTechnology[];
  classifiedFindings: Record<string, string[]>;
}): AiPromptData | null {
  const { targetUrl, detectedTechs, classifiedFindings } = config;

  const allFindings: string[] = [];
  for (const findings of Object.values(classifiedFindings)) {
    allFindings.push(...findings);
  }
  if (allFindings.length === 0) return null;

  const techStackLabel = formatTechStack(detectedTechs);
  const sections: string[] = [];
  let counter = 1;
  for (const [key, findings] of Object.entries(classifiedFindings)) {
    if (findings.length === 0) continue;
    const label = SECTION_LABELS[key] ?? key;
    const items = findings.map((f) => `${counter++}. ${f}`).join("\n");
    sections.push(`${label}:\n${items}`);
  }

  return { promptText: buildPromptText(targetUrl, techStackLabel, sections.join("\n\n")), techStackLabel, findings: allFindings };
}

function formatTechStack(techs: DetectedTechnology[]): string {
  return techs.map((t) => t.name).join(", ") || "Unknown";
}

function buildPromptText(targetUrl: string, techStackLabel: string, findingsText: string): string {
  return `You are a security remediation agent. A security scan was run on ${targetUrl} and found the issues listed below. The detected technology stack is: ${techStackLabel}.

For each issue, provide the exact configuration change or code fix needed for this technology stack, how to verify the fix worked, and any caveats or side effects.

Issues to fix:
${findingsText}`;
}
