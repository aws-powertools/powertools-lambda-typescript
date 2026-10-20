/**
 * Minimal TypeScript declaration for the avro-js library, which does not have its own type definitions.
 */
declare module 'avro-js' {
  /**
   * Interface for the parsed Avro type
   */
  interface AvroType {
    /**
     * Deserialize an Avro message from a binary buffer
     *
     * @param buffer - Binary buffer containing Avro-encoded data
     * @returns The deserialized object
     */
    fromBuffer(buffer: Buffer): unknown;
  }

  /**
   * Parse an Avro schema from a JSON string
   *
   * @param schema - Avro schema as a JSON string
   * @returns A parsed Avro type that can be used to serialize and deserialize data
   */
  function parse(schema: string): AvroType;

  // Export the default object with the parse method
  const avro: {
    parse: typeof parse;
  };

  export default avro;
}
