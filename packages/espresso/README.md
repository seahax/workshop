# @seahax/espresso

A lightweight, type-safe Node.js HTTP server framework with routing, filtering, and error handling.

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
  - [Application](#application)
  - [Routes](#routes)
  - [Controllers](#controllers)
  - [Request Handling](#request-handling)
  - [Response Handling](#response-handling)
  - [Filters](#filters)
  - [Error Handlers](#error-handlers)
  - [Body Parsers](#body-parsers)
  - [Health Check Routes](#health-check-routes)
  - [Info Routes](#info-routes)
  - [SPA Routes](#spa-routes)
  - [Connect Middleware](#connect-middleware)
  - [Server Lifecycle](#server-lifecycle)
- [API Reference](#api-reference)
  - [Application](#application-1)
  - [Controller](#controller)
  - [Route](#route)
  - [Request](#request)
  - [Response](#response)
  - [Utilities](#utilities)

## Installation

```bash
npm install @seahax/espresso
```

## Quick Start

```typescript
import { createApplication } from '@seahax/espresso';

const app = createApplication();

app.addRoute('GET', '/', (request, response) => {
  response.sendJson({ message: 'Hello, World!' });
});

app.listen({ port: 3000 });
```

## Core Concepts

### Application

The main entry point for creating HTTP servers with routing, filtering, and error handling.

```typescript
import { createApplication } from '@seahax/espresso';

const app = createApplication({
  headers: { 'x-powered-by': 'espresso' },
  compression: true
});
```

### Routes

Define how HTTP requests are handled based on method and path patterns.

```typescript
import { createRoute } from '@seahax/espresso';

// Inline route definition
app.addRoute('GET', '/users/{id}', async (request, response) => {
  const { id } = await request.pathParameters();
  response.sendJson({ userId: id });
});

// Pre-defined route
const userRoute = createRoute('GET', '/users/{id}', async (request, response) => {
  const { id } = await request.pathParameters();
  response.sendJson({ userId: id });
});
app.addRoute(userRoute);

// Multiple methods and paths
app.addRoute(['GET', 'POST'], ['/api/users/{id}', '/users/{id}'], (request, response) => {
  const { id } = await request.pathParameters();
  response.sendJson({ userId: id });
});

// Multi-segment route parameter
app.addRoute('GET', '/files/{path+}', async (request, response) => {
  const { path } = await request.pathParameters();
  response.sendJson({ filePath: path });
});
```

### Controllers

Group related routes, filters, and error handlers with optional path prefixes.

```typescript
import { createController } from '@seahax/espresso';

const apiController = createController('/api');

apiController.addRoute('GET', '/users', (request, response) => {
  response.sendJson({ users: [] });
});

apiController.addRoute('POST', '/users', async (request, response) => {
  const userData = await request.body();
  response.sendJson({ created: true });
});

app.addController(apiController);
// Routes are now available at /api/users
```

### Request Handling

Access request data with built-in validation support.

```typescript
app.addRoute('POST', '/users/{id}', async (request, response) => {
  // Path parameters (from route like /users/{id})
  const pathParams = await request.pathParameters();
  // With schema validation (requires @standard-schema compatible schema)
  // const validatedPathParams = await request.pathParameters(pathParamsSchema);
  
  // Query parameters
  const queryParams = await request.queryParameters();
  // With schema validation
  // const validatedQueryParams = await request.queryParameters(queryParamsSchema);
  
  // Headers
  const headers = await request.headers();
  // With schema validation
  // const validatedHeaders = await request.headers(headersSchema);
  
  // Cookies
  const cookies = await request.cookies();
  // With schema validation
  // const validatedCookies = await request.cookies(cookiesSchema);
  
  // Request body (parsed based on content-type)
  const body = await request.body();
  // With schema validation
  // const validatedBody = await request.body(bodySchema);
  
  response.sendJson({ success: true });
});
```

### Response Handling

Send different types of responses with built-in compression and caching support.

```typescript
app.addRoute('GET', '/api/data', async (request, response) => {
  // Text/HTML response
  response.send('Hello, World!');

  // JSON response
  response.sendJson({ data: 'value' });
  
  // File response
  response.sendFile('/public', 'index.html');
  
  // Set status code
  response.setStatus(201).sendJson({ created: true });
  
  // Set headers
  response
    .setHeader('cache-control', 'max-age=3600')
    .sendJson({ data: 'cached' });
});
```

### Filters

Apply middleware-like logic to requests before they reach route handlers.

```typescript
import { createFilter } from '@seahax/espresso';

// Authentication filter
const authFilter = createFilter(async (request, response) => {
  const { authorization } = await request.headers();

  if (!authorization) {
    response.setStatus(401).sendJson({ error: 'Unauthorized' });
    // Response sent, route handler won't be called
  }
});

app.addFilter(authFilter);
```

### Error Handlers

Handle errors thrown by filters or route handlers.

```typescript
import { createErrorHandler, RequestValidationError } from '@seahax/espresso';

const errorHandler = createErrorHandler(async ({ error, request, response }) => {
  console.error('Request error:', error);
  
  if (!response.sent) {
    response.setStatus(500).sendJson({ 
      error: 'Internal Server Error',
      message: error.message 
    });
  }
});

// Error handler that skips remaining handlers for specific errors
const validationErrorHandler = createErrorHandler(async ({ error, request, response, skipRemainingHandlers }) => {
  if (error instanceof RequestValidationError) {
    response.setStatus(400).sendJson({ 
      error: 'Request Validation Error',
      issues: error.issues 
    });
    
    // Skip remaining error handlers since we've handled this error
    skipRemainingHandlers();
  }
});

app.addErrorHandler(validationErrorHandler);
app.addErrorHandler(errorHandler); // This won't run for RequestValidationErrors
```

### Body Parsers

Handle different content types in request bodies. By default, espresso includes parsers for:
- `application/json` and `default` - JSON parsing
- `application/x-www-form-urlencoded` - URL-encoded form data
- `text/plain` - Plain text

```typescript
import { parseJson, parseText, parseUrlEncoded } from '@seahax/espresso';

// Add custom parser for XML
app.addParser('application/xml', async (body) => {
  // Parse XML string to object
  return parseXml(body);
});

// Disable JSON parsing (including as the default)
app.addParser(['application/json', 'default'], false);
```

### Health Check Routes

Create health check endpoints with automatic status monitoring.

```typescript
import { createHealthRoute } from '@seahax/espresso';

const healthRoute = createHealthRoute({
  database: async () => {
    // Return true if database is healthy
    return await checkDatabaseConnection();
  },
  redis: {
    check: async () => await checkRedisConnection(),
    intervalSeconds: 60,
    initialDelaySeconds: 10
  }
}, {
  path: '/health',
  onCheck: (name, result, error) => {
    if (!result) {
      console.error(`Health check ${name} failed:`, error);
    }
  }
});

app.addRoute(healthRoute);
```

### Info Routes

Create application info endpoints with caching and conditional responses.

```typescript
import { createInfoRoute } from '@seahax/espresso';

// Custom path and options
const apiInfoRoute = createInfoRoute({
  name: 'My API',
  version: '1.0.0',
  build: process.env.BUILD_ID
}, {
  // defaults to /_info
  path: '/api/info',
});

app.addRoute(apiInfoRoute);
// Available at GET /api/info
```

### SPA Routes

Create routes for serving single-page applications with fallback handling.

```typescript
import { createSpaRoute } from '@seahax/espresso';

// Basic SPA route
const spaRoute = createSpaRoute('/public');
app.addRoute(spaRoute);

// SPA with custom path and options
const spaRoute = createSpaRoute('/admin-dist', {
  path: '/app',
  index: 'index.html',
  headers: (filename) => ({
    'cache-control': filename.startsWith('assets/') ? 'max-age=86400' : 'no-cache'
  })
});
app.addRoute(spaRoute);
```

### Connect Middleware

Use existing Connect middleware.

```typescript
import helmet from 'helmet';

app.addMiddleware(helmet());
```

### Server Lifecycle

Control server startup and shutdown.

```typescript
const app = createApplication();

// Basic listen
const server = app.listen({ port: 3000 });

// Listen with custom server
import { createServer } from 'https';
const httpsServer = createServer(sslOptions);
app.listen({ 
  server: httpsServer, 
  port: 443,
  onListening: (url, server) => {
    console.log(`Server running at ${url}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  app.close();
});

// Listen for events
app.on('listening', (url, server) => {
  console.log(`Server started at ${url}`);
});

app.on('closing', () => {
  console.log('Server close method called');
});

app.on('close', () => {
  console.log('Server closed');
});
```

## API Reference

### Application

- `createApplication(options?)` - Create a new application instance
- `app.addRoute(route)` - Add a pre-defined route
- `app.addRoute(method, path, handler)` - Add a route inline  
- `app.addController(controller)` - Add a controller
- `app.addFilter(filter)` - Add a request filter
- `app.addErrorHandler(handler)` - Add an error handler
- `app.addParser(contentType, parser)` - Add a body parser
- `app.addMiddleware(middleware)` - Add Connect-style middleware
- `app.addDefaultHandler(handler)` - Add a fallback handler
- `app.listen(options?)` - Start the server
- `app.close()` - Stop the server

### Controller

- `createController(prefix?)` - Create a controller with optional path prefix
- `controller.addRoute(...)` - Add routes (same API as application)
- `controller.addController(controller)` - Add nested controllers
- `controller.addFilter(filter)` - Add controller-scoped filters
- `controller.addErrorHandler(handler)` - Add controller-scoped error handlers
- `controller.addMiddleware(middleware)` - Add controller-scoped middleware

### Route

- `createRoute(method, path, handler)` - Create a route definition
- `createHealthRoute(checks, options?)` - Create health check route
- `createInfoRoute(info, options?)` - Create info endpoint route
- `createSpaRoute(root, options?)` - Create single-page application route

### Request

- `request.pathParameters(schema?)` - Get path parameters
- `request.queryParameters(schema?)` - Get query parameters  
- `request.headers(schema?)` - Get headers
- `request.cookies(schema?)` - Get cookies
- `request.body(schema?)` - Get parsed body
- `request.method` - HTTP method
- `request.path` - Request path
- `request.url` - Full URL
- `request.protocol` - 'http' or 'https'

### Response  

- `response.send(body?, options?)` - Send response
- `response.sendJson(body, options?)` - Send JSON response
- `response.sendFile(root, filename, options?)` - Send file
- `response.setStatus(code)` - Set status code
- `response.setHeader(name, value)` - Set header
- `response.setHeaders(headers)` - Set multiple headers
- `response.sent` - Whether response has been sent
- `response.finished` - Whether response is finished

### Utilities

- `createFilter(fn)` - Create a filter function
- `createErrorHandler(fn)` - Create an error handler function
- `parseJson(body)` - Parse JSON body
- `parseText(body)` - Parse text body  
- `parseUrlEncoded(body)` - Parse URL encoded body
