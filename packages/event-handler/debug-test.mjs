import { Router } from './lib/esm/rest/index.js';

const app = new Router();

console.log('Test 1: Simple route without validation');
app.post('/simple', async () => ({ statusCode: 200 }));

console.log('\nTest 2: Route with validation');
app.post('/validated', async () => ({ statusCode: 201 }), {
  validation: { req: { body: { '~standard': { version: 1, vendor: 'test', validate: () => ({ value: {} }) } } } }
});

console.log('\nDone - if no errors, routes registered successfully');
