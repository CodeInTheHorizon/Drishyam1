/**
 * submit_test_fir.js
 * 
 * Programmatically submits a single test FIR record via the platform API form endpoint (/api/records)
 * to verify it is successfully inserted into the online Zoho Catalyst database.
 * 
 * Usage:
 *   node scripts/submit_test_fir.js
 */

const http = require("http");

const testEntry = {
    crimeNo: "104430006202699999",
    caseNo: "202699999",
    regDate: "2026-07-21",
    district: "Bengaluru City",
    unit: "Bengaluru Central PS",
    crimeHead: "Property Offences",
    crimeSubHead: "Commercial Dacoity & Theft",
    actSections: "IPC Sec 395",
    severity: "CRITICAL",
    status: "Under Investigation",
    complainantName: "Test Complainant",
    complainantPhone: "+91 99999 88888",
    complainantAddress: "123 Verification Lane, Bengaluru City",
    accusedName: "Test Suspect",
    locationStreet: "Verification Lane",
    lat: 12.9716,
    lng: 77.5946,
    allottedOfficerName: "PSI Test Officer",
    allottedOfficerKgid: "KSP-2026-9999",
    briefFacts: "Test database verification entry. Registered under IPC Sec 395 to verify connection and schema insert stability."
};

function submitFormRecord(entry) {
    return new Promise((resolve) => {
        const postData = JSON.stringify(entry);

        const options = {
            hostname: "localhost",
            port: 3000,
            path: "/api/records",
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = "";
            res.on("data", (chunk) => { body += chunk; });
            res.on("end", () => {
                try {
                    const parsed = JSON.parse(body);
                    console.log(`[FIR #${entry.crimeNo}] Submitted successfully | HTTP Status: ${res.statusCode}`);
                    console.log("Response:", JSON.stringify(parsed, null, 2));
                    resolve(parsed);
                } catch (e) {
                    console.log(`[FIR #${entry.crimeNo}] Submitted | HTTP Status: ${res.statusCode}`);
                    console.log("Raw Response:", body);
                    resolve(null);
                }
            });
        });

        req.on("error", (e) => {
            console.error(`[Submission Error] ${e.message}`);
            resolve(null);
        });

        req.write(postData);
        req.end();
    });
}

submitFormRecord(testEntry);
