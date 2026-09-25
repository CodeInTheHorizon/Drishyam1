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

async function testBulkRead() {
    const creds = tryGetLocalCliCredentials();
    console.log("Fetching token...");
    const token = await getAccessToken(creds);
    console.log("Token received.");
    
    console.log("Waiting 15s for token replication...");
    await new Promise(r => setTimeout(r, 15000));
    
    const projectId = "56116000000017001";
    const body = JSON.stringify({ "table_identifier": "State" });
    
    const options = {
        hostname: "api.catalyst.zoho.in",
        port: 443,
        path: `/baas/v1/project/${projectId}/bulk/read`,
        method: "POST",
        headers: {
            "Authorization": `Zoho-oauthtoken ${token}`,
            "Accept": "application/vnd.catalyst.v2+json",
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(body),
            "PROJECT_ID": projectId,
            "Environment": "Development",
            "X-Catalyst-Environment": "Development",
            "CATALYST-ORG": "60077759371"
        }
    };
    
    console.log("Sending POST bulk/read request...");
    const req = https.request(options, (res) => {
        let resBody = "";
        res.on("data", chunk => resBody += chunk);
        res.on("end", () => {
            console.log("Status:", res.statusCode);
            console.log("Response Body:", resBody);
        });
    });
    req.on("error", (e) => console.error("Req Error:", e));
    req.write(body);
    req.end();
}

testBulkRead();
