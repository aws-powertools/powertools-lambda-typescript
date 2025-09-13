import { Router, cors } from '@aws-lambda-powertools/event-handler/experimental-rest';
// When building the package, this import will work correctly
// import type { RequestContext } from '@aws-lambda-powertools/event-handler/experimental-rest';
import type { Context } from 'aws-lambda/handler';

const app = new Router();

// Dynamic origin configuration with function
app.use(cors({
  origin: (origin?: string) => {
    // Allow requests from trusted domains
    const allowedOrigins = [
      'https://app.mycompany.com',
      'https://admin.mycompany.com',
      'https://staging.mycompany.com',
    ];
    
    // Log the origin for debugging
    console.log('CORS request from:', origin);
    
    // Return boolean: true allows the origin, false denies it
    return origin ? allowedOrigins.includes(origin) : false;
  },
  credentials: true,
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Route-specific CORS for public API
app.get('/public/health', [cors({ origin: '*' })], async () => {
  return { status: 'healthy', timestamp: new Date().toISOString() };
});

// Protected endpoint using global CORS
app.get('/api/user/profile', async () => {
  return { user: 'john_doe', email: 'john@example.com' };
});

export const handler = async (event: unknown, context: Context) => {
  return app.resolve(event, context);
};