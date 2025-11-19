import { PersistenceLayerTestClass } from "tests/helpers/idempotencyUtils.js";
import { IdempotencyAlreadyInProgressError, IdempotencyItemAlreadyExistsError } from "../../src/errors.js";
import { IdempotencyRecord } from "../../src/persistence/index.js";
import { IdempotencyRecordStatus } from "../../src/constants.js";
import { describe, beforeAll, it, expect, vi } from "vitest"
import { IdempotencyHandler } from "src/IdempotencyHandler.js";
import { IdempotencyConfig } from "src/IdempotencyConfig.js";

beforeAll(() => {
  vi.clearAllMocks();
  vi.restoreAllMocks();
})




const persistenceStore = new PersistenceLayerTestClass();
const mockFunctionToMakeIdempotent = vi.fn();
const mockFunctionPayloadToBeHashed = {};
const mockIdempotencyOptions = {
  persistenceStore,
  config: new IdempotencyConfig({}),
};

const idempotentHandler = new IdempotencyHandler({
  functionToMakeIdempotent: mockFunctionToMakeIdempotent,
  functionPayloadToBeHashed: mockFunctionPayloadToBeHashed,
  persistenceStore: mockIdempotencyOptions.persistenceStore,
  functionArguments: [],
  idempotencyConfig: mockIdempotencyOptions.config,
});

describe("Given a durable function using the idempotency utility", ()=> {
  it("allows execution when the DurableMode is Replay and there is IN PROGRESS record", async ()=> {
    // Arrange
    // Mock saveInProgress to simulate an existing IN_PROGRESS record
    vi.spyOn(persistenceStore, 'saveInProgress')
      .mockRejectedValueOnce(
        new IdempotencyItemAlreadyExistsError(
          'Record exists',
          new IdempotencyRecord({
            idempotencyKey: 'test-key',
            status: IdempotencyRecordStatus.INPROGRESS,
            expiryTimestamp: Date.now() + 10000,
          })
        )
      );

    // Act
    await idempotentHandler.handle({durableMode: "ReplayMode"})

    // Assess
    expect(mockFunctionToMakeIdempotent).toBeCalled()


  })

  it("raises an IdempotencyAlreadyInProgressError error when the DurableMode is Execution and there is an IN PROGRESS record", async ()=> {
      // Arrange
      // Mock saveInProgress to simulate an existing IN_PROGRESS record
      vi.spyOn(persistenceStore, 'saveInProgress')
        .mockRejectedValueOnce(
          new IdempotencyItemAlreadyExistsError(
            'Record exists',
            new IdempotencyRecord({
              idempotencyKey: 'test-key',
              status: IdempotencyRecordStatus.INPROGRESS,
              expiryTimestamp: Date.now() + 10000,
            })
          )
        );

      // Act & Assess
      await expect(idempotentHandler.handle({ durableMode: "ExecutionMode" })).rejects.toThrow(IdempotencyAlreadyInProgressError);
  })

  it("returns the result of the original durable execution when another durable execution with the same payload is invoked", async () => {

    // Arrange
    vi.spyOn(
      persistenceStore,
      'saveInProgress'
    ).mockRejectedValue(new IdempotencyItemAlreadyExistsError());

    const stubRecord = new IdempotencyRecord({
      idempotencyKey: 'idempotencyKey',
      expiryTimestamp: Date.now() + 10000,
      inProgressExpiryTimestamp: 0,
      responseData: { response: false },
      payloadHash: 'payloadHash',
      status: IdempotencyRecordStatus.COMPLETED,
    });
    const getRecordSpy = vi
      .spyOn(persistenceStore, 'getRecord')
      .mockResolvedValue(stubRecord);

    // Act
    const result = await idempotentHandler.handle({durableMode: "ExecutionMode"})

    // Assess
    expect(result).toStrictEqual({ response: false });
    expect(getRecordSpy).toHaveBeenCalledTimes(1);
    expect(getRecordSpy).toHaveBeenCalledWith(mockFunctionPayloadToBeHashed);

  })
})
