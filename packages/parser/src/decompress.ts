import { gunzipSync } from 'node:zlib';
import { getMaxDecompressedSize } from '@aws-lambda-powertools/commons/utils/env';
import type { RefinementCtx } from 'zod';

/**
 * Decompress gzip data, stopping at the maximum decompressed size - see
 * {@link getMaxDecompressedSize | `getMaxDecompressedSize()`}.
 *
 * When the data expands past the limit, an issue is added to the parsing context
 * and `undefined` is returned. Any other decompression error is thrown.
 *
 * @param data - the gzip data to decompress
 * @param ctx - the context of the schema being parsed
 *
 * @internal
 */
const decompressGzip = (
  data: Uint8Array,
  ctx: RefinementCtx
): string | undefined => {
  const maxOutputLength = getMaxDecompressedSize();
  try {
    return gunzipSync(data, { maxOutputLength }).toString('utf8');
  } catch (error) {
    if ((error as { code?: string }).code !== 'ERR_BUFFER_TOO_LARGE') {
      throw error;
    }
    ctx.addIssue({
      code: 'custom',
      message: `Decompressed data exceeds the maximum size of ${maxOutputLength} bytes, set POWERTOOLS_MAX_DECOMPRESSED_SIZE to change the limit`,
      fatal: true,
    });

    return undefined;
  }
};

export { decompressGzip };
