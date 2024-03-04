import zlib from 'node:zlib';
import type { JSONValue } from '@aws-lambda-powertools/commons/types';
import { fromBase64 } from '@aws-lambda-powertools/commons/utils/base64';
import { Functions } from './Functions.js';

const decoder = new TextDecoder('utf-8');

class PowertoolsFunctions extends Functions {
  @Functions.signature({
    argumentsSpecs: [['string']],
  })
  public funcPowertoolsBase64(value: string): string {
    return decoder.decode(fromBase64(value, 'base64'));
  }

  @Functions.signature({
    argumentsSpecs: [['string']],
  })
  public funcPowertoolsBase64Gzip(value: string): string {
    const encoded = fromBase64(value, 'base64');
    const uncompressed = zlib.gunzipSync(encoded);

    return uncompressed.toString();
  }

  @Functions.signature({
    argumentsSpecs: [['string']],
  })
  public funcPowertoolsJson(value: string): JSONValue {
    return JSON.parse(value);
  }
}

export { PowertoolsFunctions };
