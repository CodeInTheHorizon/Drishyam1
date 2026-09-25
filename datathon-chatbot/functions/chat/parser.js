/**
 * ============================================================================
 * File: functions/chat/parser.js
 * ----------------------------------------------------------------------------
 * Extracts the assistant response from QuickML.
 * ============================================================================
 */

function parseResponse(response) {

    try {

        if (

            response?.choices?.length

        ) {

            return response

                .choices[0]

                .message

                .content

                .trim();

        }

        return "No response generated.";

    }

    catch (err) {

        console.error(err);

        return "Unable to generate response.";

    }

}

module.exports = {

    parseResponse

};