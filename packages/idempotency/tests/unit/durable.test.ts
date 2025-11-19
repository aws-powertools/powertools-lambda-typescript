import { DurableContext, withDurableExecution } from "@aws/durable-execution-sdk-js"
import { LocalDurableTestRunner } from "@aws/durable-execution-sdk-js-testing"
import { makeIdempotent } from "src/makeIdempotent.js"
import { PersistenceLayerTestClass } from "tests/helpers/idempotencyUtils.js";
import { describe, beforeAll, afterAll, it, expect, vi } from "vitest"

const mockIdempotencyOptions = {
  persistenceStore: new PersistenceLayerTestClass(),
};

beforeAll(()=> LocalDurableTestRunner.setupTestEnvironment())
afterAll(()=> LocalDurableTestRunner.teardownTestEnvironment())

describe("Given a durable function using the idempotency utility", ()=> {
  it("allows an execution with a replay",async ()=> {

    const handlerFunction = withDurableExecution(async (event, context: DurableContext) => {
      // Awaiting the testing sdk to implement this function
        (context as any).lambdaContext = {
          getRemainingTimeInMillis:  vi.fn(() => 300000) // 5 minutes,
      }

      const inner = makeIdempotent(
        async (event, context: DurableContext) => {
          try {
            await context.wait('wait step', { seconds: 5 });
            return { statusCode: 200 };
          } catch (error) {
            console.error(error)
            return { statusCode: 400, message: error }
          }
        },
        mockIdempotencyOptions,
      )
      return inner(event, context)
    })


    const runner = new LocalDurableTestRunner({handlerFunction, skipTime: true})
    const payload = {"key":"value"}
    const execution = await runner.run({payload})

    const result = execution.getResult()
    expect(result).toEqual({statusCode: 200})
  })

})
