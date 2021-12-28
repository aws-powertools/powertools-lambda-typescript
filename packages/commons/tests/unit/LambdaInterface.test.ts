import { Callback, Context } from 'aws-lambda';
import { ContextExamples, LambdaInterface } from '../../src';

describe('LambdaInterface', () => {
  test('it compiles', async () => {
    class LambdaFunction implements LambdaInterface {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      public handler<TEvent, TResult>(
        _event: TEvent,
        context: Context,
        _callback: Callback<TResult>,
      ): void | Promise<TResult> {
        context.done();
        context.fail(new Error('test Error'));
        context.succeed('test succeed');
        context.getRemainingTimeInMillis();
      }
    }

    await new LambdaFunction().handler({}, ContextExamples.helloworldContext, () => console.log('Lambda invoked!'));
  });
});
