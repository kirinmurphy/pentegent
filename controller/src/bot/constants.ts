export const INPUT_ALL = "all" as const;

export const IDENTIFIER_TYPE = {
  JOB_ID: "jobId",
  TARGET_ID: "targetId",
  URL: "url",
  UNKNOWN: "unknown",
} as const;

export const DELETION_TYPE = {
  JOB: "job",
  TARGET: "target",
  ALL: "all",
} as const;
