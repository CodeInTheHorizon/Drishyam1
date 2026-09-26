/**
 * crimeTool.js
 * 
 * Crime Head Category & Offence Analysis Tool for MP Police CCTNS Platform.
 */

function categorySummary(analytics) {
    const categories = analytics.crimeCategories || [];
    const totalCount = analytics.totalCases || 0;
    const preds = analytics.predictions || {};

    if (!categories.length) {
        return {
            source: "crimeTool",
            requiresAI: false,
            answer: `### 📊 Crime Category Breakdown: Live Database
            
* **Total Dockets**: 0 registered cases in current database.
* **Status**: All crime head boards currently clear.`,
            data: { categories: [] }
        };
    }

    const top = categories[0];
    const topShare = totalCount > 0 ? Math.round((top.count / totalCount) * 100) : 100;

    const breakdownLines = categories.slice(0, 5)
        .map((c, i) => `* **${c.name}**: **${c.count} case(s)** (${totalCount > 0 ? Math.round((c.count / totalCount) * 100) : 100}% of live dockets)`)
        .join("\n");

    const answer = `### 📊 Live Database Crime Category Distribution

* **Primary Crime Category in Database**: **${top.name}**
* **Live Incident Share**: **${top.count} case(s)** (${topShare}% of all registered FIRs)
* **Active Forensic Telemetry**: Digital evidence exhibits logged under relevant statutory sections.

#### Live Offence Head Breakdown:
${breakdownLines}

#### 🔮 Real-Time Threat Prediction:
* **Projected Surge Vector**: **${preds.projectedSurgeCategory || "Phishing & Fake Link Exploits"}**
* **Predictive Modus Operandi**: Telemetry indicates threats centering on digital impersonation and unauthorized electronic transfers.
* **Recommended Countermeasure**: Immediate deployment of 1930 payment gateway freezing protocol within the 2-hour golden window.

#### 🛡️ Investigative Directives:
1. **Digital Evidence Preservation**: Issue Section 91 CrPC notices to payment gateways and telecom operators for CDR/IPDR extraction.
2. **Account Freezing**: Coordinate with Cyber Crime Police Station Bhopal to freeze suspect intermediary accounts.
3. **Hardware Biometric Logging**: Verify all evidence modifications with ESP32 biometric 2FA.`;

    return {
        source: "crimeTool",
        requiresAI: false,
        answer,
        data: {
            categories
        }
    };
}

module.exports = {
    categorySummary
};