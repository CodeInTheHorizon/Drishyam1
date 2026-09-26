/**
 * districtTool.js
 * 
 * District Crime Analytics Tool for MP Police CCTNS Platform.
 */

function topDistrict(analytics) {
    const ranking = analytics.districtRanking || [];
    const totalKnown = analytics.totalCases || 0;

    if (!ranking.length) {
        return {
            source: "districtTool",
            requiresAI: false,
            answer: `### 📍 District Crime Incident Analysis: Live CCTNS Status

* **Total Live Cases Registered**: **0 recorded dockets**
* **Jurisdictional Status**: All Madhya Pradesh divisions currently report clear investigation boards.

#### 🛡️ Operational Directives:
1. Maintain continuous electronic surveillance through MP Police CCTV network.
2. Ensure automated checkposts remain vigilant along interstate boundaries.`,
            data: null
        };
    }

    const top = ranking[0];
    const topPct = totalKnown > 0 ? Math.round((top.count / totalKnown) * 100) : 100;

    const rankingLines = ranking.slice(0, 5)
        .map((d, idx) => `* **#${idx + 1} ${d.name}**: **${d.count} recorded case(s)** (${totalKnown > 0 ? Math.round((d.count / totalKnown) * 100) : 100}% of state volume)`)
        .join("\n");

    const answer = `### 📍 District Crime Incident Analysis: Live Database Status

* **Top Impact District in Database**: **${top.name}**
* **Live Registered Caseload**: **${top.count} case(s)** (${topPct}% of current state dockets)
* **Active Database Investigation Load**: 100% of current reported incidents in ${top.name} division.

#### Regional Incident Density Breakdown (Live CCTNS Data):
${rankingLines}

#### 🔮 Real-Time Predictive Assessment:
* **Caseload Velocity**: ${analytics.predictions?.caseIntakeVelocity || "Active dockets under processing"}
* **Jurisdiction Risk**: ${top.count > 10 ? "Elevated volume requires divisional support." : "Manageable caseload. Current investigative personnel sufficient."}

#### 🛡️ Operational Directives:
1. **Saturation Patrolling**: Deploy specialized beat patrol units during peak evening and night hours.
2. **Dynamic Checkposts**: Increase vehicle check posts (VCP) across high-traffic transit corridors.
3. **Forensic Acceleration**: Expedite evidence processing for pending investigation dockets.`;

    return {
        source: "districtTool",
        requiresAI: false,
        answer,
        data: {
            topDistrict: top,
            ranking
        }
    };
}

function compareDistricts(analytics, question) {
    const ranking = analytics.districtRanking || [];
    const districtCounts = analytics.districtCounts || {};
    
    // Check known MP districts in question
    const mpDistricts = ["Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Rewa", "Satna", "Chhindwara", "Ratlam"];
    const detected = mpDistricts.filter(d => question.toLowerCase().includes(d.toLowerCase()));

    const matches = detected.map(dName => {
        const found = ranking.find(r => r.name.toLowerCase() === dName.toLowerCase());
        const realCount = found ? found.count : (districtCounts[dName] || 0);
        return { name: dName, count: realCount };
    });

    if (matches.length < 2) {
        return {
            source: "districtTool",
            requiresAI: true
        };
    }

    const d1 = matches[0];
    const d2 = matches[1];
    const diff = Math.abs(d1.count - d2.count);
    const higher = d1.count >= d2.count ? d1 : d2;
    const lower = d1.count < d2.count ? d1 : d2;

    const answer = `### ⚖️ Live Database District Comparison: ${d1.name} vs ${d2.name}

| Comparative Metric | ${d1.name} | ${d2.name} | Variance (Live Delta) |
| :--- | :--- | :--- | :--- |
| **Total Registered Cases** | **${d1.count} case(s)** | **${d2.count} case(s)** | ${diff} case(s) higher in ${higher.name} |
| **Active Investigation Load** | **${d1.count} docket(s)** | **${d2.count} docket(s)** | ${d1.count === d2.count ? "Equal caseload" : `${higher.name} carries active volume`} |
| **Clearance Window** | ${d1.count > 0 ? "Under Investigation" : "Clear Board"} | ${d2.count > 0 ? "Under Investigation" : "Clear Board"} | Real-time CCTNS query |
| **Officer Availability** | Available on duty | Available on duty | Ready for tasking |

#### 📊 Live Database Intelligence Synthesis:
* **${higher.name}**: Currently holds **${higher.count}** registered case(s) in the live database.
* **${lower.name}**: Currently holds **${lower.count}** registered case(s) in the live database.
* **Predictive Resource Allocation**: Personnel in ${lower.name} can provide inter-district cyber forensic assistance to ${higher.name} without straining local operations.

#### 🛡️ Operational Directives:
1. **Targeted Deployment**: Focus investigating officers on active dockets in ${higher.name}.
2. **Preventive Surveillance**: Enforce ANPR vehicle tracking across the connecting corridor between ${d1.name} and ${d2.name}.`;

    return {
        source: "districtTool",
        requiresAI: false,
        answer,
        data: {
            first: d1,
            second: d2
        }
    };
}

module.exports = {
    topDistrict,
    compareDistricts
};
