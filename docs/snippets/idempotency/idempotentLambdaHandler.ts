import { idempotentLambdaHandler } from '@aws-lambda-powertools/idempotency';
import { DynamoDBPersistenceLayer } from '@aws-lambda-powertools/idempotency/dynamodb';
import { LambdaInterface } from '@aws-lambda-powertools/commons';
import type { Request, Response, SubscriptionResult } from './types';

const persistenceStore = new DynamoDBPersistenceLayer({
  tableName: 'IdempotencyTable',
});

class Lambda implements LambdaInterface {
  // Decorate your handler class method
  @idempotentLambdaHandler({
    persistenceStore,
  })
  public async handler(event: Request, _context: unknown): Promise<Response> {
    const payment = await this.#createSubscriptionPayment(
      event.user,
      event.productId
    );

    await this.#sendNotification(event.email);

    return {
      paymentId: payment.id,
      statusCode: 200,
    };
  }

  async #createSubscriptionPayment(
    _user: string,
    _product: string
  ): Promise<SubscriptionResult> {
    return {
      id: 'foo',
    };
  }

  async #sendNotification(_email: string): Promise<void> {
    // ...
  }
}

const myFunction = new Lambda();
export const handler = myFunction.handler.bind(myFunction); // (1)
