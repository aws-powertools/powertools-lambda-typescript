import type {
  Ajv,
  AnySchema,
  AsyncFormatDefinition,
  Format,
  FormatDefinition,
} from 'ajv';

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

/**
 * Options to customize the JSON Schema validation.
 *
 * @param payload - The data to validate.
 * @param schema - The JSON schema for validation.
 * @param envelope - Optional JMESPATH expression to use as envelope for the payload.
 * @param formats - Optional formats for validation.
 * @param externalRefs - Optional external references for validation.
 * @param ajv - Optional Ajv instance to use for validation, if not provided a new instance will be created.
 */
type ValidateParams = {
  /**
   * The data to validate.
   */
  payload: unknown;
  /**
   * The JSON schema for validation.
   */
  schema: AnySchema;
  /**
   * Optional JMESPATH expression to use as envelope for the payload.
   */
  envelope?: string;
  /**
   * Optional formats for validation.
   */
  formats?: Record<
    string,
    Format
    /* | string
    | RegExp
    | FormatDefinition<string>
    | FormatDefinition<number>
    | AsyncFormatDefinition<string>
    | AsyncFormatDefinition<number> */
  >;
  /**
   * Optional external references for validation.
   */
  externalRefs?: AnySchema | AnySchema[];
  /**
   * Optional Ajv instance to use for validation, if not provided a new instance will be created.
   */
  ajv?: Ajv;
};

/**
 * Options to customize the JSON Schema validation.
 *
 * @param inboundSchema - The JSON schema for inbound validation.
 * @param outboundSchema - The JSON schema for outbound validation.
 * @param envelope - Optional JMESPATH expression to use as envelope for the payload.
 * @param formats - Optional formats for validation.
 * @param externalRefs - Optional external references for validation.
 * @param ajv - Optional Ajv instance to use for validation, if not provided a new instance will be created.
 */
interface ValidatorOptions extends Omit<ValidateParams, 'payload' | 'schema'> {
  /**
   * The JSON schema for inbound validation.
   */
  inboundSchema?: AnySchema;
  /**
   * The JSON schema for outbound validation.
   */
  outboundSchema?: AnySchema;
}

export type { ValidateParams, ValidatorOptions };
