declare function createVideoStream(): Readable;

import type { Readable } from 'node:stream';
import {
  Router,
  streamify,
} from '@aws-lambda-powertools/event-handler/experimental-rest';

const app = new Router();

app.get('/video-stream', async (reqCtx) => {
  reqCtx.res.headers.set('content-type', 'video/mp4');
  return createVideoStream();
});

app.get('/hello', () => {
  return { message: 'Hello World' };
});

export const handler = streamify(app);
