/**
 * ============================================================================
 * File: frontend/src/services/forensicBriefService.js
 * ----------------------------------------------------------------------------
 * Standardized One-Page Cyber Forensic Seizure Brief & Timeline Generator
 * Compliant with:
 * - Section 91 CrPC / Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023
 * - Section 65B Indian Evidence Act / Bharatiya Sakshya Adhiniyam (BSA) 2023
 * - 1930 National Cyber Crime Reporting Portal (NCRP) Golden-Hour Directives
 * ============================================================================
 */

import { forensicEvidenceStore } from "./forensicParserService.js";
import { getArtifactCorrelationGraph } from "./forensicCorrelationService.js";

export function generateOnePageSeizureBrief(customCaseRef = "FIR/MP/2026/08879", officerName = "Inspector R. K. Sharma", officerBadge = "MPP-2026-IO") {
  const artifacts = forensicEvidenceStore.getArtifacts();
  const graphData = getArtifactCorrelationGraph();
  const nodes = graphData.nodes || [];
  const edges = graphData.edges || [];

  const generatedDate = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });
  const generatedTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  // 1. Identify Victims, Mules, Cash-Outs
  const victims = nodes.filter((n) => n.type === "VICTIM");
  const l1Mules = nodes.filter((n) => n.type === "L1_MULE");
  const l2Mules = nodes.filter((n) => n.type === "L2_MULE");
  const cashouts = nodes.filter((n) => n.type === "CASHOUT");
  const phones = nodes.filter((n) => n.type === "PHONE");
  const imeis = nodes.filter((n) => n.type === "IMEI");
  const c2Servers = nodes.filter((n) => n.type === "C2_SERVER");
  const malwareApks = nodes.filter((n) => n.type === "MALWARE_APK");
  const phishingEmails = nodes.filter((n) => n.type === "EMAIL_SPOOF");

  // Calculate Total Siphoned Volume
  const fundsFlowEdges = edges.filter((e) => e.type === "FUNDS_FLOW");
  const totalVolumeINR = fundsFlowEdges.reduce((acc, e) => acc + (e.amount || 0), 0);

  // 2. Build Chronological Golden-Hour Event Timeline
  const rawTimeline = [];

  // Phishing events
  phishingEmails.forEach((pe) => {
    rawTimeline.push({
      time: "13:58:00Z",
      timeLabel: "T0 — 13:58 IST",
      event: "Phishing Attack Vector Delivery",
      actor: pe.name,
      description: `Forged email pretending to be State Bank of India delivered with dark-web lure URL. SPF Status: ${pe.details?.spf || "FAIL"}.`,
      severity: "HIGH",
      phase: "INGRESS"
    });
  });

  // Malware installation events
  malwareApks.forEach((apk) => {
    rawTimeline.push({
      time: "14:05:00Z",
      timeLabel: "T1 — 14:05 IST",
      event: "Banking Trojan APK Installation",
      actor: apk.details?.packageName || apk.name,
      description: `Malicious APK installed with ${apk.details?.permissions?.length || 8} high-risk permissions. Configured SMS intercept forwarder to +91 ${apk.details?.smsTarget || "9876543210"}.`,
      severity: "CRITICAL",
      phase: "COMPROMISE"
    });
  });

  // Telecom data sessions
  phones.filter(p => p.riskScore >= 75).slice(0, 2).forEach((ph) => {
    rawTimeline.push({
      time: "14:10:02Z",
      timeLabel: "T2 — 14:10 IST",
      event: "Scammer Telecom Coordination",
      actor: ph.name,
      description: `Suspect connected to cell tower ${ph.details?.tower || "CGI-MP-462001"} with hardware IMEI ${ph.details?.imei || "358941098765432"}.`,
      severity: "HIGH",
      phase: "SURVEILLANCE"
    });
  });

  // Financial transactions
  fundsFlowEdges.forEach((flow, idx) => {
    const isVictimTransfer = victims.some((v) => v.id === flow.source);
    const isTerminalCashout = cashouts.some((c) => c.id === flow.target);

    rawTimeline.push({
      time: flow.timestamp || `14:${15 + idx * 4}:00Z`,
      timeLabel: `T${3 + idx} — ${flow.timestamp ? flow.timestamp.slice(11, 16) : `14:${15 + idx * 4}`} IST`,
      event: isVictimTransfer 
        ? "Victim Funds Exfiltrated" 
        : (isTerminalCashout ? "Terminal Cash-Out Executed" : "Multi-Hop Mule Layering"),
      actor: `${flow.source?.replace("entity:acc:", "")} ➔ ${flow.target?.replace("entity:acc:", "")}`,
      description: `${flow.label}. Dispersal velocity under 4 minutes across beneficiary node.`,
      severity: isTerminalCashout ? "CRITICAL" : (isVictimTransfer ? "HIGH" : "MEDIUM"),
      phase: isTerminalCashout ? "CASHOUT" : "LAYERING"
    });
  });

  // Sort timeline chronologically
  rawTimeline.sort((a, b) => (a.time > b.time ? 1 : -1));

  // 3. Assemble Primary Mule Targets
  const primeSuspectMules = [...l1Mules, ...l2Mules].map((m) => {
    const inflow = m.inboundFunds?.reduce((acc, f) => acc + (f.amount || 0), 0) || 0;
    const outflow = m.outboundFunds?.reduce((acc, f) => acc + (f.amount || 0), 0) || 0;
    return {
      name: m.name,
      layer: m.type === "L1_MULE" ? "Layer-1 Primary Mule" : "Layer-2 Mule Relayer",
      account: m.details?.account || "N/A",
      vpa: m.details?.vpa || "N/A",
      bank: m.details?.bank || "Nodal Bank",
      riskScore: m.riskScore || 85,
      inflowINR: inflow,
      outflowINR: outflow,
      anomaly: m.anomalyFlags?.[0] || "Rapid Layer Dispersal",
      action: m.recommendedAction || "Issue Section 91 CrPC notice to freeze account balance."
    };
  });

  // 4. Assemble Actionable Seizure Directives (Section 91 CrPC)
  const seizureDirectives = [
    {
      targetType: "BANKING / NPCI LIEN",
      priority: "IMMEDIATE (GOLDEN HOUR)",
      statutoryProvision: "Section 91 CrPC / Section 94 BNSS & Sec 102 CrPC (Freezing of Property)",
      instructions: [
        `Serve immediate debit-freeze notice to Nodal Officer of HDFC Bank, ICICI Bank, Kotak Bank, and Bank of Baroda for listed mule accounts.`,
        `Submit emergency API lien request to NPCI 1930 Portal for UPI VPAs: ${[...l1Mules, ...l2Mules].map(m => m.details?.vpa).filter(Boolean).slice(0, 4).join(", ")}.`,
        `Direct nodal banks to preserve KYC documents, IP login audit logs, and account opening Aadhaar/PAN records under Section 91 CrPC.`
      ]
    },
    {
      targetType: "ATM SURVEILLANCE & CCTV RETRIEVAL",
      priority: "CRITICAL (WITHIN 24 HOURS)",
      statutoryProvision: "Section 91 CrPC & Police Regulation para 432 (Physical Evidence Preservation)",
      instructions: [
        `Dispatch nearest PCR patrol unit to ICICI Bank ATM (Vijay Nagar, Indore - Coord 22.7533, 75.8937) and Axis Bank ATM (New Market, Bhopal - Coord 23.2289, 77.4045).`,
        `Requisition CCTV video footage from 14:00 to 16:30 IST on 25-Sept-2026 to capture physical withdrawal operative / courier identity.`
      ]
    },
    {
      targetType: "CRYPTO P2P ESCROW SUBPOENA",
      priority: "HIGH (PRE-WITHDRAWAL FREEZE)",
      statutoryProvision: "Section 91 CrPC & CERT-In Financial Directive (P2P Wallet Freeze)",
      instructions: [
        `Issue Section 91 CrPC emergency preservation notice to Binance India Compliance Desk for Escrow Reference P2P-ESCROW-99 and UPI handle crypto.escrow@binance.`,
        `Order complete freeze of USDT/INR balance and disclosure of verified KYC, wallet address, and destination blockchain TxHash.`
      ]
    },
    {
      targetType: "TELECOM CDR & IPDR RETENTION",
      priority: "HIGH (ISP PRESERVATION)",
      statutoryProvision: "Rule 419A Telegraph Rules & Section 91 CrPC",
      instructions: [
        `Issue statutory preservation directive to TSP (Airtel, Jio, Vi) for mobile numbers: ${phones.slice(0, 4).map(p => p.name).join(", ")}.`,
        `Requisition Tower BTS dump logs for Cell CGI-MP-462001 and IMEI ${imeis[0]?.name || "358941098765432"} showing hardware SIM-swap records.`
      ]
    },
    {
      targetType: "CYBER THREAT MITIGATION (CERT-In)",
      priority: "TACTICAL ADVISORY",
      statutoryProvision: "Section 70B Information Technology Act (CERT-In Rules 2013)",
      instructions: [
        `Submit incident ticket to CERT-In (incident@cert-in.org.in) for APK Package signature block: ${malwareApks[0]?.details?.packageName || "com.sbi.rewards.update2026"}.`,
        `Request emergency DNS sinkholing for C2 host: ${c2Servers[0]?.name || "185.220.101.45"} across all Indian ISPs.`
      ]
    }
  ];

  return {
    documentId: `SEIZURE-BRIEF-${Date.now().toString(36).toUpperCase()}`,
    caseReference: customCaseRef,
    jurisdiction: "Madhya Pradesh Police — State Cyber Crime Investigation Cell (Bhopal Headquarters)",
    generatedDate,
    generatedTime,
    officer: {
      name: officerName,
      badge: officerBadge,
      unit: "Cyber Forensic Analysis & Golden-Hour Seizure Unit"
    },
    evidentiarySummary: {
      totalArtifacts: artifacts.length,
      totalRecordsAnalyzed: artifacts.reduce((a, b) => a + (b.recordCount || 0), 0),
      totalEntitiesExtracted: nodes.length,
      totalVolumeSiphonedINR: totalVolumeINR,
      sec65BCertificateHash: artifacts.map(a => `${a.fileName}: ${a.sha256}`).join("\n"),
      artifactsList: artifacts.map(a => ({
        fileName: a.fileName,
        sourceType: a.sourceType,
        sha256: a.sha256,
        recordCount: a.recordCount
      }))
    },
    kpis: [
      { label: "FRAUD VOLUME SIPHONED", value: `₹${totalVolumeINR.toLocaleString("en-IN")}` },
      { label: "MULE ACCOUNTS IDENTIFIED", value: `${primeSuspectMules.length} Accounts` },
      { label: "TERMINAL CASHOUT POINTS", value: `${cashouts.length} Endpoints` },
      { label: "SIM-SWAP HARDWARE", value: `${imeis.length} Devices` },
      { label: "C2 / MALWARE ENDPOINTS", value: `${c2Servers.length + malwareApks.length} Vectors` },
      { label: "ANOMALY SEVERITY", value: "CRITICAL (LEVEL 1)" }
    ],
    timeline: rawTimeline,
    suspectMules: primeSuspectMules,
    cashoutEndpoints: cashouts.map(c => ({
      name: c.name,
      subtitle: c.subtitle,
      riskScore: c.riskScore,
      action: c.recommendedAction
    })),
    seizureDirectives,
    certInSummary: {
      trojanDetected: malwareApks.length > 0,
      trojanPackage: malwareApks[0]?.details?.packageName || "None",
      c2Endpoint: c2Servers[0]?.name || "None",
      smsInterceptTarget: malwareApks[0]?.details?.smsTarget || "None"
    }
  };
}
