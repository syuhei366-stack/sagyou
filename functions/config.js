export async function onRequest(context) {
    return new Response(JSON.stringify({
        HA_HOST: context.env.HA_HOST,
        HA_TOKEN: context.env.HA_TOKEN
    }), {
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }
    });
}
