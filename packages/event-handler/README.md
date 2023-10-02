# event-handler

Minimalistic event handler & HTTP router for Serverless applications

## Simple Example

```typescript
// Import API Gateway Event handler
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { ApiGatewayResolver } from './ApiGateway';
import { AsyncFunction, BaseProxyEvent, JSONData } from 'types';

// Initialize the event handler
const app = new ApiGatewayResolver();

// Define a route
const helloHandler = 
async (_event: BaseProxyEvent, _context: Context) : Promise<JSONData> => Promise.resolve({ message: 'Hello World' });

// Register Route
app.addRoute('GET', '/v1/hello', helloHandler as AsyncFunction) ;

// Declare your Lambda handler
// Declare your Lambda handler
exports.handler = (
  _event: APIGatewayProxyEvent,
  _context: Context
): Promise<JSONData> => 
  // Resolve routes
  app.resolve(_event, _context)
;
```

## Register Route with Decorators

```typescript
import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { ApiGatewayResolver } from './ApiGateway';
import { BaseProxyEvent, JSONData } from 'types';

// Initialize the event handler
const app = new ApiGatewayResolver();

// Define a Controller class
export class HelloController{

  // Register a route
  @app.get('/v1/hello')
  public hello (_event: BaseProxyEvent, _context: Context) : Promise<JSONData> {
    return Promise.resolve({ message: 'Hello World' });
  }
  
  @app.post('/v1/hello')
  public postHello (_event: BaseProxyEvent, _context: Context) : Promise<JSONData> {
    return Promise.resolve({ message: 'Resource created' });
  }
  
}

// Declare your Lambda handler
exports.handler = (
  _event: APIGatewayProxyEvent,
  _context: Context
): Promise<JSONData> => 
  // Resolve routes
  app.resolve(_event, _context)
;

```

## CORS Support

```typescript
// Import API Gateway Event handler
import { CORSConfig } from 'types';
import { ApiGatewayResolver, ProxyEventType } from './ApiGateway';

// App with CORS Configurattion
const app = new ApiGatewayResolver(
  ProxyEventType.APIGatewayProxyEvent,
  new CORSConfig()
);

```

