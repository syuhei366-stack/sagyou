// Cloudflare Pages Function to proxy Home Assistant API requests
export async function onRequest(context) {
    const { request, env } = context;

    // Get the route from the URL
    const url = new URL(request.url);
    const route = url.pathname.replace('/api/', '');

    // Home Assistant API URL - use environment variable or default
    const HA_HOST = env.HA_HOST || 'homeassistant-c79dr.taila92268.ts.net';
    const HA_URL = `https://${HA_HOST}`;
    const HA_TOKEN = env.HA_TOKEN;

    if (!HA_TOKEN) {
        return new Response(JSON.stringify({ error: 'HA_TOKEN not configured' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    if (!HA_HOST) {
        return new Response(JSON.stringify({ error: 'HA_HOST not configured' }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        });
    }

    try {
        // Forward the request to Home Assistant
        const haResponse = await fetch(`${HA_URL}/api/${route}`, {
            method: request.method,
            headers: {
                'Authorization': `Bearer ${HA_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await haResponse.json();

        return new Response(JSON.stringify(data), {
            status: haResponse.status,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}
