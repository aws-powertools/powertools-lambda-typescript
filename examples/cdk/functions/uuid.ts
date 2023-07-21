import { randomUUID } from 'node:crypto';

exports.handler = async (_event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(randomUUID()),
  };
};
