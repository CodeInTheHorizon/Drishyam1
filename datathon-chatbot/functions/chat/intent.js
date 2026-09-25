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
 *
 * @returns {Object}
 */
function detectIntent(question) {

    const q = question.toLowerCase();

    /**
     * Highest crime district.
     */
    if (

        q.includes("highest district")

        ||

        q.includes("highest crime district")

        ||

        q.includes("top district")

    ) {

        return {

            intent: INTENTS.DISTRICT_TOP

        };

    }

    /**
     * Compare districts.
     */
    if (

        q.includes("compare")

        ||

        q.includes("vs")

    ) {

        return {

            intent: INTENTS.DISTRICT_COMPARE

        };

    }

    /**
     * Officer.
     */
    if (

        q.includes("officer")

        ||

        q.includes("inspector")

    ) {

        return {

            intent: INTENTS.OFFICER_TOP

        };

    }

    /**
     * Pending.
     */
    if (

        q.includes("pending")

    ) {

        return {

            intent: INTENTS.PENDING_CASES

        };

    }

    /**
     * Hotspots.
     */
    if (

        q.includes("hotspot")

        ||

        q.includes("map")

    ) {

        return {

            intent: INTENTS.HOTSPOTS

        };

    }

    /**
     * Trends.
     */
    if (

        q.includes("trend")

        ||

        q.includes("increase")

        ||

        q.includes("decrease")

    ) {

        return {

            intent: INTENTS.TREND

        };

    }

    /**
     * Category.
     */
    if (

        q.includes("category")

        ||

        q.includes("crime type")

    ) {

        return {

            intent: INTENTS.CRIME_CATEGORY

        };

    }

    /**
     * Summary.
     */
    if (

        q.includes("summary")

        ||

        q.includes("overview")

    ) {

        return {

            intent: INTENTS.SUMMARY

        };

    }

    /**
     * AI Reasoning.
     */
    if (

        q.includes("why")

        ||

        q.includes("recommend")

        ||

        q.includes("suggest")

        ||

        q.includes("predict")

        ||

        q.includes("explain")

    ) {

        return {

            intent: INTENTS.REASONING

        };

    }

    /**
     * Unknown.
     */
    return {

        intent: INTENTS.UNKNOWN

    };

}

module.exports = {

    detectIntent,

    INTENTS

};