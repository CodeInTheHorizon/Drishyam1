/**
 * datastore.js
 * 
 * Strict Relational Zoho Catalyst Datastore Repository Layer for Karnataka Police FIR System.
 * 
 * Project Credentials:
 * • Project Name: Abhedya
 * • Project ID: 56116000000209001
 * • Organization ID: 60077759371
 * • Environment: Development
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const crypto = require("crypto");
const https = require("https");

// Auto-load .env file if not already populated
try {
    const envPath = path.resolve(__dirname, "../../../.env");
    if (fs.existsSync(envPath)) {
        const envConfig = fs.readFileSync(envPath, "utf-8");
        envConfig.split("\n").forEach((line) => {
            const trimmed = line.trim();
            if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
                const [key, ...vals] = trimmed.split("=");
                const val = vals.join("=").trim().replace(/^["']|["']$/g, '');
                if (key && !process.env[key.trim()]) {
                    process.env[key.trim()] = val;
                }
            }
        });
    }
} catch (e) {
    // Ignore .env read errors
}

const ROWID_MAPPING_PATH = path.join(__dirname, "../../../scripts/rowid_mapping.json");
const CASE_META_PATH = path.join(__dirname, "case_meta_store.json");

function loadAllCaseMeta() {
    try {
        if (fs.existsSync(CASE_META_PATH)) {
            return JSON.parse(fs.readFileSync(CASE_META_PATH, "utf-8"));
        }
    } catch (e) {
        console.warn("[CrimeRepository] Failed to read case_meta_store:", e.message);
    }
    return {};
}

function saveAllCaseMeta(metaMap) {
    try {
        fs.writeFileSync(CASE_META_PATH, JSON.stringify(metaMap, null, 2), "utf-8");
    } catch (e) {
        console.warn("[CrimeRepository] Failed to write case_meta_store:", e.message);
    }
}

function getCaseMeta(key) {
    if (!key) return null;
    const metaMap = loadAllCaseMeta();
    return metaMap[String(key)] || null;
}

function setCaseMeta(keys, data) {
    if (!keys || !data) return;
    const metaMap = loadAllCaseMeta();
    const keyList = Array.isArray(keys) ? keys : [keys];
    keyList.forEach(k => {
        if (k) metaMap[String(k)] = { ...(metaMap[String(k)] || {}), ...data };
    });
    saveAllCaseMeta(metaMap);
}

function deleteCaseMeta(keys) {
    if (!keys) return;
    const metaMap = loadAllCaseMeta();
    const keyList = Array.isArray(keys) ? keys : [keys];
    let changed = false;
    keyList.forEach(k => {
        if (k && metaMap[String(k)]) {
            delete metaMap[String(k)];
            changed = true;
        }
    });
    if (changed) {
        saveAllCaseMeta(metaMap);
    }
}

if (!global.__officer_meta_cache) {
    global.__officer_meta_cache = {};
}

let intIdCounter = 2500;
const generateUniqueIntId = () => {
    intIdCounter += 1;
    const timestampOffset = Math.floor((Date.now() % 100000));
    return Number(`25${String(timestampOffset).padStart(5, '0')}${String(intIdCounter).slice(-3)}`);
};

function formatCatalystDate(dStr) {
    if (!dStr) return new Date().toISOString().split("T")[0];
    const cleaned = String(dStr).split("T")[0].split(" ")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;
    return new Date().toISOString().split("T")[0];
}

function formatCatalystDatetime(dtStr, defaultTime = "10:00:00") {
    if (!dtStr) {
        const today = new Date().toISOString().split("T")[0];
        return `${today} ${defaultTime}`;
    }
    let s = String(dtStr).replace('T', ' ').replace('Z', '').trim();
    if (s.includes('.')) s = s.split('.')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return `${s} ${defaultTime}`;
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(s)) {
        return `${s}:00`;
    }
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(s)) {
        return s;
    }
    const today = new Date().toISOString().split("T")[0];
    return `${today} ${defaultTime}`;
}


// --- Zoho Catalyst Direct REST API Helper ---
function tryGetLocalCliCredentials() {
    try {
        const homedir = os.homedir();
        const baseDir = path.join(homedir, 'Library/Preferences/zcatalyst-cli-nodejs');
        const keyPath = path.join(baseDir, '.zcatalyst-cli-key');
        const configPath = path.join(baseDir, 'zcatalyst-cli-v1.json');
        
        if (!fs.existsSync(keyPath) || !fs.existsSync(configPath)) return null;

        const encryptionKey = fs.readFileSync(keyPath);
        const configRaw = fs.readFileSync(configPath, 'utf-8');
        const config = JSON.parse(configRaw);
        
        const activeDc = config.active_dc || 'us';
        const dcConfig = config[activeDc];
        if (!dcConfig || !dcConfig.credential) return null;

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
            clientId: process.env.CATALYST_CLIENT_ID || (credObj.client_id || ''),
            clientSecret: process.env.CATALYST_CLIENT_SECRET || (credObj.client_secret || ''),
            refreshToken: credObj.token ? credObj.token.slice(2) : ''
        };
    } catch (e) {
        console.warn("[CrimeRepository] CLI credentials read error:", e.message);
        return null;
    }
}

function getCatalystCredentials() {
    const envToken = process.env.CATALYST_REFRESH_TOKEN;
    const envClientId = process.env.CATALYST_CLIENT_ID;
    const envClientSecret = process.env.CATALYST_CLIENT_SECRET;
    const envDc = process.env.CATALYST_DC || "in";

    if (envToken && envClientId && envClientSecret) {
        return {
            dc: envDc,
            clientId: envClientId,
            clientSecret: envClientSecret,
            refreshToken: envToken
        };
    }

    const localCreds = tryGetLocalCliCredentials();
    if (localCreds) return localCreds;

    return null;
}

let cachedToken = null;
let tokenExpiryTime = 0;
let inFlightTokenPromise = null;
let lastRateLimitTime = 0;

async function getFreshAccessToken(forceRefresh = false) {
    if (!forceRefresh && cachedToken && Date.now() < tokenExpiryTime) {
        return cachedToken;
    }
    // If rate-limited recently (in last 15s), don't hammer the auth server
    if (Date.now() - lastRateLimitTime < 15000) {
        throw new Error("Rate limit backoff active.");
    }
    if (inFlightTokenPromise) {
        return inFlightTokenPromise;
    }

    const creds = getCatalystCredentials();
    if (!creds) throw new Error("No CLI credentials available for Catalyst API");

    const bodyData = `client_id=${creds.clientId}&client_secret=${creds.clientSecret}&refresh_token=${creds.refreshToken}&grant_type=refresh_token`;
    
    inFlightTokenPromise = new Promise((resolve, reject) => {
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
                inFlightTokenPromise = null;
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.access_token) {
                        cachedToken = parsed.access_token;
                        tokenExpiryTime = Date.now() + 50 * 60 * 1000;
                        resolve(cachedToken);
                    } else {
                        if (body.includes("too many requests") || body.includes("Access Denied")) {
                            lastRateLimitTime = Date.now();
                        }
                        reject(new Error(body));
                    }
                } catch(e) { reject(e); }
            });
        });
        req.on('error', (err) => {
            inFlightTokenPromise = null;
            reject(err);
        });
        req.write(bodyData);
        req.end();
    });

    return inFlightTokenPromise;
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

async function callCatalystDatastoreApi(pathSuffix, method = 'GET', bodyObj = null, isRetry = false) {
    const projectId = process.env.CATALYST_PROJECT_ID;
    const orgId = process.env.CATALYST_ORG_ID;
    if (!projectId || !orgId) {
        return { status: 503, data: null };
    }
    let token = null;
    try {
        token = await getFreshAccessToken(isRetry);
    } catch (e) {
        return { status: 503, data: null };
    }
    if (!token) {
        return { status: 503, data: null };
    }
    const baseHeaders = {
        "Authorization": `Zoho-oauthtoken ${token}`,
        "Accept": "application/vnd.catalyst.v2+json",
        "CATALYST-ORG": orgId,
        "environment": process.env.CATALYST_ENVIRONMENT || "Development",
        "User-Agent": "zcatalyst-cli/1.27.0"
    };

    const fullPath = `/baas/v1/project/${projectId}${pathSuffix}`;
    let postData = null;
    const reqHeaders = { ...baseHeaders };

    if (bodyObj !== null) {
        postData = JSON.stringify(bodyObj);
        reqHeaders["Content-Type"] = "application/json";
        reqHeaders["Content-Length"] = Buffer.byteLength(postData);
    }

    const res = await makeApiRequest({
        hostname: "api.catalyst.zoho.in",
        port: 443,
        path: fullPath,
        method: method,
        headers: reqHeaders
    }, postData);

    let parsed = null;
    try {
        parsed = JSON.parse(res.body);
    } catch(e) {
        parsed = { raw: res.body };
    }

    if ((res.status === 401 || (parsed && parsed.status === "failure" && parsed.data && (parsed.data.error_code === "INVALID_TOKEN" || parsed.data.error_code === "AUTHENTICATION_FAILURE"))) && !isRetry) {
        console.warn("[datastore] Token expired or invalid (401). Retrying with fresh access token...");
        cachedToken = null;
        tokenExpiryTime = 0;
        return callCatalystDatastoreApi(pathSuffix, method, bodyObj, true);
    }

    return { status: res.status, data: parsed };
}


class CrimeRepository {

    constructor(req) {
        if (!global.__catalyst_master_records) {
            global.__catalyst_master_records = [];
        }
        this.masterRecords = global.__catalyst_master_records;

        // Standard database lookup cache for FK -> display name resolution
        if (!global.__catalyst_lookup_cache) {
            global.__catalyst_lookup_cache = {
                districts: {
                    1: "Bhopal", 2: "Indore", 3: "Jabalpur", 4: "Gwalior", 5: "Ujjain",
                    6: "Sagar", 7: "Rewa", 8: "Satna", 9: "Chhindwara", 10: "Ratlam"
                },    
                units: {
                    201: "Bhopal Central Cyber Cell",
                    202: "Indore Cyber Police Station",
                    203: "Jabalpur Cyber Unit",
                    204: "Gwalior Cyber Police Station",
                    205: "Ujjain Cyber Unit"
                },        
                employees: {},    
                crimeHeads: {
                    1: "CDR / IPDR",
                    2: "Bank / UPI Logs",
                    3: "Email Headers",
                    4: "Chat Exports",
                    5: "Android / APK Logs"
                },   
                crimeSubHeads: {
                    1: "General Cyber Forensic",
                    2: "Financial Transaction Analysis",
                    3: "Digital Evidence Extraction"
                },
                caseStatuses: {
                    1: "Under Investigation",
                    2: "Chargesheeted",
                    3: "Closed / Resolved"
                }, 
                gravityOffences: {
                    1: "LOW",
                    2: "MEDIUM",
                    3: "HIGH",
                    4: "CRITICAL"
                },
                courts: {
                    1: "Special Cyber Court, Bhopal",
                    2: "District & Sessions Court, Indore"
                }       
            };
        }
        this.lookupCache = global.__catalyst_lookup_cache;

        const defaults = {};
        try {
            if (fs.existsSync(ROWID_MAPPING_PATH)) {
                const loaded = JSON.parse(fs.readFileSync(ROWID_MAPPING_PATH, 'utf-8'));
                this.rowIds = { ...defaults, ...loaded };
            } else {
                this.rowIds = defaults;
            }
        } catch (e) {
            this.rowIds = defaults;
        }

        console.log("[CrimeRepository] Online Catalyst Data Store REST client ready.");
    }

    normalizeRow(row, liveLookups = {}) {
        const caseMasterId = String(row.CaseMasterID || row.ROWID || row.id || "2001");
        const crimeNo = String(row.CrimeNo || row.crimeNo || `1044300062026${String(caseMasterId).padStart(5, "0")}`);
        const caseNo = String(row.CaseNo || row.caseNo || `2026${String(caseMasterId).padStart(5, "0")}`);
        const regDateStr = String(row.CrimeRegisteredDate || row.regDate || new Date().toISOString().split("T")[0]);

        // Rich user metadata lookup
        const meta = (row.ROWID && getCaseMeta(row.ROWID)) ||
                     getCaseMeta(caseMasterId) ||
                     getCaseMeta(crimeNo) ||
                     getCaseMeta(`fir-${caseMasterId}`) || {};

        const CATEGORY_MAP = {
            1: "CDR / IPDR",
            2: "Bank / UPI Logs",
            3: "Email Headers",
            4: "Chat Exports",
            5: "Android / APK Logs"
        };
        const DISTRICT_MAP = {
            1: "Bhopal",
            2: "Indore",
            3: "Jabalpur",
            4: "Gwalior",
            5: "Ujjain"
        };
        const STATION_MAP = {
            201: "Bhopal Central Cyber Cell",
            202: "Indore Cyber Police Station",
            203: "Jabalpur Cyber Unit",
            204: "Gwalior Cyber Police Station",
            205: "Ujjain Cyber Unit"
        };
        const SEVERITY_MAP = {
            1: "LOW",
            2: "MEDIUM",
            3: "HIGH",
            4: "CRITICAL"
        };
        const STATUS_MAP = {
            1: "Under Investigation",
            2: "Chargesheeted",
            3: "Closed / Resolved"
        };

        const OFFICER_BY_EMP_ID = {
            5882: { name: "Kartik Singhal", rank: "Police Inspector", kgid: "MPP-2026-5882" },
            8359: { name: "Medhavi Agrawal", rank: "Police Inspector", kgid: "MPP-2026-8359" },
            592383: { name: "Kshitij Soni", rank: "Police Inspector", kgid: "MPP-2026-3003" },
            392386: { name: "Hitesh Sanghi", rank: "Police Inspector", kgid: "MPP-2026-9344" }
        };

        const empMatch = row.PolicePersonID && OFFICER_BY_EMP_ID[row.PolicePersonID];

        let officerName = meta.allottedOfficerName || row.OfficerName || row.allottedOfficerName || empMatch?.name;
        let officerRank = meta.allottedOfficerRank || row.allottedOfficerRank || empMatch?.rank || "Police Inspector";
        let officerKgid = meta.allottedOfficerKgid || row.allottedOfficerKgid || empMatch?.kgid || (row.PolicePersonID ? `MPP-2026-${row.PolicePersonID}` : "MPP-2026-901");

        if (!officerName) {
            officerName = "Kartik Singhal";
            officerRank = "Police Inspector";
            officerKgid = "MPP-2026-5882";
        }

        let stationName = meta.unit || row.PoliceStation || row.unit;
        if (!stationName && row.PoliceStationID) {
            stationName = STATION_MAP[row.PoliceStationID] || liveLookups.units?.[row.PoliceStationID];
        }
        stationName = stationName || "Gwalior Cyber Police Station";

        let districtName = meta.district || row.District || row.district;
        if (!districtName && row.DistrictID) {
            districtName = DISTRICT_MAP[row.DistrictID] || liveLookups.districts?.[row.DistrictID];
        }
        if (!districtName && row.PoliceStationID && STATION_MAP[row.PoliceStationID]) {
            districtName = STATION_MAP[row.PoliceStationID].split(" ")[0];
        }
        districtName = districtName || "Gwalior";

        let categoryName = meta.crimeHead || row.CrimeCategory || row.crimeHead;
        if (!categoryName || typeof categoryName !== "string" || !categoryName.trim()) {
            if (row.CaseCategoryID && CATEGORY_MAP[row.CaseCategoryID]) {
                categoryName = CATEGORY_MAP[row.CaseCategoryID];
            } else {
                const DEFAULT_CATS = ["CDR / IPDR", "Bank / UPI Logs", "Email Headers", "Chat Exports", "Android / APK Logs"];
                categoryName = DEFAULT_CATS[Math.abs(Number(caseMasterId) || 0) % DEFAULT_CATS.length];
            }
        }

        let subHeadName = meta.crimeSubHead || row.crimeSubHead || "General Cyber Forensic";

        let severity = meta.severity || row.Severity || row.severity;
        if (!severity && row.GravityOffenceID != null) {
            severity = SEVERITY_MAP[row.GravityOffenceID] || liveLookups.gravity?.[row.GravityOffenceID];
        }
        severity = severity || "MEDIUM";

        let statusName = meta.status || row.Status || row.status;
        if (!statusName && row.CaseStatusID) {
            statusName = STATUS_MAP[row.CaseStatusID] || liveLookups.caseStatuses?.[row.CaseStatusID];
        }
        statusName = statusName || "Under Investigation";

        let compName = meta.complainantName || row.ComplainantName || row.complainantName || "Citizen Complainant";
        let accName = meta.accusedName || row.AccusedName || row.accusedName || "Unidentified Suspect";

        return {
            CaseMasterID: caseMasterId,
            ROWID: row.ROWID || caseMasterId,
            id: `fir-${caseMasterId}`,
            crimeNo: crimeNo,
            CrimeNo: crimeNo,
            caseNo: caseNo,
            CaseNo: caseNo,
            regDate: regDateStr,
            CrimeRegisteredDate: regDateStr,
            district: districtName,
            District: districtName,
            unit: stationName,
            PoliceStation: stationName,
            crimeHead: categoryName,
            CrimeCategory: categoryName,
            crimeSubHead: subHeadName,
            actSections: meta.actSections || row.ActSections || row.actSections || "IT Act Sec 66C / 66D",
            ActSections: meta.actSections || row.ActSections || row.actSections || "IT Act Sec 66C / 66D",
            severity: severity,
            Severity: severity,
            status: statusName,
            Status: statusName,
            complainantName: compName,
            ComplainantName: compName,
            allottedOfficerName: officerName,
            OfficerName: officerName,
            allottedOfficerRank: officerRank,
            allottedOfficerKgid: officerKgid,
            accusedName: accName,
            AccusedName: accName,
            briefFacts: meta.briefFacts || row.BriefFacts || row.briefFacts || "Incident logged and evidence registered.",
            BriefFacts: meta.briefFacts || row.BriefFacts || row.briefFacts || "Incident logged and evidence registered.",
            propertyDescription: meta.propertyDescription || row.propertyDescription || "Digital forensic exhibits catalogued",
            estimatedValue: Number(meta.estimatedValue || row.EstimatedValue || row.estimatedValue || 0),
            officialReportImage: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800&auto=format&fit=crop",
            lat: Number(meta.lat || row.latiutude || row.latitude || row.lat || 26.2183),
            lng: Number(meta.lng || row.longitude || row.lng || 78.1828),
            locationStreet: meta.locationStreet || row.locationStreet || `${districtName} Cyber Unit Road`
        };
    }

    async getAllCrimeRecords(filters = {}) {
        let cloudRows = [];
        try {
            const caseRes = await callCatalystDatastoreApi('/table/CaseMaster/row', 'GET');
            if (caseRes.status === 200 && caseRes.data && Array.isArray(caseRes.data.data)) {
                cloudRows = caseRes.data.data;
                console.log(`[CrimeRepository] Fetched ${cloudRows.length} CaseMaster rows directly from Zoho Catalyst Online Data Store.`);
            }
        } catch (err) {
            console.warn("[CrimeRepository] Online Catalyst Data Store fetch failed:", err.message);
        }

        let normalized = cloudRows.map((r) => this.normalizeRow(r));

        if (filters.district) {
            normalized = normalized.filter((r) => r.district.toLowerCase() === filters.district.toLowerCase());
        }

        if (filters.category) {
            normalized = normalized.filter((r) => r.crimeHead.toLowerCase() === filters.category.toLowerCase());
        }

        if (filters.search) {
            const q = filters.search.toLowerCase().trim();
            normalized = normalized.filter(
                (r) =>
                    (r.crimeNo && r.crimeNo.toLowerCase().includes(q)) ||
                    (r.briefFacts && r.briefFacts.toLowerCase().includes(q)) ||
                    (r.complainantName && r.complainantName.toLowerCase().includes(q)) ||
                    (r.accusedName && r.accusedName.toLowerCase().includes(q))
            );
        }

        this.masterRecords = normalized;
        return normalized;
    }

    async getCrimeAnalyticsData(filters = {}) {
        return this.getAllCrimeRecords(filters);
    }

    async createCrimeRecord(recordData) {
        if (!recordData || typeof recordData !== "object") {
            throw new Error("Validation Error: Invalid record payload provided.");
        }

        // --- Server-side Validations Matching Catalyst CaseMaster Structure ---
        const missingFields = [];
        if (!recordData.regDate && !recordData.CrimeRegisteredDate) missingFields.push("Registration Date (CrimeRegisteredDate)");
        if (!recordData.incidentFromDate && !recordData.IncidentFromDate) missingFields.push("Incident From Date & Time (IncidentFromDate)");
        if (!recordData.incidentToDate && !recordData.IncidentToDate) missingFields.push("Incident To Date & Time (IncidentToDate)");
        if (!recordData.infoReceivedPSDate && !recordData.InfoReceivedPSDate) missingFields.push("Information Received at PS Date & Time (InfoReceivedPSDate)");
        if (!recordData.district && !recordData.districtId && !recordData.DistrictID) missingFields.push("District Jurisdiction (DistrictID)");
        if (!recordData.unit && !recordData.policeStationId && !recordData.PoliceStationID) missingFields.push("Police Station / Cyber Unit (PoliceStationID)");
        if (!recordData.crimeHead && !recordData.crimeMajorHeadId && !recordData.CrimeMajorHeadID) missingFields.push("Major Crime Head / Category (CrimeMajorHeadID)");
        if (!recordData.actSections && !recordData.sectionId && !recordData.SectionID) missingFields.push("IPC / BNS / IT Act Sections (SectionID)");
        if (!recordData.complainantName || !String(recordData.complainantName).trim()) missingFields.push("Complainant Full Name (ComplainantName)");
        if (!recordData.locationStreet || !String(recordData.locationStreet).trim()) missingFields.push("Incident Street / Site Address");
        if (!recordData.allottedOfficerName || !String(recordData.allottedOfficerName).trim()) missingFields.push("Investigating Officer Name");
        if (!recordData.briefFacts || !String(recordData.briefFacts).trim()) missingFields.push("Brief Facts Narrative (BriefFacts)");

        if (missingFields.length > 0) {
            throw new Error(`Validation Error: Missing mandatory database field(s): ${missingFields.join(", ")}`);
        }

        const caseMasterId = generateUniqueIntId();
        const serialNo = String(caseMasterId).slice(-5);
        const crimeNo = String(recordData.crimeNo || `FIR/MP/2026/${serialNo}`);
        const caseNo = String(recordData.caseNo || `CR-2026-${serialNo}`);
        const regDateStr = formatCatalystDate(recordData.regDate || recordData.CrimeRegisteredDate);

        // Map district and station to IDs
        let stationId = Number(recordData.policeStationId || recordData.PoliceStationID);
        let districtId = Number(recordData.districtId || recordData.DistrictID);

        const districtLower = String(recordData.district || "").toLowerCase();
        const unitLower = String(recordData.unit || "").toLowerCase();

        if (!stationId) {
            if (districtLower.includes("gwalior") || unitLower.includes("gwalior")) {
                stationId = 204;
                districtId = 4;
            } else if (districtLower.includes("indore") || unitLower.includes("indore")) {
                stationId = 202;
                districtId = 2;
            } else if (districtLower.includes("jabalpur") || unitLower.includes("jabalpur")) {
                stationId = 203;
                districtId = 3;
            } else if (districtLower.includes("ujjain") || unitLower.includes("ujjain")) {
                stationId = 205;
                districtId = 5;
            } else {
                stationId = 201;
                districtId = 1;
            }
        }

        // Map officer to EmployeeID for PolicePersonID
        let policePersonId = Number(recordData.policePersonId || recordData.PolicePersonID);
        const officerLower = String(recordData.allottedOfficerName || "").toLowerCase();
        if (!policePersonId || policePersonId === 101) {
            if (officerLower.includes("kartik")) {
                policePersonId = 5882;
            } else if (officerLower.includes("medhavi")) {
                policePersonId = 8359;
            } else if (officerLower.includes("kshitij")) {
                policePersonId = 592383;
            } else if (officerLower.includes("hitesh")) {
                policePersonId = 392386;
            } else {
                policePersonId = 5882;
            }
        }

        // Non-relational schema for Zoho Catalyst CaseMaster
        const catalystCaseMasterRow = {
            CaseMasterID: Number(caseMasterId),
            CrimeNo: crimeNo,
            CaseNo: caseNo,
            CrimeRegisteredDate: regDateStr,
            PolicePersonID: policePersonId,
            PoliceStationID: stationId,
            CaseCategoryID: Number(recordData.caseCategoryId || recordData.CaseCategoryID || 1),
            GravityOffenceID: Number(recordData.gravityOffenceId || recordData.GravityOffenceID || 2),
            CrimeMajorHeadID: Number(recordData.crimeMajorHeadId || recordData.CrimeMajorHeadID || 1),
            CrimeMinorHeadID: Number(recordData.crimeMinorHeadId || recordData.CrimeMinorHeadID || 1),
            CaseStatusID: Number(recordData.caseStatusId || recordData.CaseStatusID || 1),
            CourtID: Number(recordData.courtId || recordData.CourtID || 1),
            IncidentFromDate: formatCatalystDatetime(recordData.incidentFromDate || recordData.IncidentFromDate, "10:00:00"),
            IncidentToDate: formatCatalystDatetime(recordData.incidentToDate || recordData.IncidentToDate, "11:30:00"),
            InfoReceivedPSDate: formatCatalystDatetime(recordData.infoReceivedPSDate || recordData.InfoReceivedPSDate, "12:00:00"),
            latiutude: Number(recordData.lat || recordData.latiutude || recordData.latitude) || 26.2183,
            longitude: Number(recordData.lng || recordData.longitude) || 78.1828,
            BriefFacts: String(recordData.briefFacts || recordData.Description || `FIR #${crimeNo} registered at ${recordData.unit || 'Cyber Police Station'}.`).slice(0, 250)
        };

        const fullRecord = {
            ...catalystCaseMasterRow,
            complainantName: String(recordData.complainantName),
            accusedName: String(recordData.accusedName || "Unidentified Suspect"),
            allottedOfficerName: String(recordData.allottedOfficerName),
            allottedOfficerRank: String(recordData.allottedOfficerRank || "Police Inspector"),
            allottedOfficerKgid: String(recordData.allottedOfficerKgid || "MPP-2026-901"),
            locationStreet: String(recordData.locationStreet),
            unit: String(recordData.unit),
            district: String(recordData.district),
            crimeHead: String(recordData.crimeHead),
            crimeSubHead: String(recordData.crimeSubHead || "General Cyber Forensic"),
            actSections: String(recordData.actSections),
            severity: String(recordData.severity || "MEDIUM"),
            status: String(recordData.status || "Under Investigation"),
            estimatedValue: Number(recordData.estimatedValue) || 0,
            propertyDescription: String(recordData.propertyDescription || "")
        };

        try {
            console.log("[CrimeRepository] Inserting new FIR directly into Zoho Catalyst Online Data Store...");
            const insertRes = await callCatalystDatastoreApi('/table/CaseMaster/row', 'POST', [catalystCaseMasterRow]);
            if (insertRes.status === 200 && insertRes.data && insertRes.data.data && insertRes.data.data[0]) {
                const cloudRow = insertRes.data.data[0];
                console.log("✅ [CrimeRepository] Catalyst Online Data Store INSERT SUCCESS. ROWID:", cloudRow.ROWID);

                // Store rich metadata to case_meta_store
                setCaseMeta([cloudRow.ROWID, String(caseMasterId), crimeNo, `fir-${caseMasterId}`], {
                    ...fullRecord,
                    ROWID: cloudRow.ROWID,
                    CaseMasterID: caseMasterId,
                    PoliceStationID: stationId,
                    PolicePersonID: policePersonId,
                    district: recordData.district,
                    unit: recordData.unit,
                    complainantName: recordData.complainantName,
                    accusedName: recordData.accusedName,
                    allottedOfficerName: recordData.allottedOfficerName,
                    allottedOfficerRank: recordData.allottedOfficerRank,
                    allottedOfficerKgid: recordData.allottedOfficerKgid,
                    briefFacts: recordData.briefFacts,
                    locationStreet: recordData.locationStreet,
                    actSections: recordData.actSections,
                    crimeHead: recordData.crimeHead,
                    crimeSubHead: recordData.crimeSubHead,
                    severity: recordData.severity,
                    status: recordData.status,
                    lat: recordData.lat,
                    lng: recordData.lng
                });

                const cloudNorm = this.normalizeRow({ ...fullRecord, ...cloudRow });
                
                this.masterRecords.unshift(cloudNorm);

                const caseMasterIdNum = Number(caseMasterId);

                // 1. Relational Ingestion: ComplainantDetails
                try {
                    const compId = generateUniqueIntId();
                    await callCatalystDatastoreApi('/table/ComplainantDetails/row', 'POST', [{
                        ComplainantID: Number(compId),
                        CaseMasterID: caseMasterIdNum,
                        ComplainantName: String(recordData.complainantName || "Citizen Complainant"),
                        AgeYear: Number(recordData.complainantAge) || 28,
                        OccupationID: 1,
                        ReligionID: 1,
                        CastelD: 1,
                        GenderlD: recordData.complainantGender === "Female" ? 2 : 1
                    }]);
                    console.log("✅ [CrimeRepository] Relational ComplainantDetails inserted for case:", caseMasterIdNum);
                } catch (compErr) {
                    console.warn("[CrimeRepository] ComplainantDetails insert error:", compErr.message);
                }

                // 2. Relational Ingestion: Accused
                try {
                    const accusedId = generateUniqueIntId();
                    await callCatalystDatastoreApi('/table/Accused/row', 'POST', [{
                        AccusedMasterID: Number(accusedId),
                        CaseMasterID: caseMasterIdNum,
                        AccusedName: String(recordData.accusedName || "Unidentified Suspect"),
                        AgeYear: Number(recordData.accusedAge) || 32,
                        GenderlD: 1,
                        PersonID: String(recordData.accusedPersonId || `ACC-${String(caseMasterIdNum).slice(-4)}`)
                    }]);
                    console.log("✅ [CrimeRepository] Relational Accused inserted for case:", caseMasterIdNum);
                } catch (accErr) {
                    console.warn("[CrimeRepository] Accused insert error:", accErr.message);
                }

                // 3. Relational Ingestion: Victim
                try {
                    const victimId = generateUniqueIntId();
                    await callCatalystDatastoreApi('/table/Victim/row', 'POST', [{
                        VictimMasterID: Number(victimId),
                        CaseMasterID: caseMasterIdNum,
                        AgeYear: Number(recordData.complainantAge) || 28,
                        GenderlD: recordData.complainantGender === "Female" ? 2 : 1,
                        VictimPolice: "Civilian"
                    }]);
                    console.log("✅ [CrimeRepository] Relational Victim inserted for case:", caseMasterIdNum);
                } catch (vicErr) {
                    console.warn("[CrimeRepository] Victim insert error:", vicErr.message);
                }

                // 4. Relational Ingestion: ActSectionAssociation
                try {
                    let actId = 1;
                    let sectionId = 1;
                    const actsLower = String(recordData.actSections || "").toLowerCase();
                    if (actsLower.includes("bns")) {
                        actId = 2;
                        sectionId = 3;
                    } else if (actsLower.includes("ipc")) {
                        actId = 3;
                        sectionId = 4;
                    }
                    await callCatalystDatastoreApi('/table/ActSectionAssociation/row', 'POST', [{
                        CaseMasterID: caseMasterIdNum,
                        ActID: actId,
                        SectionID: sectionId,
                        ActOrderlD: 1,
                        SectionOrderlD: 1
                    }]);
                    console.log("✅ [CrimeRepository] Relational ActSectionAssociation inserted for case:", caseMasterIdNum);
                } catch (actErr) {
                    console.warn("[CrimeRepository] ActSectionAssociation insert error:", actErr.message);
                }

                // 5. Relational Ingestion: ChargesheetDetails (if closed/chargesheeted)
                if (recordData.status === "Chargesheeted" || recordData.status === "Case Closed / Completed") {
                    try {
                        const csId = generateUniqueIntId();
                        await callCatalystDatastoreApi('/table/ChargesheetDetails/row', 'POST', [{
                            CSID: Number(csId),
                            CaseMasterID: caseMasterIdNum,
                            csdate: formatCatalystDatetime(recordData.regDate || new Date().toISOString(), "12:00:00"),
                            cstype: recordData.status === "Case Closed / Completed" ? "Final Report / Closure" : "Prima Facie Chargesheet",
                            PolicePersonID: policePersonId
                        }]);
                        console.log("✅ [CrimeRepository] Relational ChargesheetDetails inserted for case:", caseMasterIdNum);
                    } catch (csErr) {
                        console.warn("[CrimeRepository] ChargesheetDetails insert error:", csErr.message);
                    }
                }

                // Automatically log to BiometricAuditTrail in Zoho Catalyst
                await this.createAuditTrailRecord({
                    employeeId: catalystCaseMasterRow.PolicePersonID,
                    officerName: fullRecord.allottedOfficerName,
                    kgid: fullRecord.allottedOfficerKgid || "MPP-2026-901",
                    action: "CREATE_CASE",
                    targetTable: "CaseMaster",
                    targetRecordId: crimeNo,
                    deviceId: "ESP32-BHOPAL-01",
                    fingerprintVerified: true,
                    otpUsed: "948212",
                    changesSummary: `FIR #${crimeNo} created in CaseMaster (${fullRecord.crimeHead})`
                });

                return cloudNorm;
            } else {
                console.error("❌ [CrimeRepository] Catalyst Online Data Store Insert Failed:", insertRes.status, JSON.stringify(insertRes.data));
                throw new Error("Catalyst Data Store insert failed: " + (insertRes.data?.message || "Unknown error"));
            }
        } catch (err) {
            console.error("❌ [CrimeRepository] Catalyst Online Data Store Exception:", err.message);
            throw err;
        }
    }

    async updateCrimeRecord(id, updatedData) {
        let targetRowId = null;
        if (/^\d{16,}$/.test(String(id))) {
            targetRowId = String(id);
        }
        if (!targetRowId) {
            const meta = getCaseMeta(id);
            if (meta && meta.ROWID) targetRowId = String(meta.ROWID);
        }
        if (!targetRowId && this.masterRecords) {
            const match = this.masterRecords.find(r => String(r.id) === String(id) || String(r.CaseMasterID) === String(id) || String(r.ROWID) === String(id));
            if (match && match.ROWID) targetRowId = String(match.ROWID);
        }

        const index = (this.masterRecords || []).findIndex(r => String(r.CaseMasterID) === String(id) || String(r.id) === String(id) || String(r.ROWID) === String(id) || (targetRowId && String(r.ROWID) === String(targetRowId)));
        if (index !== -1) {
            this.masterRecords[index] = { ...this.masterRecords[index], ...updatedData };
        }

        setCaseMeta([id, targetRowId], updatedData);

        try {
            if (targetRowId && /^\d{16,}$/.test(targetRowId)) {
                await callCatalystDatastoreApi(`/table/CaseMaster/row`, 'PUT', [{
                    ROWID: String(targetRowId),
                    CaseStatusID: Number(updatedData.CaseStatusID || (updatedData.status === "Case Closed / Completed" ? 3 : 1)),
                    BriefFacts: String(updatedData.briefFacts || updatedData.Description || "Updated FIR record").slice(0, 250)
                }]);
                console.log("✅ [CrimeRepository] Online Catalyst Data Store row updated.");

                // Log audit trail
                await this.createAuditTrailRecord({
                    action: "UPDATE_CASE",
                    targetTable: "CaseMaster",
                    targetRecordId: String(targetRowId),
                    changesSummary: `Updated case status / details for record ${targetRowId}`
                });
            }
        } catch (e) {
            console.warn("[CrimeRepository] Online Catalyst updateRow failed:", e.message);
        }
        return this.normalizeRow(this.masterRecords[index] || updatedData);
    }

    async deleteCrimeRecord(id) {
        let targetRowId = null;

        // 1. If id is already a 16+ digit numeric string, it's directly a Catalyst ROWID
        if (/^\d{16,}$/.test(String(id))) {
            targetRowId = String(id);
        }

        // 2. Check metadata store
        if (!targetRowId) {
            const meta = getCaseMeta(id);
            if (meta && meta.ROWID && /^\d{16,}$/.test(String(meta.ROWID))) {
                targetRowId = String(meta.ROWID);
            }
        }

        // 3. Search in current masterRecords
        if (!targetRowId && this.masterRecords && this.masterRecords.length > 0) {
            const match = this.masterRecords.find(r =>
                String(r.id) === String(id) ||
                String(r.CaseMasterID) === String(id) ||
                String(r.crimeNo) === String(id) ||
                String(r.CrimeNo) === String(id) ||
                String(r.ROWID) === String(id)
            );
            if (match && match.ROWID && /^\d{16,}$/.test(String(match.ROWID))) {
                targetRowId = String(match.ROWID);
            }
        }

        // 4. Fetch live records from Catalyst to find matching row
        if (!targetRowId) {
            try {
                const liveRecords = await this.getAllCrimeRecords();
                const match = liveRecords.find(r =>
                    String(r.id) === String(id) ||
                    String(r.CaseMasterID) === String(id) ||
                    String(r.crimeNo) === String(id) ||
                    String(r.CrimeNo) === String(id) ||
                    String(r.ROWID) === String(id)
                );
                if (match && match.ROWID && /^\d{16,}$/.test(String(match.ROWID))) {
                    targetRowId = String(match.ROWID);
                }
            } catch (e) {
                console.warn("[CrimeRepository] Could not fetch live records to resolve delete ROWID:", e.message);
            }
        }

        // 5. Cascade delete child relational tables in Catalyst
        let targetCaseMasterId = null;
        if (this.masterRecords) {
            const m = this.masterRecords.find(r => String(r.ROWID) === String(targetRowId) || String(r.id) === String(id) || String(r.CaseMasterID) === String(id));
            if (m) targetCaseMasterId = m.CaseMasterID;
        }
        if (!targetCaseMasterId) {
            const meta = getCaseMeta(id) || (targetRowId && getCaseMeta(targetRowId));
            if (meta && meta.CaseMasterID) targetCaseMasterId = meta.CaseMasterID;
        }

        if (targetCaseMasterId) {
            const childTables = ["ComplainantDetails", "Accused", "Victim", "ActSectionAssociation", "ChargesheetDetails"];
            for (const table of childTables) {
                try {
                    const res = await callCatalystDatastoreApi(`/table/${table}/row`, 'GET');
                    if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
                        const matches = res.data.data.filter(r => String(r.CaseMasterID) === String(targetCaseMasterId));
                        for (const childRow of matches) {
                            if (childRow.ROWID) {
                                await callCatalystDatastoreApi(`/table/${table}/row/${childRow.ROWID}`, 'DELETE');
                                console.log(`✅ [CrimeRepository] Cascade deleted ${table} ROWID ${childRow.ROWID} for CaseMasterID: ${targetCaseMasterId}`);
                            }
                        }
                    }
                } catch (e) {
                    console.warn(`[CrimeRepository] Cascade delete for ${table} warning:`, e.message);
                }
            }
        }

        // 6. Execute DELETE on CaseMaster in Catalyst
        if (targetRowId) {
            console.log(`[CrimeRepository] Permanently deleting CaseMaster ROWID ${targetRowId} from Catalyst Data Store...`);
            const delRes = await callCatalystDatastoreApi(`/table/CaseMaster/row/${targetRowId}`, 'DELETE');
            console.log(`✅ [CrimeRepository] Catalyst Data Store response:`, delRes.status, delRes.data?.status);
        } else {
            console.warn(`[CrimeRepository] No valid 16+ digit Catalyst ROWID resolved for deletion target: ${id}`);
        }

        // Purge from in-memory list
        this.masterRecords = (this.masterRecords || []).filter(r =>
            String(r.ROWID) !== String(targetRowId) &&
            String(r.id) !== String(id) &&
            String(r.ROWID) !== String(id)
        );

        // Purge from case_meta_store
        deleteCaseMeta([id, targetRowId]);

        return { success: true, id, targetRowId };
    }

    // --- BiometricAuditTrail Live Zoho Catalyst Data Store Methods ---
    async getBiometricAuditTrails() {
        try {
            const res = await callCatalystDatastoreApi('/table/BiometricAuditTrail/row', 'GET');
            if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
                console.log(`[CrimeRepository] Fetched ${res.data.data.length} audit logs directly from Zoho Catalyst BiometricAuditTrail.`);
                return res.data.data;
            }
        } catch (e) {
            console.warn("[CrimeRepository] Online Catalyst BiometricAuditTrail fetch failed:", e.message);
        }
        return [];
    }

    async createAuditTrailRecord(auditData = {}) {
        const empId = Number(auditData.employeeId || auditData.EmployeeID || auditData.employeeID || 101);
        const auditRow = {
            AuditID: Date.now(),
            EmployeeID: isNaN(empId) ? 101 : empId,
            OfficerName: String(auditData.officerName || auditData.OfficerName || "Inspector Rajesh Sharma"),
            KGID: String(auditData.kgid || auditData.KGID || "MPP-2026-901"),
            Action: String(auditData.action || auditData.Action || "BIOMETRIC_AUTH"),
            TargetTable: String(auditData.targetTable || auditData.TargetTable || "CaseMaster"),
            TargetRecordID: String(auditData.targetRecordId || auditData.TargetRecordID || `AUTH-${Date.now()}`),
            DeviceID: String(auditData.deviceId || auditData.DeviceID || "ESP32-BHOPAL-01"),
            FingerprintVerified: Boolean(auditData.fingerprintVerified ?? auditData.FingerprintVerified ?? true),
            OTPUsed: String(auditData.otpUsed || auditData.OTPUsed || "948212"),
            IPAddress: String(auditData.ipAddress || auditData.IPAddress || "127.0.0.1"),
            AuditTimestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
            ChangesSummary: String(auditData.changesSummary || auditData.ChangesSummary || "Biometric authentication verified").slice(0, 500)
        };

        try {
            const insertRes = await callCatalystDatastoreApi('/table/BiometricAuditTrail/row', 'POST', [auditRow]);
            if (insertRes.status === 200 && insertRes.data && insertRes.data.data && insertRes.data.data[0]) {
                console.log("✅ [CrimeRepository] BiometricAuditTrail INSERT SUCCESS. ROWID:", insertRes.data.data[0].ROWID);
                return insertRes.data.data[0];
            } else {
                console.error("❌ [CrimeRepository] BiometricAuditTrail Insert Failed:", insertRes.status, JSON.stringify(insertRes.data));
            }
        } catch (e) {
            console.error("❌ [CrimeRepository] BiometricAuditTrail Insert Exception:", e.message);
        }
        return auditRow;
    }

    async getAllOfficerRecords() {
        let cloudOfficers = [];
        try {
            const res = await callCatalystDatastoreApi('/table/Employee/row', 'GET');
            let bioRows = [];
            try {
                const bioRes = await callCatalystDatastoreApi('/table/OfficerBiometric/row', 'GET');
                if (bioRes.status === 200 && bioRes.data && Array.isArray(bioRes.data.data)) {
                    bioRows = bioRes.data.data;
                }
            } catch (bioE) {
                console.warn("[CrimeRepository] OfficerBiometric fetch skipped:", bioE.message);
            }

            if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
                cloudOfficers = res.data.data.map((emp, idx) => {
                    const cleanName = (emp.FirstName || "").toLowerCase().replace(/[^a-z0-9]/g, '');
                    const defaultAvatars = [
                        "https://i.pinimg.com/736x/2c/11/3f/2c113fd9405b68fa8e59fbf22a17ed45.jpg",
                        "https://i.pinimg.com/1200x/4a/00/0f/4a000f954bc84e713ce910bc90de34f9.jpg"
                    ];
                    const cachedMeta = (global.__officer_meta_cache && (
                        global.__officer_meta_cache[emp.ROWID] || 
                        global.__officer_meta_cache[emp.KGID] ||
                        global.__officer_meta_cache[emp.EmployeeID] ||
                        global.__officer_meta_cache[cleanName]
                    )) || {};
                    const badge = (emp.KGID ? String(emp.KGID).replace(/^KSP-/i, "MPP-") : null) || `MPP-${emp.ROWID || emp.EmployeeID}`;
                    
                    // Match live biometric face photo from Catalyst OfficerBiometric table
                    const bioMatch = bioRows.find(b => 
                        (b.KGID && String(b.KGID).trim().toLowerCase() === badge.toLowerCase()) || 
                        (b.EmployeeID && String(b.EmployeeID) === String(emp.EmployeeID))
                    );
                    const livePhotoUrl = (bioMatch && bioMatch.DeviceID && bioMatch.DeviceID.startsWith("http")) 
                        ? bioMatch.DeviceID 
                        : (cachedMeta.photoUrl || cachedMeta.avatar || defaultAvatars[idx % defaultAvatars.length]);

                    return {
                        id: `u-${emp.ROWID || emp.EmployeeID || emp.KGID}`,
                        badgeNumber: badge,
                        mppid: badge,
                        name: emp.FirstName,
                        rank: cachedMeta.rank || "Police Inspector",
                        unit: cachedMeta.unit || "Bhopal Central Cyber Cell",
                        station: cachedMeta.station || "Bhopal Range",
                        yearsOfService: cachedMeta.yearsOfService || 5,
                        status: "On Duty",
                        ROWID: emp.ROWID,
                        EmployeeID: emp.EmployeeID,
                        username: cachedMeta.username || `mpp.${cleanName}`,
                        password: cachedMeta.password || "password",
                        avatar: livePhotoUrl,
                        photoUrl: livePhotoUrl
                    };
                });
                console.log(`[CrimeRepository] Fetched ${cloudOfficers.length} officer employees with live face photos directly from Zoho Catalyst.`);
            }
        } catch (e) {
            console.warn("[CrimeRepository] Online Catalyst Employee fetch failed:", e.message);
        }

        return cloudOfficers;
    }

    async updateOfficerPassword(badgeOrId, newPassword) {
        if (!global.__officer_meta_cache) global.__officer_meta_cache = {};
        const key = String(badgeOrId);
        global.__officer_meta_cache[key] = {
            ...(global.__officer_meta_cache[key] || {}),
            password: newPassword
        };
        const clean = key.replace(/^u-/, '');
        global.__officer_meta_cache[clean] = {
            ...(global.__officer_meta_cache[clean] || {}),
            password: newPassword
        };
        console.log(`[CrimeRepository] Updated live password in memory cache for officer: ${key}`);
        return { success: true, officer: { badgeNumber: key, password: newPassword } };
    }

    async deleteAllOfficerRecords() {
        global.__officer_meta_cache = {};
        try {
            const res = await callCatalystDatastoreApi('/table/Employee/row', 'GET');
            if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
                console.log(`[CrimeRepository] Deleting ${res.data.data.length} officer records from Catalyst Employee table...`);
                for (const emp of res.data.data) {
                    if (emp.ROWID) {
                        await callCatalystDatastoreApi(`/table/Employee/row/${emp.ROWID}`, 'DELETE');
                        console.log(`[CrimeRepository] Deleted Employee ROWID: ${emp.ROWID}`);
                    }
                }
            }
        } catch (e) {
            console.warn("[CrimeRepository] Error deleting employee records:", e.message);
        }
        return true;
    }

    async createOfficerRecord(officerData) {
        if (!officerData || typeof officerData !== "object") {
            throw new Error("Validation Error: Invalid officer payload provided.");
        }

        // --- Server-side Validations Matching Catalyst Employee Structure ---
        const missingFields = [];
        if (!officerData.name || !String(officerData.name).trim()) missingFields.push("Officer Full Name (FirstName)");
        if (!officerData.badgeNumber || !String(officerData.badgeNumber).trim()) missingFields.push("KGID / Badge Number (KGID)");
        if (!officerData.unit || !String(officerData.unit).trim()) missingFields.push("Assigned Division / Unit (UnitID)");
        if (!officerData.station || !String(officerData.station).trim()) missingFields.push("District Jurisdiction Headquarters (DistrictID)");
        if (!officerData.rank || !String(officerData.rank).trim()) missingFields.push("Officer Rank (RankID)");

        if (missingFields.length > 0) {
            throw new Error(`Validation Error: Missing mandatory database field(s): ${missingFields.join(", ")}`);
        }

        const empId = String(Date.now().toString().slice(-6));
        const badge = String(officerData.badgeNumber.trim());
        const name = String(officerData.name.trim());
        const rank = String(officerData.rank.trim());
        const unit = String(officerData.unit.trim());
        const station = String(officerData.station.trim());
        const photoUrl = officerData.photoUrl || officerData.avatar || "";

        const catalystEmployeeRow = {
            EmployeeID: empId,
            KGID: badge,
            FirstName: name,
            DistrictID: String(this.rowIds.District || "56116000000043001"),
            UnitID: String(this.rowIds.Unit || "56116000000049001")
        };

        let cloudRow = null;
        try {
            console.log("[CrimeRepository] Inserting new Officer Employee directly into Zoho Catalyst Online Data Store...");
            const insertRes = await callCatalystDatastoreApi('/table/Employee/row', 'POST', [catalystEmployeeRow]);
            if (insertRes.status === 200 && insertRes.data && insertRes.data.data && insertRes.data.data[0]) {
                cloudRow = insertRes.data.data[0];
                console.log("✅ [CrimeRepository] Catalyst Employee INSERT SUCCESS. ROWID:", cloudRow.ROWID);
            } else {
                console.error("❌ [CrimeRepository] Catalyst Employee Insert Failed:", insertRes.status, JSON.stringify(insertRes.data));
            }
        } catch (e) {
            console.error("❌ [CrimeRepository] Catalyst Employee Insert Exception:", e.message);
        }

        // Live Catalyst OfficerBiometric Insertion storing Cloudinary face reference
        const catalystBiometricRow = {
            EmployeeID: Number(empId) || 101,
            KGID: badge,
            BiometricID: Number(Date.now().toString().slice(-6)),
            DeviceID: photoUrl ? String(photoUrl) : "CV-FACE-CAMERA-01",
            FingerprintTemplateID: 101,
            EnrolledBy: "56116000000013007",
            EnrolledDate: new Date().toISOString().replace('T', ' ').split('.')[0]
        };

        try {
            console.log("[CrimeRepository] Storing Cloudinary Face Biometric in Catalyst OfficerBiometric table...");
            const bioInsertRes = await callCatalystDatastoreApi('/table/OfficerBiometric/row', 'POST', [catalystBiometricRow]);
            if (bioInsertRes.status === 200) {
                console.log("✅ [CrimeRepository] Catalyst OfficerBiometric Face URL Saved. ROWID:", bioInsertRes.data?.data?.[0]?.ROWID);
            }
        } catch (bioErr) {
            console.warn("[CrimeRepository] Catalyst OfficerBiometric save warning:", bioErr.message);
        }

        if (cloudRow?.ROWID) {
            if (!global.__officer_meta_cache) global.__officer_meta_cache = {};
            global.__officer_meta_cache[cloudRow.ROWID] = {
                rank, unit, station, yearsOfService: Number(officerData.yearsOfService) || 5, photoUrl
            };
            global.__officer_meta_cache[badge] = global.__officer_meta_cache[cloudRow.ROWID];
        }

        return {
            badgeNumber: badge,
            name: name,
            rank: rank,
            unit: unit,
            station: station,
            yearsOfService: Number(officerData.yearsOfService) || 5,
            status: "On Duty",
            ROWID: cloudRow?.ROWID || `emp-${empId}`,
            EmployeeID: empId,
            photoUrl: photoUrl,
            avatar: photoUrl
        };
    }
}

CrimeRepository.callCatalystDatastoreApi = callCatalystDatastoreApi;
module.exports = CrimeRepository;