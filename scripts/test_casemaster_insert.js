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

async function testCaseMasterInsert() {
    const creds = tryGetLocalCliCredentials();
    const token = await getAccessToken(creds);
    
    const projectId = "56116000000017001";
    const orgId = "60077759371";
    const baseHeaders = {
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Accept": "application/vnd.catalyst.v2+json",
        "CATALYST-ORG": orgId,
        "User-Agent": "zcatalyst-cli/1.27.0"
    };

    console.log("Handshakes...");
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: "/baas/v1/orgs", method: "GET", headers: baseHeaders });
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: `/baas/v1/project/${projectId}`, method: "GET", headers: baseHeaders });
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: `/baas/v1/project/${projectId}/environment`, method: "GET", headers: baseHeaders });

    const caseMasterRow = {
        CaseMasterID: 20261001,
        CrimeNo: "FIR/2026/00101",
        CaseNo: "202600101",
        CrimeRegisteredDate: "2026-07-21",
        OccurrenceDateFrom: "2026-07-20",
        OccurrenceDateTo: "2026-07-21",
        PoliceStationID: 1,
        PolicePersonID: 1,
        CrimeHeadID: 1,
        CrimeSubHeadID: 1,
        CaseStatusID: 1,
        GravityOffenceID: 1,
        CourtID: 1,
        PlaceOfOccurrence: "M.G. Road, Bengaluru",
        FIRType: "General",
        firContents: "Test FIR submitted through platform form directly to Zoho Catalyst Datastore."
    };

    console.log("Inserting CaseMaster row...");
    const payload = JSON.stringify([caseMasterRow]);
    const res = await makeApiRequest({
        hostname: "api.catalyst.zoho.in",
        port: 443,
        path: `/baas/v1/project/${projectId}/table/CaseMaster/row`,
        method: "POST",
        headers: {
            ...baseHeaders,
            "Content-Type": "application/json",
            "Content-Length": Buffer.byteLength(payload)
        }
    }, payload);

    console.log("CaseMaster Insert Response Status:", res.status);
    console.log("CaseMaster Insert Response Body:", res.body);

    console.log("\nReading CaseMaster rows...");
    const getRes = await makeApiRequest({
        hostname: "api.catalyst.zoho.in",
        port: 443,
        path: `/baas/v1/project/${projectId}/table/CaseMaster/row`,
        method: "GET",
        headers: baseHeaders
    });

    console.log("CaseMaster Read Response Status:", getRes.status);
    console.log("CaseMaster Read Response Body:", getRes.body);
}

testCaseMasterInsert().catch(console.error);
