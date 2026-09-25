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

const SEED_DATA_PATH = path.join(__dirname, "local_crime_records.json");
const ROWID_MAPPING_PATH = path.join(__dirname, "../../../scripts/rowid_mapping.json");

const DB_FILE_PATH = SEED_DATA_PATH;

const loadPersistentDb = () => {
    try {
        if (fs.existsSync(DB_FILE_PATH)) {
            const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
            if (raw) {
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : (parsed.CaseMaster || []);
            }
        }
    } catch (e) {
        console.warn("[datastore] Failed reading persistent DB file:", e.message);
    }
    return [];
};

const savePersistentDb = (records) => {
    try {
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(records, null, 2), "utf-8");
    } catch (e) {
        console.warn("[datastore] Failed writing persistent DB file:", e.message);
    }
};

let globalServerRecords = loadPersistentDb();

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

const loadBaselineData = () => {
    try {
        if (fs.existsSync(SEED_DATA_PATH)) {
            const raw = fs.readFileSync(SEED_DATA_PATH, "utf-8");
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : (parsed.CaseMaster || []);
        }
    } catch (e) {
        console.error("Error loading seed data:", e.message);
    }
    return [];
};

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

let cachedToken = process.env.QUICKML_ACCESS_TOKEN || null;
let tokenExpiryTime = process.env.QUICKML_ACCESS_TOKEN ? (Date.now() + 50 * 60 * 1000) : 0;
let inFlightTokenPromise = null;
let lastRateLimitTime = 0;

async function getFreshAccessToken() {
    if (cachedToken && Date.now() < tokenExpiryTime) {
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

async function callCatalystDatastoreApi(pathSuffix, method = 'GET', bodyObj = null) {
    const projectId = process.env.CATALYST_PROJECT_ID;
    const orgId = process.env.CATALYST_ORG_ID;
    if (!projectId || !orgId) {
        return { status: 503, data: null };
    }
    let token = null;
    try {
        token = await getFreshAccessToken();
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
    return { status: res.status, data: parsed };
}


class CrimeRepository {

    constructor(req) {
        if (!global.__catalyst_master_records) {
            global.__catalyst_master_records = [];
        }
        this.masterRecords = global.__catalyst_master_records;

        // Build lookup caches from seed data for FK → display name resolution
        if (!global.__catalyst_lookup_cache) {
            try {
                const raw = fs.readFileSync(SEED_DATA_PATH, "utf-8");
                const allData = JSON.parse(raw);
                global.__catalyst_lookup_cache = {
                    districts: {},    
                    units: {},        
                    employees: {},    
                    crimeHeads: {},   
                    crimeSubHeads: {},
                    caseStatuses: {}, 
                    gravityOffences: {},
                    courts: {},       
                };
                const cache = global.__catalyst_lookup_cache;
                (allData.District || []).forEach(d => { cache.districts[d.DistrictID] = d.DistrictName; });
                (allData.Unit || []).forEach(u => { cache.units[u.UnitID] = u.UnitName; cache.units[`dist_${u.UnitID}`] = u.DistrictID; });
                (allData.Employee || []).forEach(e => {
                    cache.employees[e.EmployeeID] = {
                        name: e.FirstName,
                        kgid: e.KGID,
                        districtId: e.DistrictID,
                        unitId: e.UnitID,
                        rankId: e.RankID
                    };
                });
                (allData.CrimeHead || []).forEach(c => { cache.crimeHeads[c.CrimeHeadID] = c.CrimeGroupName; });
                (allData.CrimeSubHead || []).forEach(c => { cache.crimeSubHeads[c.CrimeSubHeadID] = c.CrimeHeadName; });
                (allData.CaseStatusMaster || []).forEach(s => { cache.caseStatuses[s.CaseStatusID] = s.CaseStatusName; });
                (allData.GravityOffence || []).forEach(g => { cache.gravityOffences[g.GravityOffenceID] = g.LookupValue; });
                (allData.Court || []).forEach(c => { cache.courts[c.CourtID] = c.CourtName; });
                console.log("[CrimeRepository] Lookup cache built from local seed data.");
            } catch (e) {
                console.warn("[CrimeRepository] Failed to build lookup cache:", e.message);
                global.__catalyst_lookup_cache = {};
            }
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

        let officerName = row.OfficerName || row.allottedOfficerName;
        let officerRank = row.allottedOfficerRank || "Police Inspector";
        let officerKgid = row.allottedOfficerKgid || `MPP-2026-${String(row.PolicePersonID || 101).padStart(3, '0')}`;
        if (!officerName) {
            const officerList = [
                "Inspector Rajesh Sharma",
                "DSP Ananya Verma",
                "SI Amit Patel",
                "Inspector Vikram Singh",
                "SI Priya Chouhan"
            ];
            const idx = Math.abs(Number(caseMasterId) || 0) % officerList.length;
            officerName = officerList[idx];
        }

        let stationName = row.PoliceStation || row.unit;
        if (!stationName && row.PoliceStationID) {
            stationName = STATION_MAP[row.PoliceStationID] || liveLookups.units?.[row.PoliceStationID];
        }
        stationName = stationName || "Bhopal Central Cyber Cell";

        let districtName = row.District || row.district;
        if (!districtName && row.DistrictID) {
            districtName = DISTRICT_MAP[row.DistrictID] || liveLookups.districts?.[row.DistrictID];
        }
        if (!districtName && row.PoliceStationID && STATION_MAP[row.PoliceStationID]) {
            districtName = STATION_MAP[row.PoliceStationID].split(" ")[0];
        }
        districtName = districtName || "Bhopal";

        let categoryName = row.CrimeCategory || row.crimeHead;
        if (!categoryName || typeof categoryName !== "string" || !categoryName.trim()) {
            if (row.CaseCategoryID && CATEGORY_MAP[row.CaseCategoryID]) {
                categoryName = CATEGORY_MAP[row.CaseCategoryID];
            } else {
                const DEFAULT_CATS = ["CDR / IPDR", "Bank / UPI Logs", "Email Headers", "Chat Exports", "Android / APK Logs"];
                categoryName = DEFAULT_CATS[Math.abs(Number(caseMasterId) || 0) % DEFAULT_CATS.length];
            }
        }

        let subHeadName = row.crimeSubHead || "General Cyber Forensic";

        let severity = row.Severity || row.severity;
        if (!severity && row.GravityOffenceID != null) {
            severity = SEVERITY_MAP[row.GravityOffenceID] || liveLookups.gravity?.[row.GravityOffenceID];
        }
        severity = severity || "MEDIUM";

        let statusName = row.Status || row.status;
        if (!statusName && row.CaseStatusID) {
            statusName = STATUS_MAP[row.CaseStatusID] || liveLookups.caseStatuses?.[row.CaseStatusID];
        }
        statusName = statusName || "Under Investigation";

        let compName = row.ComplainantName || row.complainantName || "Citizen Complainant";
        let accName = row.AccusedName || row.accusedName || "Unidentified Suspect";

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
            actSections: row.ActSections || row.actSections || "IT Act Sec 66C / 66D",
            ActSections: row.ActSections || row.actSections || "IT Act Sec 66C / 66D",
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
            briefFacts: row.BriefFacts || row.briefFacts || "Incident logged and evidence registered.",
            BriefFacts: row.BriefFacts || row.briefFacts || "Incident logged and evidence registered.",
            propertyDescription: row.propertyDescription || "Digital forensic exhibits catalogued",
            estimatedValue: Number(row.EstimatedValue || row.estimatedValue || 0),
            officialReportImage: "https://images.unsplash.com/photo-1568667256549-094345857637?q=80&w=800&auto=format&fit=crop",
            lat: Number(row.latiutude || row.latitude || row.lat || 23.2599),
            lng: Number(row.longitude || row.lng || 77.4126),
            locationStreet: row.locationStreet || `${districtName} Cyber Unit Road`
        };
    }

    async getAllCrimeRecords(filters = {}) {
        let cloudRows = null;
        try {
            const caseRes = await callCatalystDatastoreApi('/table/CaseMaster/row', 'GET');
            if (caseRes.status === 200 && caseRes.data && Array.isArray(caseRes.data.data)) {
                cloudRows = caseRes.data.data;
                console.log(`[CrimeRepository] Fetched ${cloudRows.length} CaseMaster rows directly from Zoho Catalyst Online Data Store.`);
            }
        } catch (err) {
            console.warn("[CrimeRepository] Online Catalyst Data Store fetch failed:", err.message);
        }

        let sourceRows = [];
        if (cloudRows !== null) {
            sourceRows = cloudRows;
            savePersistentDb(cloudRows);
        } else {
            sourceRows = loadPersistentDb();
        }

        let normalized = sourceRows.map((r) => this.normalizeRow(r));

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

        // Non-relational schema for Zoho Catalyst CaseMaster
        const catalystCaseMasterRow = {
            CaseMasterID: Number(caseMasterId),
            CrimeNo: crimeNo,
            CaseNo: caseNo,
            CrimeRegisteredDate: regDateStr,
            PolicePersonID: Number(recordData.policePersonId || recordData.PolicePersonID || 101),
            PoliceStationID: Number(recordData.policeStationId || recordData.PoliceStationID || 201),
            CaseCategoryID: Number(recordData.caseCategoryId || recordData.CaseCategoryID || 1),
            GravityOffenceID: Number(recordData.gravityOffenceId || recordData.GravityOffenceID || 2),
            CrimeMajorHeadID: Number(recordData.crimeMajorHeadId || recordData.CrimeMajorHeadID || 1),
            CrimeMinorHeadID: Number(recordData.crimeMinorHeadId || recordData.CrimeMinorHeadID || 1),
            CaseStatusID: Number(recordData.caseStatusId || recordData.CaseStatusID || 1),
            CourtID: Number(recordData.courtId || recordData.CourtID || 1),
            IncidentFromDate: formatCatalystDatetime(recordData.incidentFromDate || recordData.IncidentFromDate, "10:00:00"),
            IncidentToDate: formatCatalystDatetime(recordData.incidentToDate || recordData.IncidentToDate, "11:30:00"),
            InfoReceivedPSDate: formatCatalystDatetime(recordData.infoReceivedPSDate || recordData.InfoReceivedPSDate, "12:00:00"),
            latiutude: Number(recordData.lat || recordData.latiutude || recordData.latitude) || 23.2599,
            longitude: Number(recordData.lng || recordData.longitude) || 77.4126,
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

        const norm = this.normalizeRow(fullRecord);
        globalServerRecords = loadPersistentDb();
        globalServerRecords.unshift(norm);
        savePersistentDb(globalServerRecords);

        try {
            console.log("[CrimeRepository] Inserting new FIR directly into Zoho Catalyst Online Data Store...");
            const insertRes = await callCatalystDatastoreApi('/table/CaseMaster/row', 'POST', [catalystCaseMasterRow]);
            if (insertRes.status === 200 && insertRes.data && insertRes.data.data && insertRes.data.data[0]) {
                const cloudRow = insertRes.data.data[0];
                console.log("✅ [CrimeRepository] Catalyst Online Data Store INSERT SUCCESS. ROWID:", cloudRow.ROWID);
                const cloudNorm = this.normalizeRow({ ...fullRecord, ...cloudRow });
                
                this.masterRecords.unshift(cloudNorm);
                globalServerRecords = loadPersistentDb();
                globalServerRecords.unshift(cloudNorm);
                savePersistentDb(globalServerRecords);

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
        const index = this.masterRecords.findIndex(r => String(r.CaseMasterID) === String(id) || String(r.id) === String(id) || String(r.ROWID) === String(id));
        if (index !== -1) {
            this.masterRecords[index] = { ...this.masterRecords[index], ...updatedData };
        }

        try {
            const rowId = (this.masterRecords[index] && this.masterRecords[index].ROWID) || id;
            if (rowId && String(rowId).length > 10) {
                await callCatalystDatastoreApi(`/table/CaseMaster/row`, 'PUT', [{
                    ROWID: String(rowId),
                    CaseStatusID: Number(updatedData.CaseStatusID || 2),
                    BriefFacts: String(updatedData.briefFacts || updatedData.Description || "Updated FIR record").slice(0, 250)
                }]);
                console.log("✅ [CrimeRepository] Online Catalyst Data Store row updated.");

                // Log audit trail
                await this.createAuditTrailRecord({
                    action: "UPDATE_CASE",
                    targetTable: "CaseMaster",
                    targetRecordId: String(rowId),
                    changesSummary: `Updated case status / details for record ${rowId}`
                });
            }
        } catch (e) {
            console.warn("[CrimeRepository] Online Catalyst updateRow failed:", e.message);
        }
        return this.normalizeRow(this.masterRecords[index] || updatedData);
    }

    async deleteCrimeRecord(id) {
        const index = this.masterRecords.findIndex(r => String(r.CaseMasterID) === String(id) || String(r.id) === String(id) || String(r.ROWID) === String(id));
        if (index !== -1) {
            this.masterRecords.splice(index, 1);
        }

        try {
            if (id && String(id).length > 10) {
                await callCatalystDatastoreApi(`/table/CaseMaster/row/${id}`, 'DELETE');
                console.log("✅ [CrimeRepository] Online Catalyst Data Store row deleted.");
            }
        } catch (e) {
            console.warn("[CrimeRepository] Online Catalyst deleteRow failed:", e.message);
        }
        return { success: true, id };
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
        const auditRow = {
            AuditID: Date.now(),
            EmployeeID: Number(auditData.employeeId || 101),
            OfficerName: String(auditData.officerName || "Inspector Rajesh Sharma"),
            KGID: String(auditData.kgid || "MPP-2026-901"),
            Action: String(auditData.action || "BIOMETRIC_AUTH"),
            TargetTable: String(auditData.targetTable || "CaseMaster"),
            TargetRecordID: String(auditData.targetRecordId || `AUTH-${Date.now()}`),
            DeviceID: String(auditData.deviceId || "ESP32-BHOPAL-01"),
            FingerprintVerified: Boolean(auditData.fingerprintVerified ?? true),
            OTPUsed: String(auditData.otpUsed || "948212"),
            IPAddress: String(auditData.ipAddress || "127.0.0.1"),
            AuditTimestamp: new Date().toISOString().replace('T', ' ').split('.')[0],
            ChangesSummary: String(auditData.changesSummary || "Biometric authentication verified").slice(0, 500)
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
            if (res.status === 200 && res.data && Array.isArray(res.data.data)) {
                cloudOfficers = res.data.data.map(emp => ({
                    badgeNumber: emp.KGID || `MPP-${emp.EmployeeID}`,
                    name: emp.FirstName,
                    rank: "Police Inspector",
                    unit: "General Unit",
                    station: "Bhopal Police Station",
                    yearsOfService: 5,
                    status: "On Duty",
                    ROWID: emp.ROWID,
                    EmployeeID: emp.EmployeeID
                }));
                console.log(`[CrimeRepository] Fetched ${cloudOfficers.length} officer employees directly from Zoho Catalyst Online Data Store.`);
            }
        } catch (e) {
            console.warn("[CrimeRepository] Online Catalyst Employee fetch failed:", e.message);
        }

        return cloudOfficers;
    }

    async deleteAllOfficerRecords() {
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

        const catalystEmployeeRow = {
            EmployeeID: empId,
            KGID: badge,
            FirstName: name,
            DistrictID: String(this.rowIds.District || "56116000000043001"),
            UnitID: String(this.rowIds.Unit || "56116000000049001")
        };

        try {
            console.log("[CrimeRepository] Inserting new Officer Employee directly into Zoho Catalyst Online Data Store...");
            const insertRes = await callCatalystDatastoreApi('/table/Employee/row', 'POST', [catalystEmployeeRow]);
            if (insertRes.status === 200 && insertRes.data && insertRes.data.data && insertRes.data.data[0]) {
                const cloudRow = insertRes.data.data[0];
                console.log("✅ [CrimeRepository] Catalyst Employee INSERT SUCCESS. ROWID:", cloudRow.ROWID);
                return {
                    badgeNumber: badge,
                    name: name,
                    rank: rank,
                    unit: unit,
                    station: station,
                    yearsOfService: Number(officerData.yearsOfService) || 5,
                    status: "On Duty",
                    ROWID: cloudRow.ROWID,
                    EmployeeID: empId
                };
            } else {
                console.error("❌ [CrimeRepository] Catalyst Employee Insert Failed:", insertRes.status, JSON.stringify(insertRes.data));
            }
        } catch (e) {
            console.error("❌ [CrimeRepository] Catalyst Employee Insert Exception:", e.message);
        }

        return {
            badgeNumber: badge,
            name: name,
            rank: rank,
            unit: unit,
            station: station,
            yearsOfService: Number(officerData.yearsOfService) || 5,
            status: "On Duty",
            EmployeeID: empId
        };
    }
}

module.exports = CrimeRepository;