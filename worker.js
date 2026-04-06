export default {
  async fetch(request, env, ctx) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }
    try {
      const { accountId, apiToken, model, messages, stream } = await request.json();
      if (!accountId || !apiToken || !model || !messages) {
        return new Response(JSON.stringify({ error: '缺少必要参数' }), {
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
        });
      }
      const body = { messages };
      if (stream) body.stream = true;

      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        }
      );

      if (stream && cfRes.ok && cfRes.body) {
        const ct = cfRes.headers.get('content-type') || '';
        if (ct.includes('json') && !ct.includes('stream') && !ct.includes('ndjson')) {
          const data = await cfRes.json();
          return new Response(JSON.stringify(data), {
            status: cfRes.status,
            headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          });
        }
        return new Response(cfRes.body, {
          status: cfRes.status,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': ct || 'text/event-stream',
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
          },
        });
      }

      const data = await cfRes.json();
      return new Response(JSON.stringify(data), {
        status: cfRes.status,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
      });
    }
  },
};
