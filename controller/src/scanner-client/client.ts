import type { JobPublic, JobListResponse } from "@pentegent/shared";

export class ScannerUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScannerUnavailableError";
  }
}

export class RateLimitedError extends Error {
  public readonly runningJobId: string;
  constructor(runningJobId: string) {
    super("A scan is already running");
    this.name = "RateLimitedError";
    this.runningJobId = runningJobId;
  }
}

export class ScannerApiError extends Error {
  public readonly statusCode: number;
  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ScannerApiError";
    this.statusCode = statusCode;
  }
}

export class ScannerClient {
  constructor(private readonly baseUrl: string) {}

  async health(): Promise<{ ok: boolean }> {
    const res = await this.fetch("/health");
    return res.json() as Promise<{ ok: boolean }>;
  }

  async createScan(
    targetId: string,
    profileId: string,
    requestedBy: string,
  ): Promise<JobPublic> {
    const res = await this.fetch("/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetId, profileId, requestedBy }),
    });

    if (res.status === 429) {
      const body = (await res.json()) as { runningJobId: string };
      throw new RateLimitedError(body.runningJobId);
    }

    if (!res.ok) {
      const body = await res.text();
      throw new ScannerApiError(res.status, body);
    }

    return res.json() as Promise<JobPublic>;
  }

  async getJob(jobId: string): Promise<JobPublic> {
    const res = await this.fetch(`/jobs/${jobId}`);
    if (!res.ok) {
      throw new ScannerApiError(res.status, await res.text());
    }
    return res.json() as Promise<JobPublic>;
  }

  async listJobs(
    limit = 10,
    offset = 0,
  ): Promise<JobListResponse> {
    const res = await this.fetch(
      `/jobs?limit=${limit}&offset=${offset}`,
    );
    if (!res.ok) {
      throw new ScannerApiError(res.status, await res.text());
    }
    return res.json() as Promise<JobListResponse>;
  }

  private async fetch(
    path: string,
    init?: RequestInit,
  ): Promise<Response> {
    try {
      return await globalThis.fetch(`${this.baseUrl}${path}`, init);
    } catch (err) {
      throw new ScannerUnavailableError(
        `Scanner at ${this.baseUrl} is unavailable: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}
