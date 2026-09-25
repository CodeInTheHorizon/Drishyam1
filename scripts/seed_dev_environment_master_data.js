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

    const insertOrGetRowId = async (tableName, payload) => {
        const readRes = await makeApiRequest({
            hostname: "api.catalyst.zoho.in",
            port: 443,
            path: `/baas/v1/project/${projectId}/table/${tableName}/row`,
            method: "GET",
            headers: baseHeaders
        });
        try {
            const parsedRead = JSON.parse(readRes.body);
            if (parsedRead.data && parsedRead.data.length > 0) {
                console.log(`[EXISTING] ${tableName}: ROWID = ${parsedRead.data[0].ROWID}`);
                return parsedRead.data[0].ROWID;
            }
        } catch(e) {}

        const bodyStr = JSON.stringify([payload]);
        const insertRes = await makeApiRequest({
            hostname: "api.catalyst.zoho.in",
            port: 443,
            path: `/baas/v1/project/${projectId}/table/${tableName}/row`,
            method: "POST",
            headers: {
                ...baseHeaders,
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(bodyStr)
            }
        }, bodyStr);

        try {
            const parsedInsert = JSON.parse(insertRes.body);
            if (parsedInsert.data && parsedInsert.data[0] && parsedInsert.data[0].ROWID) {
                console.log(`[INSERTED] ${tableName}: ROWID = ${parsedInsert.data[0].ROWID}`);
                return parsedInsert.data[0].ROWID;
            } else {
                console.error(`Failed to insert into ${tableName}:`, insertRes.body);
            }
        } catch(e) {
            console.error(`Error parsing insert response for ${tableName}:`, insertRes.body);
        }
        return null;
    };

    console.log("\n--- Seeding Master Tables in Development Environment ---");
    const rowIds = {};

    rowIds.District = await insertOrGetRowId("District", { DistrictID: 1, DistrictName: "Bengaluru City", Active: true });
    rowIds.Unit = await insertOrGetRowId("Unit", { UnitID: 1, UnitName: "Central Police Station", ParentUnit: 1, Active: true });
    rowIds.Employee = await insertOrGetRowId("Employee", { EmployeeID: 1, KGID: "KSP1001", FirstName: "Inspector Kumar", GenderlD: 1, BloodGroupID: 1 });
    rowIds.CaseCategory = await insertOrGetRowId("CaseCategory", { CaseCategoryID: 1, LookupValue: "General Crime" });
    rowIds.GravityOffence = await insertOrGetRowId("GravityOffence", { GravityOffenceID: 1, LookupValue: "Non-Heinous" });
    rowIds.CaseStatusMaster = await insertOrGetRowId("CaseStatusMaster", { CaseStatusID: 1, CaseStatusName: "Under Investigation" });
    rowIds.Court = await insertOrGetRowId("Court", { CourtID: 1, CourtName: "Chief Metropolitan Magistrate Court", Active: true });
    rowIds.CrimeHead = await insertOrGetRowId("CrimeHead", { CrimeHeadID: 1, CrimeGroupName: "Property Offences", Active: true });
    
    if (rowIds.CrimeHead) {
        rowIds.CrimeSubHead = await insertOrGetRowId("CrimeSubHead", {
            CrimeSubHeadID: 1,
            CrimeHeadID: String(rowIds.CrimeHead),
            CrimeHeadName: "Theft",
            SeqlD: 1
        });
    }

    rowIds.Rank = await insertOrGetRowId("Rank", { RankID: 1, RankName: "PSI (Police Sub-Inspector)", Active: true });
    rowIds.Designation = await insertOrGetRowId("Designation", { DesignationID: 1, DesignationName: "Station House Officer", Active: true });

    console.log("\nDevelopment Master ROWIDs mapping:");
    console.log(JSON.stringify(rowIds, null, 2));

    fs.writeFileSync(path.join(__dirname, 'rowid_mapping.json'), JSON.stringify(rowIds, null, 2));
    console.log("Saved Development rowid_mapping.json successfully.");
}

main().catch(console.error);
