import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { getAllItemsHandler } from '../src/get-all-items';
import { getByIdHandler } from '../src/get-by-id';
import { putItemHandler } from '../src/put-item';

test('CDK code synthesize', () => {
  expect(getAllItemsHandler({} as APIGatewayProxyEvent, {} as Context)).toThrow(
    'getAllItems only accepts GET method, you tried: undefined'
  );
});

test('CDK code synthesize', () => {
  expect(getByIdHandler({} as APIGatewayProxyEvent, {} as Context)).toThrow(
    'getByIdHandler only accepts GET method, you tried: undefined'
  );
});

test('CDK code synthesize', () => {
  expect(putItemHandler({} as APIGatewayProxyEvent, {} as Context)).toThrow(
    'putItemHandler only accepts POST method, you tried: undefined'
  );
});