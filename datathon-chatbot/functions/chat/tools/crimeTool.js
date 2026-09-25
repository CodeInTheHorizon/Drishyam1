/**
 * ============================================================================
 * File: functions/chat/tools/crimeTool.js
 * ----------------------------------------------------------------------------
 * Crime Category Tool
 * ============================================================================
 */

function categorySummary(analytics) {

    const categories = analytics.crimeCategories;

    if (!categories.length) {

        return {

            source: "crimeTool",

            requiresAI: false,

            answer: "Crime category data is unavailable.",

            data: null

        };

    }

    return {

        source: "crimeTool",

        requiresAI: false,

        answer:
            `${categories[0].name} is the most reported crime category with ${categories[0].count} cases.`,

        data: {

            categories

        }

    };

}

module.exports = {

    categorySummary

};