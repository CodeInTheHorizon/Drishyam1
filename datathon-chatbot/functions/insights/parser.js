/**
 * ============================================================================
 * Parses AI-generated insight JSON.
 * ============================================================================
 */

function parseInsights(response) {

    try {

        const text =

            response

                .choices[0]

                .message

                .content

                .trim();

        return JSON.parse(text);

    }

    catch (err) {

        console.error(err);

        return [

            {

                type: "info",

                icon: "alert",

                title: "Insights unavailable",

                description:
                    "Unable to generate AI insights.",

                timestamp: "Just now"

            }

        ];

    }

}

module.exports = {

    parseInsights

};