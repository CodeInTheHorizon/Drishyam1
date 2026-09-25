const http = require("http");
const url = require("url");
const path = require("path");
const fs = require("fs");
const os = require("os");

// Load .env variables automatically if file exists
try {
    const envPath = path.join(__dirname, ".env");
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
    console.warn("Failed loading .env file:", e.message);
}

// Chatbot QuickML environment variables (configured via .env or hosting environment)
process.env.QUICKML_ENDPOINT = process.env.QUICKML_ENDPOINT || "https://console.catalyst.zoho.in/quickml/v1/project/56116000000209001/genai/endpoints/glm-flash-47/generate";
process.env.QUICKML_ENDPOINT_KEY = process.env.QUICKML_ENDPOINT_KEY || "a3a78594529db79169be374765bc9c943e9e29c4de9e45efc4cc595e801bcdd06606939f2165f1eaa2d70b4d76864630";
process.env.CATALYST_ORG_ID = process.env.CATALYST_ORG_ID || "60077759371";
process.env.CATALYST_PROJECT_ID = process.env.CATALYST_PROJECT_ID || "56116000000209001";
process.env.CATALYST_ENVIRONMENT = process.env.CATALYST_ENVIRONMENT || "Development";
process.env.QUICKML_ACCESS_TOKEN = process.env.QUICKML_ACCESS_TOKEN || "";

// Load functions & repository
const chatHandler = require("./datathon-chatbot/functions/chat/index.js");
const insightsHandler = require("./datathon-chatbot/functions/insights/index.js");
const CrimeRepository = require("./datathon-chatbot/functions/chat/datastore.js");
const hardwareManager = require("./backend/hardwareManager.js");

const PORT = process.env.PORT || 3000;

const MIME_TYPES = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".geojson": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".woff": "font/woff",
    ".woff2": "font/woff2"
};

function serveStaticFile(req, res, pathname) {
    const distPath = path.join(__dirname, "frontend/dist");
    if (!fs.existsSync(distPath)) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: "Frontend build not found. Run 'npm run build' first." }));
        return;
    }

    let cleanPath = pathname;
    if (cleanPath.includes("/assets/")) {
        cleanPath = cleanPath.substring(cleanPath.indexOf("/assets/"));
    }

    let filePath = path.join(distPath, cleanPath);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(distPath, "index.html");
    }

    if (!fs.existsSync(filePath) && !path.extname(cleanPath)) {
        filePath = path.join(distPath, "index.html");
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || "application/octet-stream";
        res.writeHead(200, {
            "Content-Type": contentType,
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        });
        fs.createReadStream(filePath).pipe(res);
    } else {
        const indexHtml = path.join(distPath, "index.html");
        if (fs.existsSync(indexHtml)) {
            res.writeHead(200, { "Content-Type": "text/html" });
            fs.createReadStream(indexHtml).pipe(res);
        } else {
            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
        }
    }
}

const server = http.createServer(async (req, res) => {
    // Add CORS headers
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        res.writeHead(204);
        res.end();
        return;
    }

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    console.log(`[Request] ${req.method} ${pathname}`);

    // Mock Express res methods
    const mockRes = {
        status: (code) => {
            res.statusCode = code;
            return mockRes;
        },
        send: (data) => {
            if (!res.headersSent) {
                res.setHeader("Content-Type", "application/json");
            }
            res.end(typeof data === "object" ? JSON.stringify(data) : data);
            return mockRes;
        }
    };

    const repo = new CrimeRepository(req);

    // 1. Zoho Catalyst Datastore REST API Routes: /api/records
    if (pathname === "/api/records" && req.method === "GET") {
        try {
            const records = await repo.getAllCrimeRecords(parsedUrl.query);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, data: records }));
        } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
    } else if (pathname === "/api/records" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", async () => {
            try {
                const recordData = JSON.parse(body);
                const newRecord = await repo.createCrimeRecord(recordData);
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: newRecord }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname.startsWith("/api/records/") && req.method === "PUT") {
        const id = pathname.replace("/api/records/", "");
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", async () => {
            try {
                const updateData = JSON.parse(body);
                const updated = await repo.updateCrimeRecord(id, updateData);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: updated }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname.startsWith("/api/records/") && req.method === "DELETE") {
        const id = pathname.replace("/api/records/", "");
        try {
            const result = await repo.deleteCrimeRecord(id);
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, data: result }));
        } catch (err) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
    } else if (pathname === "/api/officers" && req.method === "GET") {
        try {
            const officers = await repo.getAllOfficerRecords();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, data: officers }));
        } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
    } else if (pathname === "/api/officers" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", async () => {
            try {
                const officerData = JSON.parse(body);
                const newOfficer = await repo.createOfficerRecord(officerData);
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: newOfficer }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname.startsWith("/api/officers/") && pathname.endsWith("/password") && (req.method === "PUT" || req.method === "POST")) {
        const id = pathname.replace("/api/officers/", "").replace("/password", "");
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", async () => {
            try {
                const { password } = JSON.parse(body);
                const result = await repo.updateOfficerPassword(id, password);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: result }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname === "/api/audit-trail" && req.method === "GET") {
        try {
            const trails = await repo.getBiometricAuditTrails();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, data: trails }));
        } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
    } else if (pathname === "/api/audit-trail" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", async () => {
            try {
                const auditData = JSON.parse(body);
                const recorded = await repo.createAuditTrailRecord(auditData);
                res.writeHead(201, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: recorded }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname === "/api/chat" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", async () => {
            try {
                const reqJson = body ? JSON.parse(body) : {};
                const mockReq = {
                    body: reqJson,
                    headers: req.headers,
                    method: req.method,
                    url: req.url
                };
                await chatHandler(mockReq, mockRes);
            } catch (err) {
                console.error("Error running chat handler:", err);
                res.writeHead(500, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: "Internal server error: " + err.message }));
            }
        });
    } else if (pathname === "/api/insights" && req.method === "GET") {
        const mockReq = {
            body: {},
            headers: req.headers,
            method: req.method,
            url: req.url
        };
        try {
            await insightsHandler(mockReq, mockRes);
        } catch (err) {
            console.error("Error running insights handler:", err);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: "Internal server error: " + err.message }));
        }
    } else if (pathname === "/api/hardware/status" && req.method === "GET") {
        try {
            const status = hardwareManager.getStatus();
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: true, data: status }));
        } catch (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ success: false, error: err.message }));
        }
    } else if (pathname === "/api/hardware/toggle-connection" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", () => {
            try {
                const parsed = body ? JSON.parse(body) : {};
                const newStatus = hardwareManager.setDeviceConnected(parsed.connected !== false);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: newStatus }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname === "/api/hardware/esp32-poll" && (req.method === "GET" || req.method === "POST")) {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", () => {
            try {
                const parsedBody = body ? JSON.parse(body) : {};
                const pollResp = hardwareManager.handleEsp32Poll(parsedBody);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify(pollResp));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ status: "ERROR", error: err.message }));
            }
        });
    } else if (pathname === "/api/hardware/enroll" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", () => {
            try {
                const officerData = body ? JSON.parse(body) : {};
                const result = hardwareManager.startEnrollment(officerData);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: result }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname === "/api/hardware/confirm-enroll" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", () => {
            try {
                const enrollData = body ? JSON.parse(body) : {};
                const result = hardwareManager.confirmEnrollment(enrollData);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: result }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname === "/api/hardware/request-auth" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", () => {
            try {
                const actionData = body ? JSON.parse(body) : {};
                const session = hardwareManager.requestAuth(actionData);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: session }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname === "/api/hardware/scan-biometric" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", () => {
            try {
                const scanData = body ? JSON.parse(body) : {};
                const result = hardwareManager.scanBiometric(scanData.sessionId, scanData);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: result }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else if (pathname === "/api/hardware/verify-otp" && req.method === "POST") {
        let body = "";
        req.on("data", chunk => body += chunk.toString());
        req.on("end", async () => {
            try {
                const verifyData = body ? JSON.parse(body) : {};
                const result = await hardwareManager.verifyOtp(verifyData, repo);
                res.writeHead(200, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: true, data: result }));
            } catch (err) {
                res.writeHead(400, { "Content-Type": "application/json" });
                res.end(JSON.stringify({ success: false, error: err.message }));
            }
        });
    } else {
        // Serve static frontend build assets and single-page application fallback
        serveStaticFile(req, res, pathname);
    }
});

server.listen(PORT, () => {
    console.log(`Local Catalyst Gateway running at http://localhost:${PORT}`);
});
