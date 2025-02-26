import type Ajv from 'ajv';

export interface ValidateParams<T = unknown> {
  payload: unknown;
  schema: object;
  envelope?: string;
  formats?: Record<
    string,
    | string
    | RegExp
    | { type?: string; validate: (data: string) => boolean; async?: boolean }
  >;
  externalRefs?: object[];
  ajv?: Ajv;
}
