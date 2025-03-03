import type {
  Ajv,
  AnySchema,
  AsyncFormatDefinition,
  FormatDefinition,
} from 'ajv';

type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

type ValidateParams = {
  payload: unknown;
  schema: AnySchema;
  envelope?: string;
  formats?: Record<
    string,
    | string
    | RegExp
    | FormatDefinition<string>
    | FormatDefinition<number>
    | AsyncFormatDefinition<string>
    | AsyncFormatDefinition<number>
  >;
  externalRefs?: object[];
  ajv?: Ajv;
};

type ValidatorOptions = Prettify<
  Omit<ValidateParams, 'payload' | 'schema'> & {
    inboundSchema?: AnySchema;
    outboundSchema?: AnySchema;
  }
>;

export type { ValidateParams, ValidatorOptions };
