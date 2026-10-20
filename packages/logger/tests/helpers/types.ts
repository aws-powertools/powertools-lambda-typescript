export type TestEvent = {
  invocation: number;
};

export type TestOutput = Promise<{ requestId: string }>;
