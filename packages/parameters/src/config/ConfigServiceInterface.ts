interface ConfigServiceInterface {
  get?(name: string): string;

  getServiceName(): string;

  getParametersMaxAge(): number | undefined;

  getSSMDecrypt(): string;
}

export { ConfigServiceInterface };
