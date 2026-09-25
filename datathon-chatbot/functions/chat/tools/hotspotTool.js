/**
 * ============================================================================
 * File: functions/chat/tools/hotspotTool.js
 * ----------------------------------------------------------------------------
 * Crime Hotspot Tool
 * ============================================================================
 */

function hotspots(analytics) {

    return {

        source: "hotspotTool",

        requiresAI: false,

        answer:
            `${analytics.hotspotCount} geo-tagged crime records are available for hotspot visualization.`,

        data: {

            hotspotCount: analytics.hotspotCount

        }

    };

}

module.exports = {

    hotspots

};