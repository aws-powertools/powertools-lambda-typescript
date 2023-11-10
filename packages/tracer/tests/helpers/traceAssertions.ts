import {
  getFirstSubsegment,
  type AssertAnnotationParams,
  type ParsedDocument,
} from './tracesUtils.js';

export const assertAnnotation = (params: AssertAnnotationParams): void => {
  const {
    annotations,
    isColdStart,
    expectedServiceName,
    expectedCustomAnnotationKey,
    expectedCustomAnnotationValue,
  } = params;

  if (!annotations) {
    fail('annotation is missing');
  }
  expect(annotations['ColdStart']).toEqual(isColdStart);
  expect(annotations['Service']).toEqual(expectedServiceName);
  expect(annotations[expectedCustomAnnotationKey]).toEqual(
    expectedCustomAnnotationValue
  );
};

export const assertErrorAndFault = (
  invocationSubsegment: ParsedDocument,
  expectedCustomErrorMessage: string
): void => {
  expect(invocationSubsegment.error).toBe(true);

  const handlerSubsegment = getFirstSubsegment(invocationSubsegment);
  expect(handlerSubsegment.fault).toBe(true);
  expect(handlerSubsegment.hasOwnProperty('cause')).toBe(true);
  expect(handlerSubsegment.cause?.exceptions[0].message).toBe(
    expectedCustomErrorMessage
  );
};
