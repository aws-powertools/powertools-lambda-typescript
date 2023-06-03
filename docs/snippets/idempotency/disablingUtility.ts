import { handler } from './testingYourCodeFunction';

describe('Function tests', () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterAll(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  test('it returns the correct response', async () => {
    // Prepare
    process.env.POWERTOOLS_IDEMPOTENCY_DISABLED = 'true';

    // Act
    const result = await handler({}, {});

    // Assess
    expect(result).toStrictEqual({
      paymentId: 12345,
      message: 'success',
      statusCode: 200,
    });
  });
});
