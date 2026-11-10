import type { StandardSchemaV1 } from '@standard-schema/spec';

/** Identifies an issue message that must never appear in an error message. */
const secretIssueMessage = 'validator-secret-5905';

/** Supplies mixed path segments without exposing the offending value. */
const schemaIssues: ReadonlyArray<StandardSchemaV1.Issue> = [
  { message: secretIssueMessage, path: ['settings', { key: 'theme' }, 0] },
];

/** Creates a minimal Standard Schema with a caller-supplied validator. */
const createSchema = <Input, Output>(
  validate: StandardSchemaV1<Input, Output>['~standard']['validate']
): StandardSchemaV1<Input, Output> => ({
  '~standard': { version: 1, vendor: 'test', validate },
});

/** Validates a theme and adds a field to prove callers receive the output. */
const validateSettings = (
  value: unknown
): StandardSchemaV1.Result<{ theme: string; validated: boolean }> => {
  if (
    typeof value === 'object' &&
    value !== null &&
    'theme' in value &&
    typeof value.theme === 'string' &&
    value.theme !== 'invalid-value-secret'
  ) {
    return { value: { theme: value.theme, validated: true } };
  }
  return { issues: schemaIssues };
};

/** Validates settings synchronously and transforms the output. */
const settingsSchema = createSchema<
  { theme: string },
  { theme: string; validated: boolean }
>(validateSettings);

/** Validates settings asynchronously and transforms the output. */
const asyncSettingsSchema = createSchema<
  { theme: string },
  { theme: string; validated: boolean }
>(async (value) => validateSettings(value));

/** Accepts a primitive fallback and a structured result to replace primitive checks. */
const flexibleSchema = createSchema<
  string | { theme: string },
  { theme: string }
>((value) => ({
  value: { theme: typeof value === 'string' ? value : 'dark' },
}));

/** Transforms string input into numeric output. */
const numberSchema = createSchema<string, number>((value) => ({
  value: Number(value),
}));

/** Transforms string input into non-JSON Date output. */
const dateSchema = createSchema<string, Date>((value) => ({
  value: new Date(String(value)),
}));

/** Creates a dishonest validator that returns undefined for the selected input. */
const createUndefinedOutputSchema = (input: string) =>
  createSchema<string, string>((value): StandardSchemaV1.Result<string> => {
    if (value === input) {
      // @ts-expect-error Test validators that violate their declared output type.
      return { value: undefined };
    }
    return { value: String(value) };
  });

export {
  asyncSettingsSchema,
  createSchema,
  createUndefinedOutputSchema,
  dateSchema,
  flexibleSchema,
  numberSchema,
  schemaIssues,
  secretIssueMessage,
  settingsSchema,
};
