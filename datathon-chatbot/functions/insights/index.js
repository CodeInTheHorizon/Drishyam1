/**
 * ============================================================================
 * File: functions/insights/index.js
 * ----------------------------------------------------------------------------
 * AI Insights Controller
 *
 * Endpoint:
 * GET /api/insights
 *
 * Responsibilities
 * ----------------------------------------------------------------------------
 * • Fetch crime data
 * • Generate analytics
 * • Ask QuickML for dashboard insights
 * • Return structured JSON
 * ============================================================================
 */

const catalyst = require("zcatalyst-sdk-node");

const CrimeRepository = require("../chat/datastore");
const { generateAnalytics } = require("../chat/analytics");

const { buildInsightsPrompt } = require("./prompt");
const { parseInsights } = require("./parser");

const QuickMLService = require("../chat/quickml");

module.exports = async (req, res) => {

    try {

        const app = catalyst.initialize(req);

        const repository =
            new CrimeRepository(req);

        const records =
            await repository.getCrimeAnalyticsData();

        const analytics =
            generateAnalytics(records);

        const prompt =
            buildInsightsPrompt(analytics);

        const quickml =
            new QuickMLService(app);

        const response =
            await quickml.generate(prompt);

        const insights =
            parseInsights(response);

        return res.send({

            success: true,

            insights

        });

    }

    catch (err) {

        console.error(err);

        return res.status(500).send({

            success: false,

            error: err.message

        });

    }

};