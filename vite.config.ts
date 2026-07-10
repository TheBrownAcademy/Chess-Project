import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load local environment variables (including those without VITE_ prefix)
  const env = loadEnv(mode, process.cwd(), '');

  // Populate process.env for @auth/core usage
  process.env.AUTH_SECRET = env.AUTH_SECRET;
  process.env.AUTH_URL = env.AUTH_URL || 'http://localhost:5173/api/auth';
  process.env.AUTH_TRUST_HOST = env.AUTH_TRUST_HOST || 'true';
  process.env.AUTH_GOOGLE_ID = env.AUTH_GOOGLE_ID;
  process.env.AUTH_GOOGLE_SECRET = env.AUTH_GOOGLE_SECRET;
  process.env.NODE_ENV = process.env.NODE_ENV || (mode === 'production' ? 'production' : 'development');

  return {
    plugins: [
      react(),
      {
        name: 'vite-plugin-authjs-middleware',
        configureServer(server) {
          // Intercept all authentication endpoints
          server.middlewares.use(async (req, res, next) => {
            if (!req.url) {
              return next();
            }

            const protocol = req.headers['x-forwarded-proto'] || 'http';
            const host = req.headers.host || 'localhost:5173';
            const fullUrl = new URL(req.url, `${protocol}://${host}`);
            const parts = fullUrl.pathname.split('/');
            const action = parts[3];
            const validActions = [
              'providers',
              'session',
              'csrf',
              'signin',
              'signout',
              'callback',
              'verify-request',
              'error',
              'webauthn-options',
            ];

            if (parts[1] === 'api' && parts[2] === 'auth' && validActions.includes(action)) {
              const method = req.method || 'GET';

              // Redirect GET requests for provider-specific sign-in back to the homepage.
              // Provider-specific sign-in requires a CSRF POST request; direct GET triggers an error in Auth.js.
              if (method === 'GET' && action === 'signin' && parts[4]) {
                res.statusCode = 302;
                res.setHeader('Location', '/');
                res.end();
                return;
              }

              try {
                // Utility to read request body chunks from the Node stream
                const readBody = (incomingReq: any): Promise<Buffer> => {
                  return new Promise((resolve, reject) => {
                    const chunks: any[] = [];
                    incomingReq.on('data', (chunk: any) => chunks.push(chunk));
                    incomingReq.on('end', () => resolve(Buffer.concat(chunks)));
                    incomingReq.on('error', reject);
                  });
                };

                // Read request body if this is a mutating request (e.g. signin/signout form posts)
                const body = ['GET', 'HEAD'].includes(method) ? undefined : await readBody(req);

                // Convert Node headers to Web API Headers
                const webHeaders = new Headers();
                for (const [key, value] of Object.entries(req.headers)) {
                  if (value !== undefined) {
                    if (Array.isArray(value)) {
                      value.forEach((val) => webHeaders.append(key, val));
                    } else {
                      webHeaders.append(key, value);
                    }
                  }
                }

                // Construct a standard Web API Request
                const webRequest = new Request(fullUrl.toString(), {
                  method,
                  headers: webHeaders,
                  body: body ? new Uint8Array(body) : undefined,
                });

                // Dynamically import handleAuthRequest so that process.env credentials are fully loaded
                const { handleAuthRequest } = await import('./src/auth');

                // Execute the @auth/core request handler
                const webResponse = await handleAuthRequest(webRequest);

                // Map standard response parameters back to Node's ServerResponse
                res.statusCode = webResponse.status;
                res.statusMessage = webResponse.statusText;

                // Write headers (specifically dealing with multiple set-cookie values)
                webResponse.headers.forEach((value, key) => {
                  if (key.toLowerCase() === 'set-cookie') {
                    // Node res.setHeader handles arrays of cookies to output multiple Set-Cookie headers
                    const setCookieHeader = (webResponse.headers as any).getSetCookie
                      ? (webResponse.headers as any).getSetCookie()
                      : webResponse.headers.get('set-cookie')?.split(', ') || [];
                    res.setHeader('Set-Cookie', setCookieHeader);
                  } else {
                    res.setHeader(key, value);
                  }
                });

                // Write response body streams if present
                if (webResponse.body) {
                  const reader = webResponse.body.getReader();
                  while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    res.write(value);
                  }
                }
                res.end();
              } catch (err) {
                console.error('Error handling authentication request in Vite middleware:', err);
                res.statusCode = 500;
                res.end('Internal Server Error');
              }
            } else {
              // Not an auth endpoint; forward to next middleware
              next();
            }
          });
        },
      },
    ],
  };
});
