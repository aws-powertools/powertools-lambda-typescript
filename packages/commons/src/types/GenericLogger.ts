// biome-ignore lint/suspicious/noExplicitAny: We intentionally use `any` here to represent any type of data and keep the logger is as flexible as possible.
type Anything = any[];

/**
 * Interface for a generic logger object.
 *
 * This interface is used to define the shape of a logger object that can be passed to a Powertools for AWS utility.
 *
 * It can be an instance of Logger from Powertools for AWS, or any other logger that implements the same methods.
 */
export interface GenericLogger {
  trace?: (...content: Anything) => void;
  debug: (...content: Anything) => void;
  info: (...content: Anything) => void;
  warn: (...content: Anything) => void;
  error: (...content: Anything) => void;
}
