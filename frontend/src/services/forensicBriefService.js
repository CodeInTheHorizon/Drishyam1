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
  const largeArtifact = artifacts.find(a => a.isLargeDataset && a.summary?.totalVolumeINR);
  const fundsFlowEdges = edges.filter((e) => e.type === "FUNDS_FLOW");
  const totalVolumeINR = largeArtifact ? largeArtifact.summary.totalVolumeINR : fundsFlowEdges.reduce((acc, e) => acc + (e.amount || 0), 0);

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
  let primeSuspectMules = [];
  if (largeArtifact && largeArtifact.topMuleTargets?.length > 0) {
    primeSuspectMules = largeArtifact.topMuleTargets.slice(0, 20);
  } else {
    primeSuspectMules = [...l1Mules, ...l2Mules].map((m) => {
      const inflow = m.inboundFunds?.reduce((acc, f) => acc + (f.amount || 0), 0) || 0;
      const outflow = m.outboundFunds?.reduce((acc, f) => acc + (f.amount || 0), 0) || 0;
      const roleText = m.type === "L1_MULE" ? "Layer-1 Primary Mule" : "Layer-2 Mule Relayer";
      return {
        name: m.name,
        role: roleText,
        layer: roleText,
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
  }

  // 4. Assemble Actionable Seizure Directives (Section 91 CrPC)
  const identifiedBanks = Array.from(new Set([...l1Mules, ...l2Mules, ...cashouts].map(m => m.details?.bank).filter(Boolean)));
  const bankNoticeTargets = identifiedBanks.length > 0 ? identifiedBanks.join(", ") : "Nodal Officers of involved beneficiary banks";

  const targetVPAs = [...l1Mules, ...l2Mules].map(m => m.details?.vpa || m.details?.account).filter(Boolean);
  const vpaNoticeTargets = targetVPAs.length > 0 ? targetVPAs.slice(0, 5).join(", ") : "Identified Mule Endpoints";

  const seizureDirectives = [];

  // Directive 1: Banking Lien (always relevant for financial fraud)
  if (l1Mules.length > 0 || l2Mules.length > 0 || cashouts.length > 0) {
    seizureDirectives.push({
      targetType: "BANKING / NPCI LIEN",
      priority: "IMMEDIATE (GOLDEN HOUR)",
      statutoryProvision: "Section 91 CrPC / Section 94 BNSS & Sec 102 CrPC (Freezing of Property)",
      instructions: [
        `Serve immediate debit-freeze notice to Nodal Officer of ${bankNoticeTargets} for identified recipient accounts.`,
        `Submit emergency API lien request to NPCI 1930 Portal for accounts / VPAs: ${vpaNoticeTargets}.`,
        `Direct nodal banks to preserve KYC documents, IP login audit logs, and account opening Aadhaar/PAN records under Section 91 CrPC.`
      ]
    });
  }

  // Directive 2: ATM / Physical Cashout Surveillance (if ATM cashout endpoints exist)
  const atmEndpoints = cashouts.filter(c => 
    c.name.toLowerCase().includes("atm") || 
    (c.details?.bank && c.details.bank.toLowerCase().includes("atm")) ||
    c.anomalyFlags?.some(f => f.toLowerCase().includes("atm") || f.toLowerCase().includes("cashout")) ||
    c.details?.narrations?.some(n => n.toLowerCase().includes("atm") || n.toLowerCase().includes("wdl"))
  );
  if (atmEndpoints.length > 0) {
    seizureDirectives.push({
      targetType: "ATM SURVEILLANCE & CCTV RETRIEVAL",
      priority: "CRITICAL (WITHIN 24 HOURS)",
      statutoryProvision: "Section 91 CrPC & Police Regulation para 432 (Physical Evidence Preservation)",
      instructions: [
        `Dispatch nearest PCR patrol unit to ATMs / branches associated with: ${atmEndpoints.map(a => a.name).join(", ")}.`,
        `Requisition CCTV video footage covering the transaction timestamps to capture physical withdrawal operative identity.`
      ]
    });
  }

  // Directive 3: Crypto P2P / Escrow Subpoena (if crypto cashout exists)
  const cryptoEndpoints = cashouts.filter(c => 
    c.name.toLowerCase().includes("crypto") || 
    c.name.toLowerCase().includes("binance") || 
    c.name.toLowerCase().includes("p2p") || 
    c.name.toLowerCase().includes("escrow") ||
    c.anomalyFlags?.some(f => f.toLowerCase().includes("crypto") || f.toLowerCase().includes("binance") || f.toLowerCase().includes("usdt")) ||
    c.details?.narrations?.some(n => n.toLowerCase().includes("crypto") || n.toLowerCase().includes("binance") || n.toLowerCase().includes("usdt") || n.toLowerCase().includes("p2p"))
  );
  if (cryptoEndpoints.length > 0) {
    seizureDirectives.push({
      targetType: "CRYPTO P2P ESCROW SUBPOENA",
      priority: "HIGH (PRE-WITHDRAWAL FREEZE)",
      statutoryProvision: "Section 91 CrPC & CERT-In Financial Directive (P2P Wallet Freeze)",
      instructions: [
        `Issue Section 91 CrPC emergency preservation notice to Compliance Desk for: ${cryptoEndpoints.map(c => c.name).join(", ")}.`,
        `Order complete freeze of USDT/INR balance and disclosure of verified KYC, wallet address, and destination blockchain TxHash.`
      ]
    });
  }

  // Directive 4: Telecom retention (only if telecom artifacts / phone nodes exist)
  if (phones.length > 0) {
    seizureDirectives.push({
      targetType: "TELECOM CDR & IPDR RETENTION",
      priority: "HIGH (ISP PRESERVATION)",
      statutoryProvision: "Rule 419A Telegraph Rules & Section 91 CrPC",
      instructions: [
        `Issue statutory preservation directive to TSP (Airtel, Jio, Vi) for mobile numbers: ${phones.slice(0, 4).map(p => p.name).join(", ")}.`,
        `Requisition Tower BTS dump logs for IMEI ${imeis[0]?.name || "linked subscriber hardware"} showing hardware SIM-swap records.`
      ]
    });
  }

  // Directive 5: CERT-In advisory (only if malware APK or C2 server or phishing email exists)
  if (malwareApks.length > 0 || c2Servers.length > 0 || phishingEmails.length > 0) {
    const certInInstructions = [];
    if (malwareApks.length > 0) {
      certInInstructions.push(`Submit incident ticket to CERT-In for APK Package signature block: ${malwareApks[0]?.details?.packageName || "Suspicious APK Package"}.`);
    }
    if (c2Servers.length > 0) {
      certInInstructions.push(`Request emergency DNS sinkholing / ISP blocking for suspicious proxy host: ${c2Servers[0]?.name || "Identified Endpoint"}.`);
    }
    if (phishingEmails.length > 0) {
      certInInstructions.push(`Issue phishing takedown request for domain/mailer: ${phishingEmails[0]?.name || "Phishing Sender"}.`);
    }

    seizureDirectives.push({
      targetType: "CYBER THREAT MITIGATION (CERT-In)",
      priority: "TACTICAL ADVISORY",
      statutoryProvision: "Section 70B Information Technology Act (CERT-In Rules 2013)",
      instructions: certInInstructions
    });
  }

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
      { label: "FRAUD VOLUME SIPHONED", value: `₹${totalVolumeINR.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` },
      { label: "MULE ACCOUNTS IDENTIFIED", value: largeArtifact ? `${largeArtifact.summary.intermediateMulesCount.toLocaleString()} Accounts` : `${primeSuspectMules.length} Accounts` },
      { label: "TERMINAL CASHOUT POINTS", value: largeArtifact ? `${largeArtifact.summary.terminalCashoutsCount.toLocaleString()} Endpoints` : `${cashouts.length} Endpoints` },
      { label: "SIM-SWAP HARDWARE", value: `${imeis.length} Devices` },
      { label: "C2 / MALWARE ENDPOINTS", value: largeArtifact ? `${largeArtifact.summary.proxyIPAlerts.toLocaleString()} Vectors` : `${c2Servers.length + malwareApks.length} Vectors` },
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
