const path = require('path');
const fs = require('fs');
const os = require('os');
const crypto = require('crypto');
const https = require('https');

function tryGetLocalCliCredentials() {
    const homedir = os.homedir();
    const baseDir = path.join(homedir, 'Library/Preferences/zcatalyst-cli-nodejs');
    const keyPath = path.join(baseDir, '.zcatalyst-cli-key');
    const configPath = path.join(baseDir, 'zcatalyst-cli-v1.json');
    
    const encryptionKey = fs.readFileSync(keyPath);
    const configRaw = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configRaw);
    
    const activeDc = config.active_dc || 'us';
    const dcConfig = config[activeDc];
    const encrypted = dcConfig.credential;
    const data = Buffer.from(encrypted, 'hex');
    const initializationVector = data.slice(0, 12);
    const authTag = data.slice(13, 29);
    const cipherText = data.slice(29);
    
    const derivedKey = crypto.pbkdf2Sync(encryptionKey, initializationVector, 100000, 32, 'sha512');
    const decipher = crypto.createDecipheriv('aes-256-gcm', derivedKey, initializationVector);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(cipherText), decipher.final()]);
    const credObj = JSON.parse(decrypted.toString());
    
    return {
        dc: activeDc,
        clientId: '1000.D5IIHDXSPN2MII26AD0V61I6RMVSNM',
        clientSecret: '02ee875ecfc50573e5cc8d62916ad3077be20d0f42',
        refreshToken: credObj.token.slice(2)
    };
}

async function getFreshAccessToken() {
    const creds = tryGetLocalCliCredentials();
    const bodyData = `client_id=${creds.clientId}&client_secret=${creds.clientSecret}&refresh_token=${creds.refreshToken}&grant_type=refresh_token`;
    
    return new Promise((resolve, reject) => {
        const options = {
            hostname: `accounts.zoho.${creds.dc}`,
            port: 443,
            path: '/oauth/v2/token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(bodyData)
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.access_token) resolve(parsed.access_token);
                    else reject(new Error(body));
                } catch(e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(bodyData);
        req.end();
    });
}

function makeApiRequest(options, postData) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
        });
        req.on('error', reject);
        if (postData) req.write(postData);
        req.end();
    });
}

async function main() {
    const token = await getFreshAccessToken();
    const projectId = "56116000000017001";
    const orgId = "60077759371";
    const baseHeaders = {
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Accept": "application/vnd.catalyst.v2+json",
        "CATALYST-ORG": orgId,
        "environment": "Development",
        "User-Agent": "zcatalyst-cli/1.27.0"
    };

    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: "/baas/v1/orgs", method: "GET", headers: baseHeaders });
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: `/baas/v1/project/${projectId}`, method: "GET", headers: baseHeaders });
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: `/baas/v1/project/${projectId}/environment`, method: "GET", headers: baseHeaders });

    console.log("Inserting Medhavi and Kartik with DistrictID: 56116000000043001...");

    const payload = [
        {
            EmployeeID: 2026991,
            KGID: "KSP-2026-MEDHAVI",
            FirstName: "Medhavi",
            DistrictID: "56116000000043001"
        },
        {
            EmployeeID: 2026992,
            KGID: "KSP-2026-KARTIK",
            FirstName: "Kartik",
            DistrictID: "56116000000043001"
        }
    ];

    const bodyStr = JSON.stringify(payload);
    const insertRes = await makeApiRequest({
        hostname: "api.catalyst.zoho.in",
        port: 443,
        path: `/baas/v1/project/${projectId}/table/Employee/row`,
        method: "POST",
        headers: {
            ...baseHeaders,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(bodyStr)
        }
    }, bodyStr);

    console.log("Development Insert Status:", insertRes.status);
    console.log("Development Insert Response:", insertRes.body);

    console.log("\nReading all rows from Development Environment...");
    const verifyRes = await makeApiRequest({
        hostname: "api.catalyst.zoho.in",
        port: 443,
        path: `/baas/v1/project/${projectId}/table/Employee/row`,
        method: "GET",
        headers: baseHeaders
    });
    console.log("Development Employee Rows:", verifyRes.body);
}

main().catch(console.error);
