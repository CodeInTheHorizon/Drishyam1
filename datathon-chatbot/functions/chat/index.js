let catalyst = null;
try {
    catalyst = require("zcatalyst-sdk-node");
} catch (err) {
    catalyst = null;
}

const CrimeRepository = require("./datastore");
const { generateAnalytics } = require("./analytics");
const { detectIntent } = require("./intent");
const { route } = require("./router");
const { buildPrompt } = require("./prompt");
const QuickMLService = require("./quickml");
const { parseResponse } = require("./parser");

module.exports = async (req, res) => {
    try {
        let app = null;
        try {
            app = catalyst ? catalyst.initialize(req) : null;
        } catch (catErr) {
            app = null;
        }

        const message = (req.body?.message || req.body?.question || "").trim();

        const {
            getAnalytics,
            setAnalytics
        } = require("./cache");

        if (!message) {
            return res.status(400).send({
                success: false,
                error: "Message is required."
            });
        }

        /**
         * Load crime records.
         */
        const repository = new CrimeRepository(req);

        const records = await repository.getCrimeAnalyticsData();
        const analytics = generateAnalytics(records);

        /**
         * Detect user intent.
         */
        const intent =
            detectIntent(message);

        /**
         * Route request.
         */
        const toolResponse =
            await route(

                intent,

                analytics,

                message

            );

        /**
         * Tool answered directly.
         */
        if (

            toolResponse &&

            toolResponse.requiresAI === false

        ) {

            return res.send({

                success: true,

                source: toolResponse.source,

                reply: toolResponse.answer,

                data: toolResponse.data,

                timestamp: new Date().toISOString()

            });

        }

        /**
         * Needs AI reasoning.
         */
        const prompt = buildPrompt(

            analytics,

            message

        );

        const quickml =
            new QuickMLService(app);

        const response =
            await quickml.generate(prompt);

        const answer =
            parseResponse(response);

        return res.send({

            success: true,

            source: "quickml",

            reply: answer,

            timestamp: new Date().toISOString()

        });

    }

    catch (error) {

        console.error(error);

        return res.status(500).send({

            success: false,

            error: error.message

        });

    }

};