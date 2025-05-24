// biome-ignore lint/suspicious/noExplicitAny: We intentionally use `any` here to represent any type of data and keep the logger is as flexible as possible.
type Anything = any;

/**
 * Interface for a generic logger object.
 */
type GenericLogger = {
  trace?: (...content: Anything[]) => void;
  debug: (...content: Anything[]) => void;
  info?: (...content: Anything[]) => void;
  warn: (...content: Anything[]) => void;
  error: (...content: Anything[]) => void;
};

export type { Anything, GenericLogger };
