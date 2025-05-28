class ResolverNotFoundException extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ResolverNotFoundException';
  }
}

export { ResolverNotFoundException };
