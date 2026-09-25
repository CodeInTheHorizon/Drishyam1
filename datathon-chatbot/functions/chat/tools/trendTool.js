/**
 * ============================================================================
 * File: functions/chat/tools/trendTool.js
 * ----------------------------------------------------------------------------
 * Trend Analytics Tool
 * ============================================================================
 */

function trend(analytics) {

    const trendData = analytics.monthlyTrend;

    const months = Object.keys(trendData);

    if (months.length < 2) {

        return {

            source: "trendTool",

            requiresAI: true

        };

    }

    const latest = months[months.length - 1];
    const previous = months[months.length - 2];

    const current = trendData[latest];
    const old = trendData[previous];

    const difference = current - old;

    return {

        source: "trendTool",

        requiresAI: false,

        answer:
            `Crime ${difference >= 0 ? "increased" : "decreased"} by ${Math.abs(difference)} cases from ${previous} to ${latest}.`,

        data: {

            trend: trendData

        }

    };

}

module.exports = {

    trend

};