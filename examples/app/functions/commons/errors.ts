class ItemNotFound extends Error {
  public constructor(message: string) {
    super(message);
    this.name = 'ItemNotFound';
  }
}

export { ItemNotFound };
