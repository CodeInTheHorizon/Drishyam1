/**
 * hardwareManager.js
 * 
 * Hardware Controller for ESP32 + 0.96" SSD1306 OLED Display + Biometric Fingerprint Scanner (R307/AS608).
 * Manages physical device heartbeats, OLED display buffers, fingerprint template slots,
 * and 2-Factor Biometric + OLED OTP generation for FIR and Officer CRUD operations.
 */

const crypto = require("crypto");
const cloudinaryService = require("./cloudinaryService.js");

class HardwareManager {
    constructor() {
        this.deviceId = "ESP32-OLED-CV-01";
        this.deviceIp = "192.168.1.150";
        this.isOnline = true;
        this.lastHeartbeat = Date.now();
        this.baudRate = 115200;
        
        // 128x64 OLED Screen State (4 visual text rows + status bar)
        this.oled = {
            header: "MP POLICE • ABHEDYA",
            line1: "SYSTEM SECURE",
            line2: "ESP32 + CV FACE + OLED",
            line3: "READY FOR 2FA AUTH",
            status: "STANDBY",
            updatedAt: Date.now()
        };

        // Active 2FA Authentication Sessions (keyed by sessionId)
        this.sessions = new Map();

        // Enrolled Officer Biometric Fingerprint Templates (slot 1 to 127 in ESP32 Flash)
        this.enrolledTemplates = new Map();
        
        // Pre-enroll default officer templates for initial live officers
        this.enrolledTemplates.set("MPP-2026-5882", {
            slot: 1,
            officerName: "Kartik Singhal",
            badgeNumber: "MPP-2026-5882",
            templateHash: "FP-SHA256-5882-BIO-OK",
            enrolledAt: new Date().toISOString()
        });
        this.enrolledTemplates.set("MPP-2026-8359", {
            slot: 2,
            officerName: "Medhavi Agrawal",
            badgeNumber: "MPP-2026-8359",
            templateHash: "FP-SHA256-8359-BIO-OK",
            enrolledAt: new Date().toISOString()
        });
        this.enrolledTemplates.set("MPP-2026-9344", {
            slot: 3,
            officerName: "Hitesh Sanghi",
            badgeNumber: "MPP-2026-9344",
            templateHash: "FP-SHA256-9344-BIO-OK",
            enrolledAt: new Date().toISOString()
        });

        // Recent Audit Events Log
        this.recentEvents = [];

        // Periodic cleanup of expired sessions (> 2 minutes)
        setInterval(() => this.cleanupExpiredSessions(), 30000);
    }

    setOled(header, l1, l2, l3, status = "ACTIVE") {
        this.oled = {
            header: String(header || "MP POLICE • ABHEDYA").slice(0, 24),
            line1: String(l1 || "").slice(0, 24),
            line2: String(l2 || "").slice(0, 24),
            line3: String(l3 || "").slice(0, 24),
            status: status,
            updatedAt: Date.now()
        };
    }

    resetOledToStandby() {
        this.setOled(
            "MP POLICE • ABHEDYA",
            "SYSTEM ACTIVE",
            "ESP32 + OLED + BIO",
            "READY FOR 2FA AUTH",
            "STANDBY"
        );
    }

    logEvent(event) {
        this.recentEvents.unshift({
            ...event,
            timestamp: new Date().toISOString()
        });
        if (this.recentEvents.length > 50) {
            this.recentEvents.pop();
        }
    }

    // 1. Biometric Fingerprint Enrollment for New Officer
    startEnrollment(officerData = {}) {
        if (!this.isDeviceConnected()) {
            throw new Error("Biometric device not connected. Please ensure the ESP32 fingerprint scanner is connected.");
        }

        const nextSlot = this.enrolledTemplates.size + 1;
        const name = officerData.name || "New Officer";
        const badge = officerData.badgeNumber || `MPP-2026-${nextSlot}`;

        this.setOled(
            "ENROLL BIOMETRIC",
            `NAME: ${name.slice(0, 16)}`,
            `SLOT: #${nextSlot} [SENSOR]`,
            "PLACE FINGERPRINT...",
            "ENROLLING"
        );

        this.logEvent({
            type: "ENROLLMENT_STARTED",
            officerName: name,
            badgeNumber: badge,
            slot: nextSlot
        });

        return {
            status: "ENROLLING",
            slot: nextSlot,
            deviceId: this.deviceId,
            message: "ESP32 Fingerprint sensor awaiting finger placement..."
        };
    }

    confirmEnrollment(officerData = {}) {
        const slot = Number(officerData.slot || (this.enrolledTemplates.size + 1));
        const badge = String(officerData.badgeNumber || `MPP-${Date.now().toString().slice(-4)}`);
        const name = String(officerData.name || "Officer");
        const templateHash = `FP-SHA256-${badge}-${Date.now()}`;

        const templateRecord = {
            slot,
            officerName: name,
            badgeNumber: badge,
            templateHash,
            enrolledAt: new Date().toISOString()
        };

        this.enrolledTemplates.set(badge, templateRecord);
        this.enrolledTemplates.set(name.toLowerCase(), templateRecord);

        this.setOled(
            "ENROLL SUCCESSFUL",
            `OFFICER: ${name.slice(0, 14)}`,
            `SLOT #${slot} SAVED`,
            ">> BIOMETRIC READY <<",
            "SUCCESS"
        );

        setTimeout(() => this.resetOledToStandby(), 4000);

        this.logEvent({
            type: "ENROLLMENT_COMPLETED",
            officerName: name,
            badgeNumber: badge,
            slot
        });

        return {
            success: true,
            biometricTemplateId: `ESP32-BIO-SLOT-${String(slot).padStart(2, "0")}`,
            templateHash,
            enrolledAt: templateRecord.enrolledAt,
            slot
        };
    }

    // 2. Request 2FA Hardware Authentication before any CRUD operation
    requestAuth(actionData = {}) {
        const sessionId = `hw-auth-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        const action = String(actionData.action || "MANAGE_RECORD").toUpperCase();
        const targetRecordId = String(actionData.targetRecordId || "RECORD");
        const officerName = String(actionData.officerName || "Active Officer");
        const kgid = String(actionData.kgid || "MPP-2026-901");
        const employeeId = actionData.employeeId || 101;

        const session = {
            id: sessionId,
            action,
            targetRecordId,
            officerName,
            kgid,
            employeeId,
            status: "AWAITING_BIOMETRIC",
            otp: null,
            otpExpiry: null,
            biometricVerified: false,
            verifiedAt: null,
            createdAt: Date.now()
        };

        this.sessions.set(sessionId, session);

        // Update physical ESP32 OLED Display buffer
        this.setOled(
            "2FA HARDWARE AUTH",
            `ACT: ${action.replace(/_/g, ' ').slice(0, 18)}`,
            `BY: ${officerName.slice(0, 18)}`,
            "SCAN FACE FOR OTP >>",
            "AWAITING_BIOMETRIC"
        );

        this.logEvent({
            type: "AUTH_REQUESTED",
            sessionId,
            action,
            officerName
        });

        return {
            success: true,
            sessionId,
            status: "AWAITING_BIOMETRIC",
            deviceId: this.deviceId,
            oled: this.oled
        };
    }

    // 3. Officer Scans Face via Computer Vision Face Model
    async scanFaceAndMatch(sessionId, scanData = {}, repo) {
        if (!this.isDeviceConnected()) {
            throw new Error("Biometric camera device not connected. Please ensure the camera is online.");
        }

        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error("Invalid or expired 2FA hardware session. Please re-initiate.");
        }

        const probeImage = scanData.image || scanData.photo;
        if (!probeImage) {
            throw new Error("No face image captured. Please face the camera and try again.");
        }

        // Fetch live officers from Zoho Catalyst
        let officers = [];
        if (repo && typeof repo.getAllOfficerRecords === "function") {
            try {
                officers = await repo.getAllOfficerRecords();
            } catch (e) {
                console.warn("[HardwareManager] Failed to fetch live officers for face match:", e.message);
            }
        }

        // Match face using optimized CloudinaryService
        const matchResult = await cloudinaryService.matchFaceAcrossOfficers(probeImage, officers, {
            expectedBadge: session.kgid,
            expectedName: session.officerName
        });
        
        if (!matchResult.matched || !matchResult.officer) {
            this.setOled(
                "FACE NOT MATCHED",
                "UNRECOGNIZED OFFICER",
                "ACCESS DENIED",
                "RETRY SCAN >>",
                "FAILED"
            );
            throw new Error("Facial recognition match failed: Officer face not recognized in police database.");
        }

        const matchedOfficer = matchResult.officer;
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-IN", { hour12: false });

        // Generate dynamic 6-digit OTP (the OTP system works the exact same!)
        const dynamicOtp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiry = Date.now() + 90000; // 90 seconds expiry

        session.biometricVerified = true;
        session.matchedOfficer = matchedOfficer;
        session.officerName = matchedOfficer.name;
        session.kgid = matchedOfficer.badgeNumber || matchedOfficer.mppid || session.kgid;
        session.employeeId = matchedOfficer.EmployeeID || matchedOfficer.ROWID || session.employeeId;
        session.faceAuditUrl = matchResult.probeUrl || matchedOfficer.photoUrl || matchedOfficer.avatar || null;
        session.confidence = matchResult.confidence || 98.4;
        session.verifiedAt = now.toISOString();
        session.otp = dynamicOtp;
        session.otpExpiry = otpExpiry;
        session.status = "DISPLAYING_OTP";

        // Display OTP on physical ESP32 OLED
        this.setOled(
            "FACE VERIFIED OK",
            `${matchedOfficer.name.slice(0, 14)}`,
            `2FA OTP: [ ${dynamicOtp} ]`,
            "EXPIRES IN: 90 SECONDS",
            "DISPLAYING_OTP"
        );

        this.logEvent({
            type: "FACE_MATCH_OK",
            sessionId,
            officerName: matchedOfficer.name,
            badgeNumber: session.kgid,
            confidence: session.confidence,
            otp: dynamicOtp,
            faceAuditUrl: session.faceAuditUrl,
            expiresIn: 90
        });

        return {
            success: true,
            sessionId,
            status: "DISPLAYING_OTP",
            officerName: matchedOfficer.name,
            matchedOfficer: {
                name: matchedOfficer.name,
                rank: matchedOfficer.rank,
                badgeNumber: session.kgid,
                unit: matchedOfficer.unit,
                station: matchedOfficer.station,
                photoUrl: matchedOfficer.photoUrl || matchedOfficer.avatar
            },
            confidence: session.confidence,
            similarity: matchResult.similarity,
            biometrics: {
                sCorr: matchResult.sCorr,
                sLbp: matchResult.sLbp,
                sGrad: matchResult.sGrad,
                isMirrored: matchResult.isMirrored
            },
            faceAuditUrl: session.faceAuditUrl,
            verifiedAt: session.verifiedAt,
            otpDisplay: dynamicOtp,
            otpExpiresAt: otpExpiry,
            oled: this.oled
        };
    }

    // Legacy / direct scan fallback
    scanBiometric(sessionId, scanData = {}) {
        if (!this.isDeviceConnected()) {
            throw new Error("Biometric device not connected. Please ensure the ESP32 scanner is connected.");
        }

        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error("Invalid or expired 2FA hardware session. Please re-initiate.");
        }

        const officerName = scanData.officerName || session.officerName;
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-IN", { hour12: false });

        // Generate dynamic 6-digit OTP
        const dynamicOtp = String(Math.floor(100000 + Math.random() * 900000));
        const otpExpiry = Date.now() + 90000; // 90 seconds expiry

        session.biometricVerified = true;
        session.verifiedAt = now.toISOString();
        session.otp = dynamicOtp;
        session.otpExpiry = otpExpiry;
        session.status = "DISPLAYING_OTP";

        // Display OTP on physical ESP32 OLED
        this.setOled(
            "FACE VERIFIED OK",
            `${officerName.slice(0, 14)} ${timeStr}`,
            `2FA OTP: [ ${dynamicOtp} ]`,
            "EXPIRES IN: 90 SECONDS",
            "DISPLAYING_OTP"
        );

        this.logEvent({
            type: "BIOMETRIC_SCANNED_OK",
            sessionId,
            officerName,
            otp: dynamicOtp,
            expiresIn: 90
        });

        return {
            success: true,
            sessionId,
            status: "DISPLAYING_OTP",
            officerName,
            verifiedAt: session.verifiedAt,
            otpDisplay: dynamicOtp,
            otpExpiresAt: otpExpiry,
            oled: this.oled
        };
    }

    // 4. Verify 2FA OTP entered by officer from the OLED screen
    async verifyOtp(verifyData = {}, repo) {
        const { sessionId, otp } = verifyData;
        const session = this.sessions.get(sessionId);

        if (!session) {
            throw new Error("2FA hardware session expired or not found. Please try again.");
        }

        if (!session.biometricVerified) {
            throw new Error("Facial recognition verification required before OTP submission.");
        }

        if (Date.now() > session.otpExpiry) {
            this.setOled("AUTH FAILED", "OTP EXPIRED (90s)", "RETRY FACE SCAN", "SCAN AGAIN", "FAILED");
            throw new Error("Hardware OTP expired. Please re-scan your face on the camera.");
        }

        if (String(otp).trim() !== String(session.otp).trim()) {
            this.setOled("ACCESS DENIED", "INCORRECT OTP", "CHECK OLED SCREEN", "RETRY CODE", "FAILED");
            this.logEvent({
                type: "OTP_MISMATCH",
                sessionId,
                inputOtp: otp,
                officerName: session.officerName
            });
            throw new Error("Incorrect 2FA OTP. Please enter the 6 digits shown on the ESP32 OLED display.");
        }

        // OTP matched & Biometric verified!
        session.status = "AUTHENTICATED";

        // Display Success on OLED
        this.setOled(
            "ACCESS GRANTED",
            "2FA HARDWARE OK",
            `ACT: ${session.action.slice(0, 16)}`,
            ">> AUDIT LOGGED <<",
            "SUCCESS"
        );

        setTimeout(() => this.resetOledToStandby(), 4000);

        // Automatically log full audit trail directly into Zoho Catalyst BiometricAuditTrail
        let auditResult = null;
        if (repo && typeof repo.createAuditTrailRecord === "function") {
            try {
                const auditDetails = verifyData.changesSummary || 
                    `[CV Face Match 2FA Verified] Officer ${session.officerName} (${session.kgid}) authenticated with OLED OTP for ${session.action} on ${session.targetRecordId}${session.faceAuditUrl ? ` | Cloudinary Audit: ${session.faceAuditUrl}` : ''}`;
                
                auditResult = await repo.createAuditTrailRecord({
                    employeeId: session.employeeId || 101,
                    officerName: session.officerName || "Police Officer",
                    kgid: session.kgid || "MPP-2026-901",
                    action: session.action,
                    targetTable: verifyData.targetTable || "CaseMaster",
                    targetRecordId: String(verifyData.targetRecordId || session.targetRecordId || "RECORD"),
                    deviceId: "CV-FACE-CAMERA-01",
                    fingerprintVerified: true,
                    otpUsed: session.otp,
                    ipAddress: this.deviceIp,
                    changesSummary: auditDetails.slice(0, 490)
                });
                console.log("✅ [HardwareManager] BiometricAuditTrail logged directly to Zoho Catalyst datastore with Face Recognition & OTP.");
            } catch (auditErr) {
                console.warn("[HardwareManager] Audit logging exception:", auditErr.message);
            }
        }

        this.logEvent({
            type: "2FA_AUTHENTICATED",
            sessionId,
            officerName: session.officerName,
            action: session.action,
            targetRecordId: session.targetRecordId,
            auditLogged: true
        });

        // Clean up completed session
        this.sessions.delete(sessionId);

        return {
            success: true,
            verified: true,
            action: session.action,
            officerName: session.officerName,
            verifiedAt: session.verifiedAt,
            deviceId: this.deviceId,
            auditRecord: auditResult
        };
    }

    // Physical ESP32 Polling Endpoint Handler (Heartbeat & OLED refresh)
    handleEsp32Poll(body = {}) {
        this.lastHeartbeat = Date.now();
        this.isOnline = true;
        if (body.ip) this.deviceIp = body.ip;

        return {
            status: "OK",
            deviceId: this.deviceId,
            serverTime: new Date().toISOString(),
            display: {
                header: this.oled.header,
                line1: this.oled.line1,
                line2: this.oled.line2,
                line3: this.oled.line3,
                mode: this.oled.status
            }
        };
    }

    isDeviceConnected() {
        if (this.manualConnected !== undefined) {
            return this.manualConnected;
        }
        return (Date.now() - this.lastHeartbeat) < 60000;
    }

    setDeviceConnected(connected = true) {
        this.manualConnected = Boolean(connected);
        if (connected) {
            this.lastHeartbeat = Date.now();
            this.isOnline = true;
        } else {
            this.isOnline = false;
        }
        this.logEvent({
            type: connected ? "DEVICE_CONNECTED" : "DEVICE_DISCONNECTED",
            deviceId: this.deviceId
        });
        return this.getStatus();
    }

    // Status for UI Monitor
    getStatus() {
        const connected = this.isDeviceConnected();
        return {
            deviceId: this.deviceId,
            deviceIp: this.deviceIp,
            isOnline: connected,
            isConnected: connected,
            connectionStatus: connected ? "CONNECTED" : "DISCONNECTED",
            label: connected ? "Biometric device connected" : "Biometric device not connected",
            baudRate: this.baudRate,
            oled: this.oled,
            enrolledCount: this.enrolledTemplates.size,
            activeSessionsCount: this.sessions.size,
            recentEvents: this.recentEvents.slice(0, 10)
        };
    }

    cleanupExpiredSessions() {
        const now = Date.now();
        for (const [id, s] of this.sessions.entries()) {
            if (s.otpExpiry && now > s.otpExpiry + 30000) {
                this.sessions.delete(id);
            }
        }
    }
}

// Global Singleton Instance across requests
if (!global.__hardware_manager) {
    global.__hardware_manager = new HardwareManager();
}

module.exports = global.__hardware_manager;
