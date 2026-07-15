export default async function handler(req, res) {
  // Read backend URL from Vercel environment variables (set per-environment in Vercel dashboard)
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:3000';

  // Extract path after /api
  const path = req.url.replace(/^\/api/, '');
  const targetUrl = `${backendUrl}/api${path}`;

  try {
    let body = undefined;
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      body = typeof req.body === 'object' ? JSON.stringify(req.body) : req.body;
    }

    const headers = { ...req.headers };
    // Remove host header to avoid SSL handshake issues with the backend
    delete headers.host;

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
