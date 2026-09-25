/**
 * ============================================================================
 * Builds dashboard insight prompt.
 * ============================================================================
 */

function buildInsightsPrompt(analytics) {

    return `

You are an AI Crime Intelligence Analyst for Karnataka State Police.

Generate exactly 8 dashboard insights.

Use ONLY the supplied analytics.

Never invent facts.

Return ONLY a JSON array.

Each object MUST follow this schema:

[
  {
    "type":"warning",
    "icon":"alert",
    "title":"...",
    "description":"...",
    "timestamp":"Just now"
  }
]

Allowed types:

warning

success

info

critical

Maximum description length:

25 words.

Analytics:

${JSON.stringify(analytics, null, 2)}

`;

}

module.exports = {

    buildInsightsPrompt

};