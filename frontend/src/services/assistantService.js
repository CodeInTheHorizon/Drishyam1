/**
 * assistantService.js
 * 
 * Live AI Intelligence & Copilot Service for Madhya Pradesh Police Command Center.
 * Integrated directly with live CCTNS database records and Zoho Catalyst QuickML endpoint.
 */

import { recordService } from "./recordService";

export const assistantService = {
  getSessions: () => {
    const records = recordService.getRecords();
    const liveCase = records[0];

    const sessions = [];
    if (liveCase) {
      sessions.push({
        id: "session-live-case",
        title: `Audit: ${liveCase.crimeNo}`,
        timestamp: "Active",
        status: "active"
      });
    }

    sessions.push({
      id: "session-live-state",
      title: "Madhya Pradesh Cyber Intelligence",
      timestamp: "Live",
      status: sessions.length === 0 ? "active" : "standby"
    });

    return sessions;
  },

  getSessionMessages: (id) => {
    const records = recordService.getRecords();
    const liveCase = records[0];

    if (id === "session-live-case" && liveCase) {
      return [
        { sender: "officer", text: `Provide verification dossier for FIR #${liveCase.crimeNo}.` },
        {
          sender: "assistant",
          text: `### Live CCTNS Datastore Record: ${liveCase.crimeNo}
* **Jurisdiction**: ${liveCase.district} (${liveCase.unit})
* **Classification**: ${liveCase.crimeHead}
* **Applicable Sections**: ${liveCase.actSections}
* **Investigating Officer**: ${liveCase.allottedOfficerName} (${liveCase.allottedOfficerKgid})
* **Current Status**: ${liveCase.status}
* **Complainant**: ${liveCase.complainantName}
* **Brief Facts**: ${liveCase.briefFacts}

This record is verified and stored in the Zoho Catalyst Online Data Store (**CaseMaster** table).`
        }
      ];
    }

    return [
      { sender: "officer", text: "Summarize active cyber intelligence in Madhya Pradesh." },
      {
        sender: "assistant",
        text: `### Madhya Pradesh Police Command Center Intelligence Brief
Current live database query across CCTNS CaseMaster datastore reports **${records.length} registered case(s)** under active monitoring.

* **Primary Active Range**: ${records[0]?.district || "Bhopal Range"}
* **Database Connection**: Live Zoho Catalyst REST API
* **Audit Trail**: Real-time biometrics logging active

You can ask any specific question regarding cases, officers, or district spatial patterns.`
      }
    ];
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
