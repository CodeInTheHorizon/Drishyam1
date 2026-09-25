/**
 * ============================================================================
 * File: functions/chat/analytics.js
 * ----------------------------------------------------------------------------
 * Crime Analytics Engine
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * Converts raw Catalyst Data Store records into structured KPIs.
 *
 * The LLM should NEVER receive raw records.
 * It should receive summarized analytics only.
 *
 * This reduces:
 * • Token usage
 * • Hallucinations
 * • Response time
 *
 * ============================================================================
 */

/**
 * Returns top N items from an object sorted by value.
 *
 * Example:
 * {
 *   Bengaluru: 120,
 *   Mysuru: 95
 * }
 */
function getTopItems(counter, limit = 5) {

    return Object.entries(counter)

        .sort((a, b) => b[1] - a[1])

        .slice(0, limit)

        .map(([name, count]) => ({
            name,
            count
        }));

}

function countBy(records, fieldGetter) {
    const counts = {};
    for (const record of records) {
        let value = typeof fieldGetter === "function" ? fieldGetter(record) : (record[fieldGetter] || "Unknown");
        if (!value) value = "Unknown";
        counts[value] = (counts[value] || 0) + 1;
    }
    return counts;
}

/**
 * Calculates monthly crime trend.
 */
function calculateMonthlyTrend(records) {
    const trend = {};
    records.forEach(record => {
        const dateStr = record.regDate || record.CrimeRegisteredDate || record.crimeDate;
        if (!dateStr) return;

        const dateObj = new Date(dateStr);
        if (isNaN(dateObj.getTime())) return;

        const month = dateObj.toLocaleString("default", {
            month: "short",
            year: "numeric"
        });

        trend[month] = (trend[month] || 0) + 1;
    });
    return trend;
}

/**
 * Calculates pending / resolved cases.
 */
function calculateCaseStatus(records) {
    let pending = 0;
    let resolved = 0;

    records.forEach(record => {
        const status = (record.status || record.Status || "").toLowerCase();
        if (status.includes("under investigation") || status.includes("pending") || status.includes("suspect")) {
            pending++;
        } else {
            resolved++;
        }
    });

    return {
        pending,
        resolved
    };
}

/**
 * Generates all analytics.
 */
function generateAnalytics(records) {
    const districtCounter = countBy(records, r => r.district || r.District);
    const categoryCounter = countBy(records, r => r.crimeHead || r.CrimeCategory || r.category);
    const officerCounter = countBy(records, r => r.allottedOfficerName || r.OfficerName || r.officer);
    const monthlyTrend = calculateMonthlyTrend(records);
    const statusSummary = calculateCaseStatus(records);
    const totalCases = records.length;
    const hotspots = records.filter(r => (r.latitude || r.lat) && (r.longitude || r.lng)).length;

    return {
        generatedAt: new Date().toISOString(),
        totalCases,
        districtRanking: getTopItems(districtCounter),
        crimeCategories: getTopItems(categoryCounter),
        officerPerformance: getTopItems(officerCounter),
        monthlyTrend,
        caseStatus: statusSummary,
        hotspotCount: hotspots
    };
}

module.exports = {
    generateAnalytics
};