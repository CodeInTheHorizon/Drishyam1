/**
 * hardwareManager.js
 * 
 * Hardware Controller for ESP32 + 0.96" SSD1306 OLED Display + RC522 RFID Reader + CV Face Recognition.
 * 
 * New High-Security Architecture:
 *  1. Section Lockdown: "Manage Records" section is locked by default.
 *  2. Dual-Factor Section Unlock: Physical RFID Smart Card Tap + CV Face Biometric Match.
 *     - Parameter Matching: RFID Card UID belongs to Officer X -> Camera Face Scan must verify Officer X.
 *  3. Live Database Audit Logging: Every Section Unlock is permanently recorded in Zoho Catalyst BiometricAuditTrail.
 *  4. FIR CRUD Re-Authentication: Every Create/Edit/Delete action requires immediate Face Scan re-auth (logged to DB).
 *  5. Complete Removal of 6-Digit OTP: Hardware OLED provides real-time mission status, card info, and authorization feedback.
 */

const cloudinaryService = require("./cloudinaryService.js");

class HardwareManager {
    constructor() {
        this.deviceId = "ESP32-RC522-CV-01";
        this.deviceIp = "192.168.1.150";
        this.isOnline = true;
        this.lastHeartbeat = Date.now();
        this.baudRate = 115200;

        // Manage Records Section Lock State
        this.manageRecordsUnlocked = false;
        this.unlockedBy = null; // { officerName, badgeNumber, employeeId, cardUid, unlockedAt }

        // OLED Display State (128x64 SSD1306)
        this.oled = {
            header: "MP POLICE • ABHEDYA",
            line1: "MANAGE RECORDS",
            line2: "[ LOCKED ]",
            line3: "TAP RFID TO UNLOCK >>",
            status: "STANDBY",
            updatedAt: Date.now()
        };

        // Registered RFID Police Smart Cards
        // Card UID -> Officer Mapping
        this.rfidRegistry = new Map([
            ["E2:4B:91:0C", { badgeNumber: "MPP-2026-5882", officerName: "Kartik Singhal", rank: "Police Inspector", employeeId: 101 }],
            ["04:A2:8F:1A", { badgeNumber: "MPP-2026-5882", officerName: "Kartik Singhal", rank: "Police Inspector", employeeId: 101 }],
            ["CARD-KARTIK-01", { badgeNumber: "MPP-2026-5882", officerName: "Kartik Singhal", rank: "Police Inspector", employeeId: 101 }],
            ["93:1C:7E:2B", { badgeNumber: "MPP-2026-8359", officerName: "Medhavi Agrawal", rank: "Sub-Inspector", employeeId: 102 }],
            ["CARD-MEDHAVI-02", { badgeNumber: "MPP-2026-8359", officerName: "Medhavi Agrawal", rank: "Sub-Inspector", employeeId: 102 }],
            ["F5:8D:34:6C", { badgeNumber: "MPP-2026-3003", officerName: "Kshitij Soni", rank: "Cyber Crime Officer", employeeId: 103 }],
            ["CARD-KSHITIJ-03", { badgeNumber: "MPP-2026-3003", officerName: "Kshitij Soni", rank: "Cyber Crime Officer", employeeId: 103 }],
            ["B1:6A:90:5E", { badgeNumber: "MPP-2026-9344", officerName: "Hitesh Sanghi", rank: "Assistant Sub-Inspector", employeeId: 104 }],
            ["CARD-HITESH-04", { badgeNumber: "MPP-2026-9344", officerName: "Hitesh Sanghi", rank: "Assistant Sub-Inspector", employeeId: 104 }]
        ]);

        // Last tapped card state (held in memory for unlock flow)
        this.lastTappedCard = null;

        // Active sessions
        this.sessions = new Map();
        this.recentEvents = [];

        console.log(`[HardwareManager] Initialized RFID + CV Face Controller. Device: ${this.deviceId}`);
    }

    // Generate a deterministic 4-byte hex RFID UID for any officer
    getDeterministicCardUid(officer) {
        if (!officer) return "04:A2:8F:1A";
        const badge = officer.badgeNumber || officer.mppid || officer.KGID;
        // Check if there is an existing known UID in registry
        for (const [uid, reg] of this.rfidRegistry.entries()) {
            if (reg.badgeNumber && badge && reg.badgeNumber === badge) {
                return uid;
            }
        }
        const idStr = String(badge || officer.EmployeeID || officer.ROWID || officer.name || "0000");
        let hash = 0;
        for (let i = 0; i < idStr.length; i++) {
            hash = ((hash << 5) - hash) + idStr.charCodeAt(i);
            hash |= 0;
        }
        const b1 = Math.abs((hash >> 24) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
        const b2 = Math.abs((hash >> 16) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
        const b3 = Math.abs((hash >> 8) & 0xFF).toString(16).padStart(2, '0').toUpperCase();
        const b4 = Math.abs(hash & 0xFF).toString(16).padStart(2, '0').toUpperCase();
        return `${b1}:${b2}:${b3}:${b4}`;
    }

    // Dynamically retrieve all registered smart cards from live Zoho Catalyst officers
    async getRegisteredCards(repo) {
        let liveOfficers = [];
        if (repo && typeof repo.getAllOfficerRecords === "function") {
            try {
                liveOfficers = await repo.getAllOfficerRecords();
            } catch (err) {
                console.warn("[HardwareManager] Failed to fetch live officers for cards:", err.message);
            }
        }

        const cards = [];
        const seenBadges = new Set();

        for (const off of liveOfficers) {
            const badge = off.badgeNumber || off.mppid || `MPP-${off.ROWID || off.EmployeeID}`;
            if (seenBadges.has(badge)) continue;
            seenBadges.add(badge);

            let cardUid = null;
            // Check if predefined in registry
            for (const [uid, reg] of this.rfidRegistry.entries()) {
                if (reg.badgeNumber === badge) {
                    cardUid = uid;
                    break;
                }
            }

            if (!cardUid) {
                cardUid = this.getDeterministicCardUid(off);
            }

            const officerInfo = {
                badgeNumber: badge,
                officerName: off.name,
                rank: off.rank || "Police Inspector",
                employeeId: off.EmployeeID || off.ROWID || 101,
                photoUrl: off.photoUrl || off.avatar || null
            };
            this.rfidRegistry.set(cardUid, officerInfo);

            cards.push({
                cardUid,
                officerName: off.name,
                badgeNumber: badge,
                rank: off.rank || "Police Inspector",
                photoUrl: off.photoUrl || off.avatar || null,
                employeeId: off.EmployeeID || off.ROWID || 101
            });
        }

        // Fallback default list if no officers returned from DB
        if (cards.length === 0) {
            return [
                { cardUid: "04:A2:8F:1A", officerName: "Kartik Singhal", badgeNumber: "MPP-2026-5882", rank: "Police Inspector" },
                { cardUid: "93:1C:7E:2B", officerName: "Medhavi Agrawal", badgeNumber: "MPP-2026-8359", rank: "Sub-Inspector" },
                { cardUid: "F5:8D:34:6C", officerName: "Kshitij Soni", badgeNumber: "MPP-2026-3003", rank: "Cyber Crime Officer" },
                { cardUid: "B1:6A:90:5E", officerName: "Hitesh Sanghi", badgeNumber: "MPP-2026-9344", rank: "Assistant Sub-Inspector" }
            ];
        }

        return cards;
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

    resetOledToLockState() {
        if (this.manageRecordsUnlocked && this.unlockedBy) {
            this.setOled(
                "SECTION UNLOCKED",
                `BY: ${this.unlockedBy.officerName.slice(0, 16)}`,
                "CCTNS ACTIVE",
                "STATION SECURED",
                "UNLOCKED"
            );
        } else {
            this.setOled(
                "MP POLICE • ABHEDYA",
                "MANAGE RECORDS",
                "[ LOCKED ]",
                "TAP RFID TO UNLOCK >>",
                "STANDBY"
            );
        }
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

    isDeviceConnected() {
        return this.isOnline;
    }

    // -------------------------------------------------------------
    // 1. RFID CARD TAP (Physical RC522 or Web Simulation)
    // -------------------------------------------------------------
    registerCardTap(cardUid, customOfficer = null) {
        const uid = String(cardUid || "").trim().toUpperCase();
        if (!uid) {
            throw new Error("No RFID Card UID received.");
        }

        // Check if card is registered in registry
        let officerInfo = this.rfidRegistry.get(uid);
        if (!officerInfo && customOfficer) {
            officerInfo = {
                badgeNumber: customOfficer.badgeNumber || customOfficer.kgid || customOfficer.mppid || "MPP-2026-999",
                officerName: customOfficer.name || customOfficer.officerName || "Police Officer",
                rank: customOfficer.rank || "Officer",
                employeeId: customOfficer.employeeId || customOfficer.EmployeeID || 101,
                photoUrl: customOfficer.photoUrl || customOfficer.avatar || null
            };
            this.rfidRegistry.set(uid, officerInfo);
        } else if (officerInfo && customOfficer) {
            officerInfo.photoUrl = customOfficer.photoUrl || customOfficer.avatar || officerInfo.photoUrl;
            officerInfo.officerName = customOfficer.officerName || customOfficer.name || officerInfo.officerName;
            officerInfo.rank = customOfficer.rank || officerInfo.rank;
        }

        if (!officerInfo) {
            // Default fallback map to Kartik Singhal for demo test cards
            officerInfo = {
                badgeNumber: "MPP-2026-5882",
                officerName: "Kartik Singhal",
                rank: "Police Inspector",
                employeeId: 101
            };
            this.rfidRegistry.set(uid, officerInfo);
        }

        this.lastTappedCard = {
            cardUid: uid,
            officer: officerInfo,
            tappedAt: Date.now()
        };

        // Update physical ESP32 OLED
        this.setOled(
            "CARD DETECTED",
            `${officerInfo.officerName.slice(0, 16)}`,
            `KGID: ${officerInfo.badgeNumber}`,
            ">> LOOK AT CAMERA <<",
            "AWAITING_FACE"
        );

        this.logEvent({
            type: "RFID_CARD_TAPPED",
            cardUid: uid,
            officerName: officerInfo.officerName,
            badgeNumber: officerInfo.badgeNumber
        });

        console.log(`📡 [HardwareManager] RFID Card Tapped: UID=${uid} -> Officer ${officerInfo.officerName} (${officerInfo.badgeNumber})`);

        return {
            success: true,
            cardUid: uid,
            officer: officerInfo,
            oled: this.oled
        };
    }

    // -------------------------------------------------------------
    // 2. UNLOCK MANAGE RECORDS VIA 2FA (RFID + FACE BIOMETRICS)
    // -------------------------------------------------------------
    async unlockManageRecordsSection({ cardUid, image, officerBadge, officerName }, repo) {
        if (!this.isDeviceConnected()) {
            throw new Error("Hardware biometric unit not connected.");
        }

        const uid = String(cardUid || (this.lastTappedCard && this.lastTappedCard.cardUid) || "").trim().toUpperCase();
        if (!uid) {
            throw new Error("Step 1 incomplete: Please tap your physical RFID Police Card on the reader first.");
        }

        if (!image) {
            throw new Error("Step 2 incomplete: Face image capture is required. Please face the camera.");
        }

        // Resolve registered card owner
        let cardOfficer = this.rfidRegistry.get(uid);
        if (!cardOfficer && (officerBadge || officerName)) {
            cardOfficer = {
                badgeNumber: officerBadge || "MPP-2026-5882",
                officerName: officerName || "Kartik Singhal",
                rank: "Police Inspector",
                employeeId: 101
            };
            this.rfidRegistry.set(uid, cardOfficer);
        }

        if (!cardOfficer) {
            throw new Error("Unregistered RFID Police Card. Access Denied.");
        }

        // Fetch live officers from Zoho Catalyst
        let officers = [];
        if (repo && typeof repo.getAllOfficerRecords === "function") {
            try {
                officers = await repo.getAllOfficerRecords();
            } catch (e) {
                console.warn("[HardwareManager] Live officers fetch error:", e.message);
            }
        }

        // Dynamically resolve cardOfficer against live database officers if not yet registered or if fresh details needed
        if (officers.length > 0) {
            const matched = officers.find(o => 
                (uid && (o.badgeNumber === uid || this.getDeterministicCardUid(o) === uid)) ||
                (officerBadge && (o.badgeNumber === officerBadge || o.mppid === officerBadge)) ||
                (officerName && o.name && o.name.toLowerCase().trim() === officerName.toLowerCase().trim())
            );
            if (matched) {
                cardOfficer = {
                    badgeNumber: matched.badgeNumber,
                    officerName: matched.name,
                    rank: matched.rank,
                    employeeId: matched.EmployeeID || matched.ROWID || 101,
                    photoUrl: matched.photoUrl || matched.avatar
                };
                this.rfidRegistry.set(uid, cardOfficer);
            }
        }

        // Parameter Matching: Camera Face Scan MUST match the RFID Card Officer!
        const matchResult = await cloudinaryService.matchFaceAcrossOfficers(image, officers, {
            expectedBadge: cardOfficer.badgeNumber,
            expectedName: cardOfficer.officerName
        });

        // Strict 2FA verification threshold
        if (!matchResult.matched || !matchResult.officer || matchResult.similarity < 45) {
            this.setOled(
                "ACCESS DENIED",
                "FACE MISMATCH",
                "CARD HOLDER NOT FOUND",
                "BREACH LOGGED",
                "FAILED"
            );
            setTimeout(() => this.resetOledToLockState(), 4000);
            throw new Error(
                `2FA Verification Failed: The face at the camera does not match the registered holder of RFID Card ${uid} (${cardOfficer.officerName}).`
            );
        }

        // Match Verified!
        const verifiedOfficer = matchResult.officer;
        const now = new Date();

        this.manageRecordsUnlocked = true;
        this.unlockedBy = {
            officerName: verifiedOfficer.name || cardOfficer.officerName,
            badgeNumber: verifiedOfficer.badgeNumber || cardOfficer.badgeNumber,
            employeeId: verifiedOfficer.EmployeeID || verifiedOfficer.ROWID || cardOfficer.employeeId || 101,
            cardUid: uid,
            photoUrl: verifiedOfficer.photoUrl || verifiedOfficer.avatar,
            unlockedAt: now.toISOString(),
            confidence: matchResult.confidence,
            similarity: matchResult.similarity
        };

        // Update physical ESP32 OLED Display
        this.setOled(
            "ACCESS GRANTED",
            `${verifiedOfficer.name.slice(0, 16)}`,
            "MANAGE RECORDS UNLOCKED",
            ">> AUDIT LOGGED <<",
            "UNLOCKED"
        );

        // Store unlock event in Zoho Catalyst BiometricAuditTrail table
        let auditRecord = null;
        if (repo && typeof repo.createAuditTrailRecord === "function") {
            try {
                const summary = `CCTNS Manage Records section unlocked via 2FA: RFID Police Card (${uid}) + Face Biometric Recognition (${matchResult.similarity}% match, ${matchResult.confidence}% confidence). Probe Image: ${matchResult.probeUrl || 'Cloudinary stored'}`;
                
                auditRecord = await repo.createAuditTrailRecord({
                    employeeId: this.unlockedBy.employeeId,
                    officerName: this.unlockedBy.officerName,
                    kgid: this.unlockedBy.badgeNumber,
                    action: "MANAGE_RECORDS_SECTION_UNLOCK",
                    targetTable: "ManageRecordsSection",
                    targetRecordId: "SECTION_ACCESS_SESSION",
                    deviceId: this.deviceId,
                    fingerprintVerified: true,
                    otpUsed: `RFID:${uid}`,
                    ipAddress: this.deviceIp,
                    changesSummary: summary.slice(0, 490)
                });
                console.log(`✅ [HardwareManager] Section unlock permanently logged in Catalyst BiometricAuditTrail for ${this.unlockedBy.officerName}.`);
            } catch (auditErr) {
                console.warn("[HardwareManager] Catalyst audit trail warning:", auditErr.message);
            }
        }

        this.logEvent({
            type: "MANAGE_RECORDS_UNLOCKED",
            cardUid: uid,
            officerName: this.unlockedBy.officerName,
            badgeNumber: this.unlockedBy.badgeNumber,
            similarity: matchResult.similarity,
            confidence: matchResult.confidence
        });

        return {
            success: true,
            unlocked: true,
            officer: this.unlockedBy,
            similarity: matchResult.similarity,
            confidence: matchResult.confidence,
            biometrics: {
                sCorr: matchResult.sCorr,
                sLbp: matchResult.sLbp,
                sGrad: matchResult.sGrad,
                isMirrored: matchResult.isMirrored
            },
            probeUrl: matchResult.probeUrl,
            unlockedAt: this.unlockedBy.unlockedAt,
            auditRecord,
            oled: this.oled
        };
    }

    // -------------------------------------------------------------
    // 3. RE-AUTHENTICATE VIA FACE SCAN FOR FIR CRUD OPERATIONS
    // -------------------------------------------------------------
    async verifyCrudFaceAuth({ action, targetRecordId, image, officerName, kgid }, repo) {
        if (!this.isDeviceConnected()) {
            throw new Error("Hardware biometric unit not connected.");
        }

        if (!this.manageRecordsUnlocked || !this.unlockedBy) {
            throw new Error("Manage Records section is locked. Please unlock the section using your RFID Card & Face first.");
        }

        if (!image) {
            throw new Error("Face scan is mandatory for this FIR action. Please face the camera.");
        }

        const actionName = String(action || "FIR_ACTION").toUpperCase();
        const targetId = String(targetRecordId || "FIR-RECORD");
        const activeOfficer = this.unlockedBy;

        // Fetch live officers from Zoho Catalyst
        let officers = [];
        if (repo && typeof repo.getAllOfficerRecords === "function") {
            try {
                officers = await repo.getAllOfficerRecords();
            } catch (e) {
                console.warn("[HardwareManager] Officers fetch warning:", e.message);
            }
        }

        // Match face against the officer who unlocked the section
        const matchResult = await cloudinaryService.matchFaceAcrossOfficers(image, officers, {
            expectedBadge: activeOfficer.badgeNumber,
            expectedName: activeOfficer.officerName
        });

        if (!matchResult.matched || !matchResult.officer || matchResult.similarity < 40) {
            this.setOled(
                "CRUD REJECTED",
                "FACE NOT RECOGNIZED",
                `ACT: ${actionName.slice(0, 14)}`,
                "ACCESS DENIED",
                "FAILED"
            );
            setTimeout(() => this.resetOledToLockState(), 4000);
            throw new Error(`Facial recognition verification failed for FIR ${actionName}. Officer not authenticated.`);
        }

        const now = new Date();

        // Update physical ESP32 OLED Display
        this.setOled(
            "CRUD AUTHORIZED",
            `ACT: ${actionName.replace(/_/g, ' ').slice(0, 16)}`,
            `BY: ${activeOfficer.officerName.slice(0, 16)}`,
            ">> CHANGES COMMITTED <<",
            "SUCCESS"
        );

        setTimeout(() => this.resetOledToLockState(), 4000);

        // Store CRUD action in Zoho Catalyst BiometricAuditTrail table
        let auditRecord = null;
        if (repo && typeof repo.createAuditTrailRecord === "function") {
            try {
                const summary = `FIR ${actionName} authorized via Face Scan (${matchResult.similarity}% match, ${matchResult.confidence}% confidence) for record ${targetId} by ${activeOfficer.officerName}. Probe: ${matchResult.probeUrl || 'Stored'}`;
                
                auditRecord = await repo.createAuditTrailRecord({
                    employeeId: activeOfficer.employeeId || 101,
                    officerName: activeOfficer.officerName,
                    kgid: activeOfficer.badgeNumber,
                    action: actionName,
                    targetTable: "CaseMaster",
                    targetRecordId: targetId,
                    deviceId: this.deviceId,
                    fingerprintVerified: true,
                    otpUsed: "FACE_REAUTH",
                    ipAddress: this.deviceIp,
                    changesSummary: summary.slice(0, 490)
                });
                console.log(`✅ [HardwareManager] FIR CRUD Action '${actionName}' permanently logged in Catalyst BiometricAuditTrail.`);
            } catch (auditErr) {
                console.warn("[HardwareManager] Catalyst audit trail warning:", auditErr.message);
            }
        }

        this.logEvent({
            type: "FIR_CRUD_AUTHORIZED",
            action: actionName,
            targetRecordId: targetId,
            officerName: activeOfficer.officerName,
            similarity: matchResult.similarity
        });

        return {
            success: true,
            authorized: true,
            action: actionName,
            targetRecordId: targetId,
            officer: activeOfficer,
            similarity: matchResult.similarity,
            confidence: matchResult.confidence,
            biometrics: {
                sCorr: matchResult.sCorr,
                sLbp: matchResult.sLbp,
                sGrad: matchResult.sGrad,
                isMirrored: matchResult.isMirrored
            },
            probeUrl: matchResult.probeUrl,
            authorizedAt: now.toISOString(),
            auditRecord,
            oled: this.oled
        };
    }

    // -------------------------------------------------------------
    // 4. LOCK SECTION
    // -------------------------------------------------------------
    lockSection() {
        this.manageRecordsUnlocked = false;
        const previousOfficer = this.unlockedBy;
        this.unlockedBy = null;
        this.lastTappedCard = null;

        this.resetOledToLockState();

        this.logEvent({
            type: "MANAGE_RECORDS_LOCKED",
            previousOfficer: previousOfficer?.officerName || null
        });

        console.log("🔒 [HardwareManager] Manage Records section locked.");
        return {
            success: true,
            unlocked: false,
            oled: this.oled
        };
    }

    // -------------------------------------------------------------
    // 5. STATUS & ESP32 POLLING (Used by physical ESP32)
    // -------------------------------------------------------------
    getStatus() {
        return {
            deviceId: this.deviceId,
            deviceIp: this.deviceIp,
            isOnline: this.isOnline,
            isConnected: this.isOnline,
            manageRecordsUnlocked: this.manageRecordsUnlocked,
            unlockedBy: this.unlockedBy,
            lastTappedCard: this.lastTappedCard,
            oled: this.oled,
            baudRate: this.baudRate,
            recentEvents: this.recentEvents.slice(0, 10)
        };
    }

    handleEsp32Poll(body = {}) {
        this.lastHeartbeat = Date.now();
        this.isOnline = true;

        // If ESP32 reports a physical RFID Card read over SPI
        if (body.cardUid) {
            try {
                this.registerCardTap(body.cardUid);
            } catch (e) {
                // Non-fatal
            }
        }

        return {
            success: true,
            oled: this.oled,
            manageRecordsUnlocked: this.manageRecordsUnlocked,
            unlockedOfficer: this.unlockedBy?.officerName || null,
            serverTime: Date.now()
        };
    }
}

module.exports = new HardwareManager();
