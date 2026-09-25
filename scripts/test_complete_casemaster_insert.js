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
        "User-Agent": "zcatalyst-cli/1.27.0"
    };

    console.log("Executing session handshakes...");
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: "/baas/v1/orgs", method: "GET", headers: baseHeaders });
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: `/baas/v1/project/${projectId}`, method: "GET", headers: baseHeaders });
    await makeApiRequest({ hostname: "api.catalyst.zoho.in", port: 443, path: `/baas/v1/project/${projectId}/environment`, method: "GET", headers: baseHeaders });

    const fullCaseMasterRow = {
        CaseMasterID: 20261001,
        CrimeNo: "FIR/2026/00101",
        CaseNo: "202600101",
        CrimeRegisteredDate: "2026-07-21",
        PolicePersonID: "38079000000029002",
        PoliceStationID: "38079000000023002",
        CaseCategoryID: "38079000000030001",
        GravityOffenceID: "38079000000031001",
        CrimeMajorHeadID: "38079000000025004",
        CrimeMinorHeadID: "38079000000033001",
        CaseStatusID: "38079000000032001",
        CourtID: "38079000000025003",
        IncidentFromDate: "2026-07-20 10:00:00",
        IncidentToDate: "2026-07-21 11:30:00",
        InfoReceivedPSDate: "2026-07-21 12:00:00",
        latiutude: 12.9716,
        longitude: 77.5946,
        BriefFacts: "Test FIR registered via platform form directly into Zoho Catalyst Cloud Datastore."
    };

    console.log("Inserting CaseMaster row...");
    const payload = JSON.stringify([fullCaseMasterRow]);
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

    console.log("CaseMaster Insert Status:", res.status);
    console.log("CaseMaster Insert Response:", res.body);

    console.log("\nReading CaseMaster rows online...");
    const getRes = await makeApiRequest({
        hostname: "api.catalyst.zoho.in",
        port: 443,
        path: `/baas/v1/project/${projectId}/table/CaseMaster/row`,
        method: "GET",
        headers: baseHeaders
    });
    console.log("CaseMaster Read Response:", getRes.body);
}

main().catch(console.error);
