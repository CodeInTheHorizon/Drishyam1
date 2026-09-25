// Mock AI Assistant Service for KSP Command Center

const conversationsDatabase = {
  "session-1": {
    id: "session-1",
    title: "Cyber Fraud Investigation",
    timestamp: "10m ago",
    status: "active",
    messages: [
      { sender: "officer", text: "What is the status of the cyber fraud investigations in Bengaluru City?" },
      {
        sender: "assistant",
        text: `Based on CCTNS datastore records, here is the active status report for **Cyber Fraud** within **Bengaluru City**:

### Case Overview
There are currently **78 registered cases** under active investigation. 

| Case No | Section / Act | Assigned Unit | Status | Target Value |
| :--- | :--- | :--- | :--- | :--- |
| CR-CYB-2026-094 | Sec 66D IT Act | Bengaluru Central PS | Critical Path | ₹42,00,000 |
| CR-CYB-2026-102 | Sec 420 IPC | Bengaluru East PS | Under Review | ₹18,50,000 |
| CR-CYB-2026-118 | Sec 66C IT Act | Bengaluru South PS | Intake Stage | ₹8,50,000 |

### Key Investigation Milestones
* **Digital Forensic Audits**: 44 logs extracted and matching proxy IP networks.
* **Arrests Made**: 4 suspects detained at interstate checkpoints.
* **Charge-sheet Rate**: 88% submitted to Special Cyber Courts.

Let me know if you want a detailed dossier on a specific case or officer workload.`
      }
    ]
  },
  "session-2": {
    id: "session-2",
    title: "Bengaluru Crime Summary",
    timestamp: "2h ago",
    status: "standby",
    messages: [
      { sender: "officer", text: "Summarize crimes in Bengaluru City." },
      {
        sender: "assistant",
        text: `### Bengaluru City Crime Analytics Summary (2026)

Total registered FIR cases: **1,482** (Increase of **4.2%** YoY).

#### Breakdown by Crime Head:
1. **Property Related**: 642 cases (43% of total) - Primary concern: Housebreaking by night.
2. **Cyber Crime**: 412 cases (28% of total) - Primary concern: OTP/SIM Swap phishing.
3. **Assault**: 224 cases (15% of total) - Primary concern: Assault outside commercial zones.
4. **Theft**: 142 cases (10% of total) - Primary concern: Retail & vehicle theft.

#### Hotspot Jurisdictions:
* Central Division (31% of incidents)
* East Division (24% of incidents)
* South-East Division (18% of incidents)`
      }
    ]
  },
  "session-3": {
    id: "session-3",
    title: "Officer Performance Review",
    timestamp: "1d ago",
    status: "standby",
    messages: [
      { sender: "officer", text: "Explain the performance profile of ACP Rajeshwari N." },
      {
        sender: "assistant",
        text: `### ACP Rajeshwari N. - Operational Evaluation Profile

* **Rank**: Assistant Commissioner of Police
* **Division**: Cyber Crime Division (Bengaluru City HQ)
* **Assigned Cases**: 142 Total (18 Active, 124 Closed)
* **Performance Score**: **4.9 / 5.0** (Top 5% bracket)

#### Efficiency Indicators:
* **Charge-sheet Rate (IIF-5)**: **88%** (District Avg: 72%)
* **Crime Detection Rate**: **92%** (District Avg: 78%)
* **Avg Resolution Time**: **32 Days** (District Avg: 45 Days)

#### Core Strengths:
* Digital Cryptography Analysis
* Corporate Ledger Forensic Audits
* Inter-State Transit Seizure coordination`
      }
    ]
  },
  "session-4": {
    id: "session-4",
    title: "Missing Persons Analysis",
    timestamp: "2d ago",
    status: "archived",
    messages: [
      { sender: "officer", text: "Show missing persons metrics." },
      { sender: "assistant", text: "Missing persons logs are synced with CCTNS IIF-2. Total complaints: 88, Traced: 79 (89.7% resolution rate). 9 active cases under ongoing search." }
    ]
  },
  "session-5": {
    id: "session-5",
    title: "Financial Fraud Cases",
    timestamp: "3d ago",
    status: "archived",
    messages: [
      { sender: "officer", text: "List high value financial frauds." },
      { sender: "assistant", text: "Top financial frauds involve real estate Ponzi scams in Belagavi District (₹8.2 Cr) and cooperative bank embezzlement in Hubli-Dharwad (₹4.5 Cr). Handled by DySP Sharanappa K." }
    ]
  }
};

const prebuiltReplies = {
  "summarize crimes in bengaluru city": `### Bengaluru City Crime Analytics Summary (2026)

Total registered FIR cases: **1,482** (Increase of **4.2%** YoY).

#### Breakdown by Crime Head:
1. **Property Offences**: 642 cases (43% of total) - Primary concern: Housebreaking by night.
2. **Cyber Crimes**: 412 cases (28% of total) - Primary concern: OTP/SIM Swap phishing.
3. **Body Offences**: 224 cases (15% of total) - Primary concern: Assault outside commercial zones.
4. **Financial Fraud**: 142 cases (10% of total) - Primary concern: Shell company investment Ponzi schemes.

#### Hotspot Jurisdictions:
* Central Division (31% of incidents)
* East Division (24% of incidents)
* South-East Division (18% of incidents)`,

  "show high-risk districts": `### Karnataka High-Risk Districts (GIS Hotspots)

Based on active density maps from the GIS Intelligence tracker:

| Rank | District Zone | Active Crimes | Primary Threat Head | Incident Rate |
| :--- | :--- | :--- | :--- | :--- |
| 1 | Bengaluru City | 642 Cases | Cyber & Property Offences | High (8.8 / 10k pop) |
| 2 | Mangaluru City | 198 Cases | Narcotics & Body Crimes | Mod-High (5.4 / 10k pop) |
| 3 | Hubli-Dharwad | 145 Cases | Property & Theft | Moderate (4.2 / 10k pop) |
| 4 | Belagavi District | 120 Cases | Financial Fraud & Audits | Moderate (3.8 / 10k pop) |

#### AI Recommendation:
Deploy additional cyber patrol resources to Bengaluru Central division and increase NDPS scans in coastal Mangaluru transit ports.`,

  "explain recent cyber fraud trends": `### AI Telemetry - Cyber Fraud Trends (Q1-Q2 2026)

Our ML scans identify three primary vectors currently targeting residents:

* **Vector 1: Aadhaar Enabled Payment System (AePS) Clones**
  * Malicious actors cloning fingerprints from land registry portals to siphon banking accounts.
* **Vector 2: Fake Electricity Bill Disconnections**
  * Bulk SMS messages directing victims to call fraudulent numbers to prevent disconnects.
* **Vector 3: AI Voice Cloning Scams**
  * Short audio clips cloned to simulate family emergencies and request immediate UPI transactions.

#### Prevention Roadmap:
Conduct district-level cyber security awareness seminars and coordinate audits with regional telecom providers.`,

  "generate officer performance summary": `### KSP Command - Lead Officer Performance Summary

Review of Top Investigating Officers:

* **ACP Rajeshwari N. (Badge ACP88)**
  * Strongest Area: Cyber Crimes & Cryptography
  * Load: Optimal (18 active / 142 total)
  * Closed: 124 cases | Detection Rate: **92%**
* **Insp. Ravi Kumar (Badge IN74)**
  * Strongest Area: Narcotics & Field Operations
  * Load: High Load (32 active / 198 total)
  * Closed: 166 cases | Detection Rate: **89%**
* **DySP Sharanappa K. (Badge DSP11)**
  * Strongest Area: Corporate Fraud & Shell Auditing
  * Load: Optimal (14 active / 215 total)
  * Closed: 201 cases | Detection Rate: **95%**`,

  "compare crime statistics between districts": `### District Crime Comparison: Bengaluru vs Mangaluru

| Metric Category | Bengaluru City | Mangaluru City | Variance (Delta) |
| :--- | :--- | :--- | :--- |
| Total Registered FIRs | 1,482 Cases | 398 Cases | +1,084 cases (Bengaluru) |
| Active Investigations | 148 Cases | 62 Cases | +86 cases (Bengaluru) |
| Charge-sheet Rate | 78% | 84% | +6% (Mangaluru) |
| Primary Crime Category | Cyber Crimes (38%) | Narcotics (45%) | Category shift |
| Detection Success Ratio| 82% | 88% | +6% (Mangaluru) |`,

  "draft an executive crime briefing": `### EXECUTIVE INTELLIGENCE BRIEFING: CONFIDENTIAL

**Issued by**: KSP Command Center AI Engine  
**Target**: Director General & Inspector General of Police (DG&IGP), Karnataka  

#### 1. Strategic Crime Summary
Across all 31 districts, total registered FIRs stand at **14,832** cases. Overall crime detection rate is maintained at **86.4%**, with the charge-sheet rate (IIF-5) at **78.2%**.

#### 2. Key Threat Vector Alert
* **Cyber Phishing Spike**: 12% rise in SIM swapping incidents originating from cross-border cells.
* **NDPS Logistics**: Mangaluru coastal transit hubs show elevated tracking counts.

#### 3. Operational Command Recommendations
* Allocate 4 additional cyber forensic inspectors to Bengaluru Central.
* Conduct joint agency operations under NDPS Acts in Mangaluru transit corridors.
* Authorize asset freezing for Belagavi financial fraud cases.`
};

export const assistantService = {
  getSessions: () => {
    return Object.keys(conversationsDatabase).map(key => ({
      id: key,
      title: conversationsDatabase[key].title,
      timestamp: conversationsDatabase[key].timestamp,
      status: conversationsDatabase[key].status
    }));
  },

  getSessionMessages: (id) => {
    return conversationsDatabase[id] ? conversationsDatabase[id].messages : [];
  },

  queryAssistant: async (promptText) => {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message: promptText })
      });
      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }
      const data = await response.json();
      if (data && data.success) {
        return data.reply;
      }
      throw new Error(data.error || "Failed to retrieve intelligence data.");
    } catch (err) {
      console.error("Error calling assistant API:", err);
      return `⚠️ Unable to process AI intelligence query against live CCTNS datastore: ${err.message}. Please verify connectivity to live database API.`;
    }
  }
};
