import { getParameter } from '@aws-lambda-powertools/parameters/ssm';

export const handler = async (
  _event: unknown,
  _context: unknown
): Promise<void> => {
  const valueFromJson = await getParameter('/my/json/parameter', {
    transform: 'json',
  });
  console.log(valueFromJson);
};
