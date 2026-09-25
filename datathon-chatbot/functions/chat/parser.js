/**
 * ============================================================================
 * File: functions/chat/parser.js
 * ----------------------------------------------------------------------------
 * Extracts the assistant response from QuickML.
 * ============================================================================
 */

function parseResponse(response) {
    try {
        if (response?.data?.[0]?.data) {
            return String(response.data[0].data).trim();
        }
        if (response?.choices?.length) {
            return String(response.choices[0].message.content).trim();
        }
        if (typeof response?.data === "string") {
            return response.data.trim();
        }
        if (response?.reply) {
            return String(response.reply).trim();
        }
        return "No response generated.";
    } catch (err) {
        console.error(err);
        return "Unable to generate response.";
    }
}

module.exports = {

    parseResponse

};