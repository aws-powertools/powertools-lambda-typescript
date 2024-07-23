import { getParameter } from '@aws-lambda-powertools/parameters/ssm';
import { handler } from './testingYourCodeFunctionsHandler';

jest.mock('@aws-lambda-powertools/parameters/ssm', () => ({
  getParameter: jest.fn(),
}));
const mockedGetParameter = getParameter as jest.MockedFunction<
  typeof getParameter
>;

describe('Function tests', () => {
  beforeEach(() => {
    mockedGetParameter.mockClear();
  });

  test('it returns the correct response', async () => {
    // Prepare
    mockedGetParameter.mockResolvedValue('my/param');

    // Act
    const result = await handler({}, {});

    // Assess
    expect(result).toEqual({
      value: 'my/param',
    });
  });
});
