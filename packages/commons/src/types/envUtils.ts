type GetStringFromEnvOptions = {
  /**
   * The key of the environment variable.
   */
  key: string;
  /**
   * Optional default value to return if the environment variable is not set.
   * @default ""
   */
  defaultValue?: string;
  /**
   * Optional error message to throw if the environment variable is not set and no default value is provided.
   * @default "Environment variable <key> is required"
   */
  errorMessage?: string;
};

type GetNumberFromEnvOptions = {
  /**
   * The key of the environment variable.
   */
  key: string;
  /**
   * The default value to return if the environment variable is not set.
   * @default undefined
   */
  defaultValue?: number;
  /**
   * Optional error message to throw if the environment variable is not set and no default value is provided.
   * @default "Environment variable <key> is required"
   */
  errorMessage?: string;
};

type GetBooleanFromEnvOptions = {
  /**
   * The key of the environment variable.
   */
  key: string;
  /**
   * The default value to return if the environment variable is not set.
   * @default undefined
   */
  defaultValue?: boolean;
  /**
   * Optional error message to throw if the environment variable is not set and no default value is provided.
   * @default "Environment variable <key> is required"
   */
  errorMessage?: string;
};

export type {
  GetStringFromEnvOptions,
  GetNumberFromEnvOptions,
  GetBooleanFromEnvOptions,
};
