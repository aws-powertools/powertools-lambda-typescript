interface ConfigServiceInterface {
  get(name: string): string;

  getServiceName(): string;

  getFunctionName(): string;

  getIdempotencyEnabled(): boolean;
}

export type { ConfigServiceInterface };
