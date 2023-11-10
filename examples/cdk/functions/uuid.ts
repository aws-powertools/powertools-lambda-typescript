import { randomUUID } from 'node:crypto';

exports.handler = async () => {
  return {
    statusCode: 200,
    body: JSON.stringify(randomUUID()),
  };
};
