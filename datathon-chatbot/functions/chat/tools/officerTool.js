/**
 * ============================================================================
 * File: functions/chat/tools/officerTool.js
 * ----------------------------------------------------------------------------
 * Officer Analytics Tool
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Top performing officer
 * • Officer ranking
 * • Officer comparison
 * ============================================================================
 */

/**
 * Returns officers sorted by handled cases.
 */
function getOfficerRanking(analytics) {

    return [...analytics.officerPerformance]
        .sort((a, b) => b.count - a.count);

}

/**
 * Returns best officer.
 */
function bestOfficer(analytics) {

    const ranking = getOfficerRanking(analytics);

    if (!ranking.length) {

        return {

            source: "officerTool",

            requiresAI: false,

            answer: "Officer statistics are unavailable.",

            data: null

        };

    }

    return {

        source: "officerTool",

        requiresAI: false,

        answer: `${ranking[0].name} handled the highest number of cases (${ranking[0].count}).`,

        data: {

            officer: ranking[0],

            ranking

        }

    };

}

/**
 * Compare officers.
 */
function compareOfficers(analytics, question) {

    const ranking = getOfficerRanking(analytics);

    const matches = ranking.filter(officer =>
        question
            .toLowerCase()
            .includes(officer.name.toLowerCase())
    );

    if (matches.length < 2) {

        return {

            source: "officerTool",

            requiresAI: true

        };

    }

    return {

        source: "officerTool",

        requiresAI: false,

        answer:
            `${matches[0].name} handled ${matches[0].count} cases while ${matches[1].name} handled ${matches[1].count} cases.`,

        data: {

            first: matches[0],

            second: matches[1]

        }

    };

}

module.exports = {

    bestOfficer,

    compareOfficers

};