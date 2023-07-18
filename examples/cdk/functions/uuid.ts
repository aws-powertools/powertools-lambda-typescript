import { v4 } from 'uuid';

exports.handler = async (_event) => {
  return {
    statusCode: 200,
    body: JSON.stringify(v4()),
  };
};
