export default async function handler(req, res) {
  // Read backend URL from Vercel environment variables (set per-environment in Vercel dashboard)
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  // Vercel injects the captured :path* segment as a 'path' query param when rewriting to a
  // serverless function. Extract it cleanly to avoid forwarding ?path= to the backend.
  const parsedUrl = new URL(req.url, 'http://placeholder');
  const capturedPath = parsedUrl.searchParams.get('path') || '';
  parsedUrl.searchParams.delete('path'); // strip the vercel-injected param
  const remainingQuery = parsedUrl.search; // preserve any real query params

  const targetUrl = `${backendUrl}/api/${capturedPath}${remainingQuery}`;

  try {
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const headers = { ...req.headers };
    // Remove host header — the backend's hostname, not the user-facing one
    delete headers.host;
    // Forward the user-facing domain so Auth.js builds the correct OAuth callback URL.
    // With trustHost:true, Auth.js reads x-forwarded-host to determine the base URL.
    // Without this, Auth.js would use Railway's internal hostname for the callback URL
    // instead of dev.xlchess.com, causing a redirect_uri mismatch with Google OAuth.
    headers['x-forwarded-host'] = req.headers.host; // e.g. dev.xlchess.com
    headers['x-forwarded-proto'] = 'https';

    const response = await fetch(targetUrl, {
      method: req.method,
      headers: headers,
      body: body,
      redirect: 'manual', // Handle redirects manually (required for Auth.js OAuth flows)
    });

    // Forward all response headers back to the client
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });

    res.status(response.status);

    // For redirect responses (3xx), just end the response with the headers set
    if (response.status >= 300 && response.status < 400) {
      return res.end();
    }

    const responseBody = await response.text();
    res.send(responseBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Vercel API Proxy Error:', message, '| Target:', targetUrl);
    res.status(500).json({ error: 'Proxy failed to connect to backend', detail: message, target: targetUrl });
  }
}
