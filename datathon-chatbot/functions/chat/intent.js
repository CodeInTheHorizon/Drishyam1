/**
 * ============================================================================
 * File: functions/chat/intent.js
 * ----------------------------------------------------------------------------
 * Intent Classifier
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * Determines what the officer is asking.
 *
 * IMPORTANT
 * ----------------------------------------------------------------------------
 * This is NOT AI.
 *
 * It is deterministic.
 *
 * That means:
 *
 * Fast
 * Reliable
 * Cheap
 * Predictable
 *
 * ============================================================================
 */

/**
 * Intent Types
 */
const INTENTS = {
    DISTRICT_TOP: "district_top",
    DISTRICT_COMPARE: "district_compare",
    OFFICER_TOP: "officer_top",
    CRIME_CATEGORY: "crime_category",
    PENDING_CASES: "pending_cases",
    HOTSPOTS: "hotspots",
    TREND: "trend",
    SUMMARY: "summary",
    REASONING: "reasoning",
    UNKNOWN: "unknown"
};

/**
 * Detect user intent.
 *
 * @param {String} question
 * @returns {Object}
 */
function detectIntent(question) {
    const q = (question || "").toLowerCase();

    // Check for multi-district comparison
    const mpDistricts = ["bhopal", "indore", "jabalpur", "gwalior", "ujjain", "sagar", "rewa", "satna", "chhindwara"];
    const detectedDistricts = mpDistricts.filter(d => q.includes(d));

    if (
        q.includes("compare") ||
        q.includes("vs") ||
        q.includes("versus") ||
        q.includes("difference between") ||
        q.includes("तुलना") ||
        q.includes("अंतर") ||
        (detectedDistricts.length >= 2)
    ) {
        return {
            intent: INTENTS.DISTRICT_COMPARE
        };
    }

    // Executive briefing / DGP
    if (
        q.includes("dgp") ||
        q.includes("executive") ||
        q.includes("briefing") ||
        q.includes("brief") ||
        q.includes("leadership") ||
        q.includes("डीजीपी") ||
        q.includes("महानिदेशक") ||
        q.includes("कार्यकारी")
    ) {
        return {
            intent: INTENTS.REASONING
        };
    }

    // Cyber fraud / prevention roadmap
    if (
        q.includes("cyber") ||
        q.includes("fraud") ||
        q.includes("phishing") ||
        q.includes("aeps") ||
        q.includes("digital arrest") ||
        q.includes("साइबर") ||
        q.includes("धोखाधड़ी")
    ) {
        return {
            intent: INTENTS.REASONING
        };
    }

    // Highest crime district
    if (
        q.includes("highest district") ||
        q.includes("highest crime") ||
        q.includes("top district") ||
        q.includes("most crime") ||
        q.includes("maximum crime") ||
        q.includes("शीर्ष जिला") ||
        q.includes("सर्वाधिक") ||
        q.includes("अधिक अपराध")
    ) {
        return {
            intent: INTENTS.DISTRICT_TOP
        };
    }

    // Officer performance & caseload
    if (
        q.includes("officer") ||
        q.includes("inspector") ||
        q.includes("caseload") ||
        q.includes("clearance") ||
        q.includes("investigat") ||
        q.includes("अधिकारी") ||
        q.includes("विवेचक") ||
        q.includes("निरीक्षक") ||
        q.includes("कार्यभार")
    ) {
        return {
            intent: INTENTS.OFFICER_TOP
        };
    }

    // Hotspots & GIS
    if (
        q.includes("hotspot") ||
        q.includes("map") ||
        q.includes("gis") ||
        q.includes("density") ||
        q.includes("patrol") ||
        q.includes("हॉटस्पॉट") ||
        q.includes("नक्शा") ||
        q.includes("गश्त") ||
        q.includes("संवेदनशील क्षेत्र")
    ) {
        return {
            intent: INTENTS.HOTSPOTS
        };
    }

    // Trends
    if (
        q.includes("trend") ||
        q.includes("increase") ||
        q.includes("decrease") ||
        q.includes("trajectory") ||
        q.includes("monthly") ||
        q.includes("प्रवृत्ति") ||
        q.includes("मासिक") ||
        q.includes("वृद्धि") ||
        q.includes("कमी")
    ) {
        return {
            intent: INTENTS.TREND
        };
    }

    // Crime categories
    if (
        q.includes("category") ||
        q.includes("crime type") ||
        q.includes("crime head") ||
        q.includes("heads") ||
        q.includes("वर्ग") ||
        q.includes("प्रकार") ||
        q.includes("श्रेणी")
    ) {
        return {
            intent: INTENTS.CRIME_CATEGORY
        };
    }

    // Pending / Unresolved
    if (
        q.includes("pending") ||
        q.includes("unresolved") ||
        q.includes("लंबित")
    ) {
        return {
            intent: INTENTS.PENDING_CASES
        };
    }

    // Summary / Overview
    if (
        q.includes("summary") ||
        q.includes("overview") ||
        q.includes("सारांश") ||
        q.includes("विवरण")
    ) {
        return {
            intent: INTENTS.SUMMARY
        };
    }

    // AI Reasoning & Analytics
    if (
        q.includes("why") ||
        q.includes("recommend") ||
        q.includes("suggest") ||
        q.includes("predict") ||
        q.includes("forecast") ||
        q.includes("explain") ||
        q.includes("roadmap") ||
        q.includes("कारण") ||
        q.includes("सुझाव") ||
        q.includes("निवारण")
    ) {
        return {
            intent: INTENTS.REASONING
        };
    }

    return {
        intent: INTENTS.UNKNOWN
    };
}

module.exports = {
    detectIntent,
    INTENTS
};