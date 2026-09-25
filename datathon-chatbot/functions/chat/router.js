/**
 * ============================================================================
 * File: functions/chat/router.js
 * ----------------------------------------------------------------------------
 * AI Agent Router
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * Receives detected intent.
 *
 * Chooses the correct tool.
 *
 * Decides whether QuickML is required.
 *
 * Returns standardized output.
 * ============================================================================
 */

const { INTENTS } = require("./intent");

/**
 * Tool Imports
 */
const districtTool = require("./tools/districtTool");
const officerTool = require("./tools/officerTool");
const crimeTool = require("./tools/crimeTool");
const trendTool = require("./tools/trendTool");
const hotspotTool = require("./tools/hotspotTool");

/**
 * Route request.
 *
 * @param {Object} intent
 * @param {Object} analytics
 * @param {String} question
 */
async function route(intent, analytics, question) {

    switch (intent.intent) {

        /**
         * Highest Crime District
         */
        case INTENTS.DISTRICT_TOP:

            return districtTool.topDistrict(
                analytics
            );

        /**
         * District Comparison
         */
        case INTENTS.DISTRICT_COMPARE:

            return districtTool.compareDistricts(
                analytics,
                question
            );

        /**
         * Officer Performance
         */
        case INTENTS.OFFICER_TOP:

            return officerTool.bestOfficer(
                analytics
            );

        /**
         * Crime Trends
         */
        case INTENTS.TREND:

            return trendTool.trend(
                analytics
            );

        /**
         * Crime Categories
         */
        case INTENTS.CRIME_CATEGORY:

            return crimeTool.categorySummary(
                analytics
            );

        /**
         * Hotspots
         */
        case INTENTS.HOTSPOTS:

            return hotspotTool.hotspots(
                analytics
            );

        /**
         * Needs AI Reasoning
         */
        case INTENTS.REASONING:

            return {

                requiresAI: true

            };

        /**
         * Unknown
         */
        default:

            return {

                requiresAI: true

            };

    }

}

module.exports = {

    route

};