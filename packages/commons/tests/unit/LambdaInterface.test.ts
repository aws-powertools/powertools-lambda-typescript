import { Callback, Context, Handler } from 'aws-lambda';
import { ContextExamples, LambdaInterface } from '../../src';

describe('LambdaInterface', () => {
  test('it compiles', async () => {
    class LambdaFunction implements LambdaInterface {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      public handler<TEvent, TResult>(
        _event: TEvent,
        _context: Context,
        _callback: Callback<TResult>,
      ): void | Promise<TResult> {
        _context.done();
        _context.fail(new Error('test Error'));
        _context.succeed('test succeed');
        _context.getRemainingTimeInMillis();
      }
    }

    await new LambdaFunction().handler({}, ContextExamples.helloworldContext, () => console.log('Lambda invoked!'));
  });
});
