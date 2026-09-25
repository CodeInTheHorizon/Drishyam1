const https = require('https');

function makeApiRequest(options) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    const token = "1000.baf75603ef65971da72a9c52b6d14e2d.6df9a5e1108c3564d60aefccac3c1b40";
    const projectId = "56116000000017001";
    const orgId = "60077759371";
    
    const hsHeaders = {
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Accept": "application/vnd.catalyst.v2+json",
        "CATALYST-ORG": orgId,
        "User-Agent": "zcatalyst-cli/1.27.0"
    };

    console.log("Testing user token...");
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: "/baas/v1/orgs", method: "GET", headers: hsHeaders });
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: `/baas/v1/project/${projectId}`, method: "GET", headers: hsHeaders });
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: `/baas/v1/project/${projectId}/environment`, method: "GET", headers: hsHeaders });

    const res = await makeApiRequest({
        hostname: "api.catalyst.zoho.in",
        port: 443,
        path: `/baas/v1/project/${projectId}/table`,
        method: "GET",
        headers: hsHeaders
    });

    console.log("Status:", res.status);
    console.log("Body:", res.body);
}

main().catch(console.error);
