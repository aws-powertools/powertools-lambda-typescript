/** Thrown when a field path does not match any value in the data. */
export class DataMaskingFieldNotFoundError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DataMaskingFieldNotFoundError';
  }
}

/** Thrown when the options given to an operation cannot be applied as they are. */
export class DataMaskingConfigurationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DataMaskingConfigurationError';
  }
}

/** Thrown when input data contains an unsupported type for the operation. */
export class DataMaskingUnsupportedTypeError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DataMaskingUnsupportedTypeError';
  }
}

/** Thrown when an encryption or decryption operation fails. */
export class DataMaskingEncryptionError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DataMaskingEncryptionError';
  }
}
