/**
 * ============================================================================
 * File: functions/chat/tools/districtTool.js
 * ----------------------------------------------------------------------------
 * District Crime Analytics Tool
 * ============================================================================
 */

/**
 * Returns the district with the highest number of crimes.
 */
function topDistrict(analytics) {
    const ranking = analytics.districtRanking || [];

    if (!ranking.length) {
        return {
            source: "districtTool",
            requiresAI: false,
            answer: "District crime statistics are unavailable.",
            data: null
        };
    }

    return {
        source: "districtTool",
        requiresAI: false,
        answer: `${ranking[0].name} has the highest number of reported crimes with ${ranking[0].count} cases.`,
        data: {
            topDistrict: ranking[0],
            ranking
        }
    };
}

/**
 * Compares two districts mentioned in the question.
 */
function compareDistricts(analytics, question) {
    const ranking = analytics.districtRanking || [];
    
    const matches = ranking.filter(d =>
        question.toLowerCase().includes(d.name.toLowerCase())
    );

    if (matches.length < 2) {
        return {
            source: "districtTool",
            requiresAI: true
        };
    }

    return {
        source: "districtTool",
        requiresAI: false,
        answer: `${matches[0].name} has ${matches[0].count} cases, whereas ${matches[1].name} has ${matches[1].count} cases.`,
        data: {
            first: matches[0],
            second: matches[1]
        }
    };
}

module.exports = {
    topDistrict,
    compareDistricts
};
