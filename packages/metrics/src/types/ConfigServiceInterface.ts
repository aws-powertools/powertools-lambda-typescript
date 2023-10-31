interface ConfigServiceInterface {
  get?(name: string): string;
  getNamespace(): string;
  getServiceName(): string;
}

export type { ConfigServiceInterface };
