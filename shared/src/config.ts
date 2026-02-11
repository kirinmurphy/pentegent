export interface ScannerConfig {
  port: number;
  host: string;
  dbPath: string;
  reportsDir: string;
  workerPollIntervalMs: number;
  heartbeatIntervalMs: number;
  staleHeartbeatThresholdMs: number;
}

export interface ControllerConfig {
  telegramBotToken: string;
  telegramAllowedUserId: string;
  scannerBaseUrl: string;
  pollIntervalMs: number;
  pollTimeoutMs: number;
}
