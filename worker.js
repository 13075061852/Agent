// Worker: AI Chatbot Proxy (CORS 代理)
// 部署到 Cloudflare Workers，解决浏览器跨域问题

export default {
  async fetch(request, env, ctx) {
    // 处理 CORS 预检
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
      const { accountId, apiToken, model, messages } = await request.json();

      if (!accountId || !apiToken || !model || !messages) {
        return new Response(JSON.stringify({ error: '缺少必要参数' }), {
          status: 400,
          headers: corsHeaders({ 'Content-Type': 'application/json' }),
        });
      }

      // 调用 Cloudflare AI API
      const cfRes = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ messages }),
        }
      );

      const data = await cfRes.json();

      return new Response(JSON.stringify(data), {
        status: cfRes.status,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
      });

    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: corsHeaders({ 'Content-Type': 'application/json' }),
      });
    }
  },
};

function corsHeaders(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    ...extra,
  };
}
