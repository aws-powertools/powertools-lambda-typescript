import { DurableContext, withDurableExecution } from "@aws/durable-execution-sdk-js"
import { LocalDurableTestRunner } from "@aws/durable-execution-sdk-js-testing"
import { makeIdempotent } from "src/makeIdempotent.js"
import { PersistenceLayerTestClass } from "tests/helpers/idempotencyUtils.js";
import { describe, beforeAll, afterAll, it, expect } from "vitest"

const mockIdempotencyOptions = {
  persistenceStore: new PersistenceLayerTestClass(),
};

beforeAll(()=> LocalDurableTestRunner.setupTestEnvironment())
afterAll(()=> LocalDurableTestRunner.teardownTestEnvironment())

describe("Given a durable function using the idempotency utility", ()=> {
  it("Allows a replayed execution",async ()=> {

    const handlerFunction = withDurableExecution(
        makeIdempotent(
            async (event, context: DurableContext) => {
                console.log({ event, context });
                console.log('starting function');

                await context.wait('wait step', { seconds: 10 });

                console.log('Reached second step');

                const now = new Date().toISOString();
                return { statusCode: 200, message: 'success', now };
            },
            mockIdempotencyOptions,
        ),
    );


    const runner = new LocalDurableTestRunner({handlerFunction})
    const payload = {"key":"value"}
    const execution = await runner.run({payload})
    const result = execution.getResult()
    expect(result).toContain({statusCode: 200})


  })

})
