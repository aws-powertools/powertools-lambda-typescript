import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';
import { extractDataFromEnvelope } from '@aws-lambda-powertools/jmespath/envelopes';
import { PowertoolsFunctions } from '@aws-lambda-powertools/jmespath/functions';
import { Logger } from '@aws-lambda-powertools/logger';
import { brotliDecompressSync } from 'node:zlib';

const logger = new Logger();

// prettier-ignore
class CustomFunctions extends PowertoolsFunctions {
  @PowertoolsFunctions.signature({ // (1)!
    argumentsSpecs: [['string']],
    variadic: false,
  })
  public funcDecodeBrotliCompression(value: string): string { // (2)!
    const encoded = fromBase64(value, 'base64');
    const uncompressed = brotliDecompressSync(encoded);

    return uncompressed.toString();
  }
}

export const handler = async (event: { payload: string }): Promise<void> => {
  const message = extractDataFromEnvelope<string>(
    event,
    'Records[*].decode_brotli_compression(notification) | [*].powertools_json(@).message',
    { customFunctions: new CustomFunctions() }
  );

  logger.info('Decoded message', { message });
};
