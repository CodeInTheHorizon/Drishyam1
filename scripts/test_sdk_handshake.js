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

async function getAccessToken(creds) {
    return new Promise((resolve, reject) => {
        const bodyData = `client_id=${creds.clientId}&client_secret=${creds.clientSecret}&refresh_token=${creds.refreshToken}&grant_type=refresh_token`;
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
                    resolve(parsed.access_token);
                } catch (e) {
                    reject(new Error('Failed to parse token response: ' + body));
                }
            });
        });
        req.on('error', reject);
        req.write(bodyData);
        req.end();
    });
}

async function makeHandshake(token, projectId, orgId) {
    const baseHeaders = {
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Accept": "application/vnd.catalyst.v2+json",
        "CATALYST-ORG": orgId,
        "User-Agent": "zcatalyst-cli/1.27.0"
    };

    const makeReq = (path) => new Promise((res) => {
        https.get({
            hostname: "api.catalyst.zoho.in",
            port: 443,
            path: path,
            headers: baseHeaders
        }, (response) => {
            let body = '';
            response.on('data', chunk => body += chunk);
            response.on('end', () => res(response.statusCode));
        });
    });

    console.log("Handshake 1: /orgs...", await makeReq("/baas/v1/orgs"));
    console.log(`Handshake 2: /project/${projectId}...`, await makeReq(`/baas/v1/project/${projectId}`));
    console.log(`Handshake 3: /project/${projectId}/environment...`, await makeReq(`/baas/v1/project/${projectId}/environment`));
}

async function main() {
    const localCreds = tryGetLocalCliCredentials();
    process.env.X_ZOHO_CATALYST_CONSOLE_URL = 'https://api.catalyst.zoho.' + localCreds.dc;
    process.env.X_ZOHO_CATALYST_ACCOUNTS_URL = 'https://accounts.zoho.' + localCreds.dc;
    process.env.X_ZOHO_CATALYST_ORG_ID = '60077759371';
    
    console.log("Getting OAuth token...");
    const token = await getAccessToken(localCreds);
    console.log("OAuth token acquired.");

    console.log("Executing Handshake calls...");
    await makeHandshake(token, "56116000000017001", "60077759371");

    const catalyst = require('zcatalyst-sdk-node');
    const app = catalyst.initializeApp({
        project_id: '56116000000017001',
        project_key: '56116000000017001',
        environment: 'Development',
        credential: catalyst.credential.refreshToken({
            client_id: localCreds.clientId,
            client_secret: localCreds.clientSecret,
            refresh_token: localCreds.refreshToken
        })
    });

    console.log("Now calling SDK getAllRows()...");
    try {
        const rows = await app.datastore().table('State').getAllRows();
        console.log("getAllRows SUCCESS! Count:", rows.length);
    } catch (e) {
        console.error("getAllRows failed:", e.message);
    }
}

main().catch(console.error);
