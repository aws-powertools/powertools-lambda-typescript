/** Searches a configuration for an embedded Flag Document. */
type EnvelopeSearchFn = (expression: string, data: unknown) => unknown;

/** Configures document selection with both an expression and a search function. @internal */
type EnvelopeOptions =
  | {
      /** Selects an embedded Flag Document with the supplied search function. */
      envelope: string;
      /** Applies the envelope expression to the retrieved configuration. */
      envelopeSearchFn: EnvelopeSearchFn;
    }
  | {
      /** Leaves the retrieved configuration unchanged. */
      envelope?: never;
      /** Omits document selection when no envelope is supplied. */
      envelopeSearchFn?: never;
    };

export type { EnvelopeOptions, EnvelopeSearchFn };
