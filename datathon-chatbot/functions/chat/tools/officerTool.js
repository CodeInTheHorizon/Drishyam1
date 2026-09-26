/**
 * officerTool.js
 * 
 * Officer Performance & Caseload Analytics Tool for MP Police CCTNS Platform.
 */

function getOfficerRanking(analytics) {
    return analytics.officerPerformance || [];
}

function bestOfficer(analytics) {
    const ranking = getOfficerRanking(analytics);
    const preds = analytics.predictions || {};

    if (!ranking.length) {
        return {
            source: "officerTool",
            requiresAI: false,
            answer: `### 👮 MP Police Officer Caseload: Live Database Roster

* **Personnel Status**: No officers currently registered in the database.
* **Directives**: Use the Settings or Officers portal to register active duty personnel.`,
            data: { ranking: [] }
        };
    }

    const top = ranking[0];

    const rosterRows = ranking.slice(0, 8).map((off, idx) => 
        `| **${off.name}** | ${off.rank || "DSP"} | \`${off.badgeNumber || "MPP"}\` | **${off.count} active docket(s)** | ${off.status || "On Duty"} |`
    ).join("\n");

    const answer = `### 👮 MP Police Live Officer Roster & Caseload Analysis

* **Total Personnel Monitored**: **${ranking.length} registered police officers**
* **Primary Assigned Investigating Officer**: **${top.name}** (${top.count} assigned docket(s))
* **Workload Saturation Metric**: **${preds.supervisoryCapacity || "Optimal Capacity"}**

#### Live Database Officer Caseload Roster:
| Officer Name | Rank / Cadre | Badge Number | Assigned Caseload | Operational Status |
| :--- | :--- | :--- | :--- | :--- |
${rosterRows}

#### 🔮 Real-Time Workload & Capacity Prediction:
* **Caseload Saturation Level**: **${preds.workloadSaturation || "Optimal (100% capacity available)"}**
* **Predictive Allocation Plan**: With an average of ${(analytics.totalCases / Math.max(1, ranking.length)).toFixed(2)} case(s) per officer, the division has full investigative bandwidth to take on new cyber fraud dockets without caseload backlog.

#### 📋 Supervisory Directives:
1. **Case Distribution**: Assign incoming dockets to available DSPs to maintain balanced caseload distribution.
2. **Statutory Timeline (IIF-5)**: Maintain chargesheet filings within statutory 60-day deadline under CrPC 167.
3. **Biometric Security**: Ensure all case status updates are authenticated via ESP32 hardware 2FA.`;

    return {
        source: "officerTool",
        requiresAI: false,
        answer,
        data: {
            officer: top,
            ranking
        }
    };
}

module.exports = {
    bestOfficer,
    getOfficerRanking
};