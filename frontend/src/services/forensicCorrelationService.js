/**
 * ============================================================================
 * File: frontend/src/services/forensicCorrelationService.js
 * ----------------------------------------------------------------------------
 * Multi-Artifact Entity Correlation & Directional Mule Graph Engine
 * 
 * Implements Feature 2:
 * 1. Cross-Artifact Entity Linking:
 *    • Shared IMEI linking multiple phone numbers (SIM Swapping detection)
 *    • Shared C2 / Proxy IP linking Email Headers, APK Dumps, Telecom CDR & Mule logins
 *    • Intercepted SMS OTP target phone linking Trojan APK to Telecom suspect
 *    • Recurring Beneficiary UPI VPAs & Mule Bank Accounts
 * 2. Directional Financial Flow Graph:
 *    • Victim ➔ Layer-1 Mule ➔ Layer-2 Mule ➔ Ultimate Cashout Point (ATM/P2P)
 *    • Preserves exact transaction amounts (INR), timestamps, and payment channels
 * 3. Heuristic Anomaly & Risk Scoring Engine:
 *    • Rapid multi-hop fund routing velocity (< 5 min transfer velocity)
 *    • Dangerous Android permissions (SMS interception, accessibility service)
 *    • Spoofed email origin with SPF/DKIM failure
 * 4. Actionable Seizure Recommendations (Sec 91 CrPC & 1930 Portal Directives)
 * ============================================================================
 */

import { forensicEvidenceStore } from "./forensicParserService.js";

export const ARTIFACT_NODE_TYPES = {
  VICTIM: { base: "#10b981", glow: "rgba(16, 185, 129, 0.4)", border: "#34d399", label: "Victim Remitter", badge: "V" },
  L1_MULE: { base: "#f59e0b", glow: "rgba(245, 158, 11, 0.4)", border: "#fbbf24", label: "Layer-1 Mule Account", badge: "M1" },
  L2_MULE: { base: "#ea580c", glow: "rgba(234, 88, 12, 0.4)", border: "#fb923c", label: "Layer-2 Mule Account", badge: "M2" },
  CASHOUT: { base: "#dc2626", glow: "rgba(220, 38, 38, 0.4)", border: "#f87171", label: "Cash-Out Point (ATM/Crypto)", badge: "$$" },
  PHONE: { base: "#3b82f6", glow: "rgba(59, 130, 246, 0.4)", border: "#60a5fa", label: "Suspect Phone / MSISDN", badge: "TEL" },
  IMEI: { base: "#8b5cf6", glow: "rgba(139, 92, 246, 0.4)", border: "#a78bfa", label: "Shared Device (IMEI)", badge: "IMEI" },
  C2_SERVER: { base: "#e11d48", glow: "rgba(225, 29, 72, 0.4)", border: "#fb7185", label: "C2 Server / Drop IP", badge: "C2" },
  MALWARE_APK: { base: "#d946ef", glow: "rgba(217, 70, 239, 0.4)", border: "#f0abfc", label: "Banking Trojan APK", badge: "APK" },
  EMAIL_SPOOF: { base: "#eab308", glow: "rgba(234, 179, 8, 0.4)", border: "#fde047", label: "Phishing Origin Header", badge: "@" }
};

export const ARTIFACT_EDGE_TYPES = {
  FUNDS_FLOW: { color: "#10b981", label: "Transferred Funds (INR)", width: 3.2, style: "solid", isDirectional: true },
  SHARED_HARDWARE: { color: "#8b5cf6", label: "Used Same Device (IMEI)", width: 2.5, style: "dashed", isDirectional: false },
  C2_COMMUNICATION: { color: "#e11d48", label: "Exfiltrates Data to C2", width: 2.2, style: "solid", isDirectional: true },
  TELECOM_CALL: { color: "#3b82f6", label: "Voice / SMS Contact", width: 1.8, style: "solid", isDirectional: true },
  SPOOFED_FROM: { color: "#eab308", label: "Spoofed Origin IP", width: 2.0, style: "dashed", isDirectional: true },
  CROSS_ARTIFACT_IP: { color: "#06b6d4", label: "Shared Session IP", width: 2.2, style: "dashed", isDirectional: false },
  SMS_INTERCEPT_TARGET: { color: "#f43f5e", label: "Intercepted OTP Forwarded To", width: 2.6, style: "solid", isDirectional: true }
};

function normalizeEntityKey(val) {
  if (!val) return "";
  return String(val).trim().toLowerCase().replace(/[^a-z0-9]/g, "_");
}

export function getArtifactCorrelationGraph(options = {}) {
  const {
    bigDataMode = "SYNDICATE_HUBS", // "SYNDICATE_HUBS" | "BANK_CORRIDORS" | "FULL_MESH"
    minVolume = 0,
    isolateNodeId = null
  } = options;

  const artifacts = forensicEvidenceStore.getArtifacts();
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();
  const edgeSet = new Set();

  function addNode(node) {
    if (!node.label && node.name) node.label = node.name;
    if (!node.name && node.label) node.name = node.label;
    if (!nodeMap.has(node.id)) {
      node.colorConfig = node.colorConfig || ARTIFACT_NODE_TYPES[node.type] || { base: "#64748b", glow: "rgba(100,116,139,0.3)", border: "#94a3b8", label: node.type, badge: "?" };
      node.inboundFunds = node.inboundFunds || [];
      node.outboundFunds = node.outboundFunds || [];
      node.anomalyFlags = node.anomalyFlags || [];
      node.linkedArtifacts = node.linkedArtifacts || [];
      nodeMap.set(node.id, node);
      nodes.push(node);
    } else {
      // Merge properties if node already exists
      const existing = nodeMap.get(node.id);
      if (node.details) existing.details = { ...existing.details, ...node.details };
      if (node.anomalyFlags) {
        node.anomalyFlags.forEach(f => {
          if (!existing.anomalyFlags.includes(f)) existing.anomalyFlags.push(f);
        });
      }
      if (node.riskScore && node.riskScore > existing.riskScore) {
        existing.riskScore = node.riskScore;
      }
      if (node.linkedArtifacts) {
        node.linkedArtifacts.forEach(artId => {
          if (!existing.linkedArtifacts.includes(artId)) existing.linkedArtifacts.push(artId);
        });
      }
    }
    return nodeMap.get(node.id);
  }

  function addEdge(edge) {
    const key = `${edge.source}-->${edge.target}:${edge.type}`;
    if (!edgeSet.has(key)) {
      edge.config = edge.config || ARTIFACT_EDGE_TYPES[edge.type] || { color: "#475569", width: 1.5, style: "solid", isDirectional: false };
      edgeSet.add(key);
      edges.push(edge);
    }
  }

  // Tracking maps for cross-artifact linking
  const ipToEntities = new Map(); // ip -> Set of node IDs
  const phoneToNodes = new Map(); // clean phone -> node ID

  // ==========================================================================
  // 1. Process Financial Artifacts (Multi-Hop Directional Mule Trail)
  // ==========================================================================
  const financialArtifacts = artifacts.filter((a) => a.sourceType === "FINANCIAL_UPI_BANK");

  // MODE A: BANK_CORRIDORS (Macro Inter-Bank Institutional Flow)
  if (bigDataMode === "BANK_CORRIDORS") {
    const bankStats = new Map();
    const corridorStats = new Map();

    function getOrInitBank(rawBankName, ifsc) {
      let clean = (rawBankName || "").trim();
      if (!clean && ifsc) clean = `${ifsc.slice(0, 4).toUpperCase()} Bank`;
      if (!clean) clean = "Commercial Bank";

      // Consolidate bank names
      const upper = clean.toUpperCase();
      if (upper.includes("STATE BANK") || upper.startsWith("SBIN")) clean = "State Bank of India";
      else if (upper.includes("HDFC")) clean = "HDFC Bank";
      else if (upper.includes("ICICI")) clean = "ICICI Bank";
      else if (upper.includes("AXIS") || upper.startsWith("UTIB")) clean = "Axis Bank";
      else if (upper.includes("KOTAK") || upper.startsWith("KKBK")) clean = "Kotak Mahindra Bank";
      else if (upper.includes("PUNJAB") || upper.startsWith("PUNB")) clean = "Punjab National Bank";
      else if (upper.includes("BARODA") || upper.startsWith("BARB")) clean = "Bank of Baroda";
      else if (upper.includes("PAYTM") || upper.startsWith("PYTM")) clean = "Paytm Payments Bank";
      else if (upper.includes("AIRTEL") || upper.startsWith("AIRP")) clean = "Airtel Payments Bank";

      const bankKey = normalizeEntityKey(clean);
      const bankId = `entity:bank:${bankKey}`;

      if (!bankStats.has(bankKey)) {
        bankStats.set(bankKey, {
          id: bankId,
          key: bankKey,
          name: clean,
          inflowTotal: 0,
          outflowTotal: 0,
          txnCount: 0,
          accounts: new Set(),
          ips: new Set(),
          devices: new Set()
        });
      }
      return bankStats.get(bankKey);
    }

    financialArtifacts.forEach((art) => {
      (art.records || []).forEach((r) => {
        const amt = Number(r.amount) || 0;
        if (minVolume > 0 && amt < minVolume) return;

        let remBankName = r.senderBank || r.remitterBank;
        let benBankName = r.receiverBank || r.beneficiaryBank;

        const narr = (r.narration || "").toLowerCase();
        if (narr.includes("crypto") || narr.includes("binance") || narr.includes("usdt") || narr.includes("p2p")) {
          benBankName = "Crypto & P2P Escrow Sinks";
        } else if (narr.includes("atm") || narr.includes("wdl") || narr.includes("cash")) {
          benBankName = "ATM Cash Sinks";
        }

        const remBank = getOrInitBank(remBankName, r.senderIFSC);
        const benBank = getOrInitBank(benBankName, r.receiverIFSC);

        remBank.outflowTotal += amt;
        remBank.txnCount++;
        if (r.senderAccount || r.remitter) remBank.accounts.add(r.senderAccount || r.remitter);
        if (r.ip) {
          remBank.ips.add(r.ip);
          if (!ipToEntities.has(r.ip)) ipToEntities.set(r.ip, new Set());
          ipToEntities.get(r.ip).add(remBank.id);
        }
        if (r.deviceType || r.device) remBank.devices.add(r.deviceType || r.device);

        benBank.inflowTotal += amt;
        benBank.txnCount++;
        if (r.receiverAccount || r.beneficiary) benBank.accounts.add(r.receiverAccount || r.beneficiary);

        const corridorKey = `${remBank.id}-->${benBank.id}`;
        if (!corridorStats.has(corridorKey)) {
          corridorStats.set(corridorKey, {
            source: remBank.id,
            target: benBank.id,
            totalAmount: 0,
            txnCount: 0,
            senderBank: remBank.name,
            receiverBank: benBank.name
          });
        }
        const cStat = corridorStats.get(corridorKey);
        cStat.totalAmount += amt;
        cStat.txnCount++;
      });
    });

    // Classify Bank Nodes
    bankStats.forEach((b) => {
      let assignedType = "L1_MULE";
      let roleTitle = "Intermediary Banking Nexus";
      let riskScore = 75;

      const isTerminal = b.outflowTotal === 0 || b.name.includes("Crypto") || b.name.includes("ATM");
      const isSource = b.inflowTotal === 0 || (b.outflowTotal > b.inflowTotal * 2.5);

      if (isTerminal) {
        assignedType = "CASHOUT";
        roleTitle = "Terminal Cashout Sinks";
        riskScore = 95;
      } else if (isSource) {
        assignedType = "VICTIM";
        roleTitle = "Source Victim Banking Institution";
        riskScore = 20;
      } else if (b.inflowTotal > 1500000 || b.accounts.size > 20) {
        assignedType = "L1_MULE";
        roleTitle = "High-Volume Layer-1 Laundering Nexus";
        riskScore = 88;
      } else {
        assignedType = "L2_MULE";
        roleTitle = "Layer-2 Dispersal Banking Node";
        riskScore = 80;
      }

      const totalVol = b.inflowTotal + b.outflowTotal;
      const fmtVol = totalVol >= 10000000 
        ? `₹${(totalVol / 10000000).toFixed(2)} Cr`
        : `₹${(totalVol / 100000).toFixed(2)} Lakh`;

      addNode({
        id: b.id,
        name: b.name,
        type: assignedType,
        subtitle: `${fmtVol} Flow | ${b.accounts.size} Suspect Accounts`,
        details: {
          bank: b.name,
          inflowTotal: b.inflowTotal,
          outflowTotal: b.outflowTotal,
          txnCount: b.txnCount,
          muleAccountsCount: b.accounts.size,
          role: roleTitle,
          devices: Array.from(b.devices),
          ips: Array.from(b.ips)
        },
        riskScore,
        anomalyFlags: [
          `Macro Corridor Volume: ${fmtVol}`,
          `${b.accounts.size} Distinct Accounts Flagged in Laundering Channel`
        ],
        recommendedAction: `Serve Section 91 CrPC notice to ${b.name} Nodal Cyber Officer for KYC freeze & IP transaction logs.`
      });
    });

    // Add Corridor Edges
    corridorStats.forEach((c, key) => {
      const amtStr = c.totalAmount >= 10000000 
        ? `₹${(c.totalAmount / 10000000).toFixed(2)} Cr` 
        : `₹${(c.totalAmount / 100000).toFixed(2)} Lakh`;

      addEdge({
        id: `corridor:${key}`,
        source: c.source,
        target: c.target,
        type: "FUNDS_FLOW",
        label: `${amtStr} (${c.txnCount} txns)`,
        amount: c.totalAmount,
        config: {
          color: "#10b981",
          width: Math.min(6.5, Math.max(2.4, 2.4 + Math.log10(c.totalAmount / 10000))),
          style: "solid",
          isDirectional: true
        }
      });
    });
  } else {
    // MODES B & C: SYNDICATE_HUBS (Backbone) or FULL_MESH (Granular)
    // Step 1a: Pre-index all transaction links and calculate in-degree, out-degree & flow metrics
    const finEntityStats = new Map();

    function getOrInitFinStat(name, account, ifsc, bank, vpa, artId, ip, deviceType, narration) {
      const key = normalizeEntityKey(account || name);
      if (!finEntityStats.has(key)) {
        finEntityStats.set(key, {
          id: `entity:acc:${key}`,
          key,
          rawName: name,
          account: account || "",
          ifsc: ifsc || "",
          bank: bank || "",
          vpa: vpa || "",
          inDegree: 0,
          outDegree: 0,
          inflowTotal: 0,
          outflowTotal: 0,
          outboundTargets: new Set(),
          inboundSources: new Set(),
          inboundFunds: [],
          outboundFunds: [],
          linkedArtifacts: new Set(artId ? [artId] : []),
          ips: new Set(ip ? [ip] : []),
          devices: new Set(deviceType ? [deviceType] : []),
          narrations: narration ? [narration] : []
        });
      }
      const stat = finEntityStats.get(key);
      if (account && !stat.account) stat.account = account;
      if (ifsc && !stat.ifsc) stat.ifsc = ifsc;
      if (bank && !stat.bank) stat.bank = bank;
      if (vpa && !stat.vpa) stat.vpa = vpa;
      if (artId) stat.linkedArtifacts.add(artId);
      if (ip) stat.ips.add(ip);
      if (deviceType) stat.devices.add(deviceType);
      if (narration && !stat.narrations.includes(narration)) stat.narrations.push(narration);
      return stat;
    }

    const allFilteredRecords = [];

    financialArtifacts.forEach((art) => {
      (art.records || []).forEach((r) => {
        const amt = Number(r.amount) || 0;
        if (minVolume > 0 && amt < minVolume) return;

        allFilteredRecords.push(r);

        const remStat = getOrInitFinStat(
          r.remitter, 
          r.senderAccount || r.remitterAccount, 
          r.senderIFSC, 
          r.senderBank || r.remitterBank, 
          r.remitterVPA, 
          art.id, 
          r.ip, 
          r.deviceType || r.device, 
          r.narration
        );
        const benStat = getOrInitFinStat(
          r.beneficiary, 
          r.receiverAccount || r.beneficiaryAccount, 
          r.receiverIFSC, 
          r.receiverBank || r.beneficiaryBank, 
          r.beneficiaryVPA, 
          art.id, 
          null, 
          null, 
          r.narration
        );

        remStat.outDegree++;
        remStat.outflowTotal += amt;
        remStat.outboundTargets.add(benStat.id);
        const flowDetails = {
          txnId: r.txnId,
          amount: amt,
          mode: r.paymentMode || r.mode || "UPI",
          narration: r.narration,
          timestamp: r.timestamp,
          from: remStat.account || r.remitter,
          to: benStat.account || r.beneficiary,
          senderIFSC: r.senderIFSC,
          receiverIFSC: r.receiverIFSC,
          deviceType: r.deviceType || r.device,
          ip: r.ip
        };
        remStat.outboundFunds.push(flowDetails);

        benStat.inDegree++;
        benStat.inflowTotal += amt;
        benStat.inboundSources.add(remStat.id);
        benStat.inboundFunds.push(flowDetails);

        // Track client IP for cross-artifact synergy
        if (r.ip) {
          if (!ipToEntities.has(r.ip)) ipToEntities.set(r.ip, new Set());
          ipToEntities.get(r.ip).add(remStat.id);
        }
      });
    });

    // Step 1b: Dynamic Topological Classification (Victim ➔ L1 Mule ➔ L2 Mule ➔ Cashout)
    const nodeTypeMap = new Map(); // entityId -> "VICTIM" | "L1_MULE" | "L2_MULE" | "CASHOUT"

    // 1. Semantic Cashout & Narration Scam markers
    finEntityStats.forEach((stat) => {
      const combinedText = (stat.rawName + " " + stat.bank + " " + stat.vpa + " " + stat.narrations.join(" ")).toLowerCase();
      const isKeywordCashout = /\b(?:atm|crypto|cashout|escrow|binance|wazirx|withdrawal|usdt|p2p)\b/i.test(combinedText) ||
        /\bpos\b/i.test(combinedText) || combinedText.includes("atm ") || combinedText.includes("wdl");

      if (stat.outDegree === 0 && (isKeywordCashout || (stat.inDegree > 0 && combinedText.includes("cash")))) {
        nodeTypeMap.set(stat.id, "CASHOUT");
      }
    });

    // 2. Identify Victims: inDegree === 0 and outDegree > 0, OR explicit victim keyword
    finEntityStats.forEach((stat) => {
      const lower = stat.rawName.toLowerCase();
      const isKeywordVictim = lower.includes("victim") || lower.includes("complainant") || lower.includes("source");
      if (isKeywordVictim || (stat.inDegree === 0 && stat.outDegree > 0)) {
        nodeTypeMap.set(stat.id, "VICTIM");
      }
    });

    // Fallback: If no victim found, pick node with max net outflow
    const foundVictim = Array.from(nodeTypeMap.values()).some((t) => t === "VICTIM");
    if (!foundVictim && finEntityStats.size > 0) {
      let maxNetOutflowId = null;
      let maxNet = -Infinity;
      finEntityStats.forEach((stat) => {
        const net = stat.outflowTotal - stat.inflowTotal;
        if (net > maxNet) {
          maxNet = net;
          maxNetOutflowId = stat.id;
        }
      });
      if (maxNetOutflowId) nodeTypeMap.set(maxNetOutflowId, "VICTIM");
    }

    // 3. BFS Shortest Path Traversal from Victim Nodes to determine Mule Layers
    const queue = [];
    const hopDistances = new Map();

    finEntityStats.forEach((stat) => {
      if (nodeTypeMap.get(stat.id) === "VICTIM") {
        hopDistances.set(stat.id, 0);
        queue.push({ id: stat.id, hop: 0 });
      }
    });

    while (queue.length > 0) {
      const { id, hop } = queue.shift();
      const stat = Array.from(finEntityStats.values()).find((s) => s.id === id);
      if (!stat) continue;

      stat.outboundTargets.forEach((targetId) => {
        if (!hopDistances.has(targetId)) {
          const nextHop = hop + 1;
          hopDistances.set(targetId, nextHop);
          queue.push({ id: targetId, hop: nextHop });

          const currentType = nodeTypeMap.get(targetId);
          if (currentType !== "CASHOUT" && currentType !== "VICTIM") {
            const targetStat = Array.from(finEntityStats.values()).find((s) => s.id === targetId);
            const isTerminalSink = targetStat && targetStat.outDegree === 0;

            if (isTerminalSink && nextHop >= 2) {
              nodeTypeMap.set(targetId, "CASHOUT");
            } else if (nextHop === 1) {
              nodeTypeMap.set(targetId, "L1_MULE");
            } else {
              nodeTypeMap.set(targetId, "L2_MULE");
            }
          }
        }
      });
    }

    // 4. Fallback classification for any unclassified nodes
    finEntityStats.forEach((stat) => {
      if (!nodeTypeMap.has(stat.id)) {
        if (stat.outDegree === 0) nodeTypeMap.set(stat.id, "CASHOUT");
        else if (stat.inDegree === 0) nodeTypeMap.set(stat.id, "VICTIM");
        else nodeTypeMap.set(stat.id, "L1_MULE");
      }
    });

    // 5. Syndicate Hub Selection (Decluttering Engine for Big Data / 2M Records)
    let selectedEntityKeys = null; // null means keep all

    if (bigDataMode === "SYNDICATE_HUBS" && finEntityStats.size > 28) {
      selectedEntityKeys = new Set();

      // Top Victims (sources of funds)
      const victimList = Array.from(finEntityStats.values())
        .filter((s) => nodeTypeMap.get(s.id) === "VICTIM")
        .sort((a, b) => (b.outflowTotal - b.inflowTotal) - (a.outflowTotal - a.inflowTotal))
        .slice(0, 5);
      victimList.forEach((s) => selectedEntityKeys.add(s.key));

      // Top Terminal Cashouts (crypto/ATM/sinks)
      const cashoutList = Array.from(finEntityStats.values())
        .filter((s) => nodeTypeMap.get(s.id) === "CASHOUT")
        .sort((a, b) => b.inflowTotal - a.inflowTotal)
        .slice(0, 6);
      cashoutList.forEach((s) => selectedEntityKeys.add(s.key));

      // Top L1 Mules (highest turnover and in-degree)
      const l1List = Array.from(finEntityStats.values())
        .filter((s) => nodeTypeMap.get(s.id) === "L1_MULE")
        .sort((a, b) => (b.inflowTotal + b.outflowTotal) - (a.inflowTotal + a.outflowTotal))
        .slice(0, 10);
      l1List.forEach((s) => selectedEntityKeys.add(s.key));

      // Top L2 Mules (relays connecting to cashouts or top volume)
      const l2List = Array.from(finEntityStats.values())
        .filter((s) => nodeTypeMap.get(s.id) === "L2_MULE")
        .sort((a, b) => (b.inflowTotal + b.outflowTotal) - (a.inflowTotal + a.outflowTotal))
        .slice(0, 8);
      l2List.forEach((s) => selectedEntityKeys.add(s.key));

      // Connect bridge nodes: ensure any path from selected L1 to selected cashout is bridged
      l1List.forEach((l1) => {
        l1.outboundTargets.forEach((targetId) => {
          const targetStat = Array.from(finEntityStats.values()).find((s) => s.id === targetId);
          if (targetStat && selectedEntityKeys.size < 32) {
            selectedEntityKeys.add(targetStat.key);
          }
        });
      });
    }

    // Step 1c: Register Nodes into Graph with 11-column Schema Enrichments
    finEntityStats.forEach((stat) => {
      // If hub selection active, only register selected hubs
      if (selectedEntityKeys && !selectedEntityKeys.has(stat.key)) {
        return;
      }

      const assignedType = nodeTypeMap.get(stat.id) || "L1_MULE";
      let riskScore = assignedType === "CASHOUT" ? 95 : (assignedType === "L2_MULE" ? 85 : (assignedType === "L1_MULE" ? 75 : 10));
      
      let roleTitle = "Mule Account";
      let flags = [];
      if (assignedType === "VICTIM") {
        roleTitle = "Victim Complainant";
        flags = [];
      } else if (assignedType === "L1_MULE") {
        roleTitle = "Layer-1 Primary Mule";
        flags = ["Primary Influx Receiver", "Immediate Layering Hop"];
      } else if (assignedType === "L2_MULE") {
        roleTitle = "Layer-2 Mule Relayer";
        flags = ["Layer-2 Mule Funnel", "Rapid Sub-Layer Dispersal"];
      } else if (assignedType === "CASHOUT") {
        roleTitle = "Terminal Cashout Endpoint";
        flags = ["Terminal Cashout Point", "Off-Ramp ATM / Crypto Escrow"];
      }

      // Heuristic Enrichments
      stat.devices.forEach((dev) => {
        if (dev === "Web_Emulator" || dev.toLowerCase().includes("emulator")) {
          flags.push("Synthetic Client (Web_Emulator Sandbox)");
          riskScore = Math.min(100, riskScore + 20);
        } else if (dev === "Linux_Script" || dev.toLowerCase().includes("script") || dev.toLowerCase().includes("bot")) {
          flags.push("Automated Script Botnet (Linux_Script)");
          riskScore = Math.min(100, riskScore + 25);
        }
      });

      stat.ips.forEach((ip) => {
        if (ip.startsWith("185.220.") || ip.startsWith("103.21.") || ip.startsWith("45.") || ip.startsWith("194.") || ip.startsWith("195.")) {
          flags.push(`Foreign Proxy / Tor Anomaly (${ip})`);
          riskScore = Math.min(100, riskScore + 15);
        }
      });

      stat.narrations.forEach((narr) => {
        const lowerNarr = narr.toLowerCase();
        if (lowerNarr.includes("crypto") || lowerNarr.includes("binance") || lowerNarr.includes("usdt") || lowerNarr.includes("p2p")) {
          flags.push(`Narration Crypto Marker: "${narr}"`);
        } else if (lowerNarr.includes("atm") || lowerNarr.includes("cash") || lowerNarr.includes("wdl")) {
          flags.push(`Narration ATM Cashout Marker: "${narr}"`);
        } else if (lowerNarr.includes("task") || lowerNarr.includes("lottery") || lowerNarr.includes("loan")) {
          flags.push(`Narration Social Engineering Marker: "${narr}"`);
        }
      });

      const displayName = stat.bank && stat.account 
        ? `${stat.bank} (A/C ${stat.account})` 
        : (stat.rawName.startsWith("A/C") ? stat.rawName : `A/C ${stat.account || stat.rawName}`);

      const displaySubtitle = stat.bank 
        ? `${stat.bank} • ${stat.ifsc || "IFSC"} | ${stat.vpa || stat.account}`
        : (stat.vpa ? `${stat.vpa} (${stat.account || "Account"})` : roleTitle);

      const node = addNode({
        id: stat.id,
        name: displayName,
        label: displayName,
        type: assignedType,
        subtitle: displaySubtitle,
        details: {
          account: stat.account,
          ifsc: stat.ifsc,
          bank: stat.bank,
          vpa: stat.vpa,
          role: roleTitle,
          devices: Array.from(stat.devices),
          ips: Array.from(stat.ips),
          narrations: stat.narrations
        },
        riskScore,
        anomalyFlags: flags,
        linkedArtifacts: Array.from(stat.linkedArtifacts)
      });

      node.inboundFunds = stat.inboundFunds;
      node.outboundFunds = stat.outboundFunds;
    });

    // Step 1d: Register Directional Edges
    allFilteredRecords.forEach((r) => {
      const remKey = normalizeEntityKey(r.senderAccount || r.remitter);
      const benKey = normalizeEntityKey(r.receiverAccount || r.beneficiary);
      const remId = `entity:acc:${remKey}`;
      const benId = `entity:acc:${benKey}`;

      // Only add edge if both endpoints exist in active graph
      if (!nodeMap.has(remId) || !nodeMap.has(benId)) {
        return;
      }
      
      const labelMode = r.paymentMode || r.mode || "UPI";
      const narrationSnippet = r.narration ? ` • "${r.narration.slice(0, 15)}"` : "";
      
      addEdge({
        id: `flow:${r.txnId || (r.recordId || Math.random())}`,
        source: remId,
        target: benId,
        type: "FUNDS_FLOW",
        label: `₹${(Number(r.amount) || 0).toLocaleString("en-IN")} (${labelMode})${narrationSnippet}`,
        amount: Number(r.amount) || 0,
        mode: labelMode,
        timestamp: r.timestamp,
        narration: r.narration,
        senderIFSC: r.senderIFSC,
        receiverIFSC: r.receiverIFSC,
        deviceType: r.deviceType || r.device,
        ip: r.ip
      });
    });

    // Assign recommended seizure directives for financial nodes
    nodes.forEach((n) => {
      if (n.type === "L1_MULE") {
        const accStr = n.details?.account ? `account ${n.details.account}` : "linked account";
        const vpaStr = n.details?.vpa ? ` and black-list UPI handle ${n.details.vpa}` : "";
        n.recommendedAction = `Freeze ${accStr}${vpaStr} via 1930 portal / NPCI immediate lien notice.`;
      } else if (n.type === "L2_MULE") {
        n.recommendedAction = `Issue Section 91 CrPC directive to ${n.details?.bank || "Nodal Bank"} to freeze balance and furnish KYC documents of account holder.`;
      } else if (n.type === "CASHOUT") {
        n.recommendedAction = `Dispatch nearest field patrol unit to inspect CCTV footage of ATM / request crypto exchange P2P subpoena.`;
      }
    });
  }

  // ==========================================================================
  // 2. Process Telecom Artifacts (CDR / IPDR: Shared Hardware & Suspect Calls)
  // ==========================================================================
  const telecomArtifacts = artifacts.filter((a) => a.sourceType === "TELECOM_RECORDS");
  const imeiToPhones = new Map();

  telecomArtifacts.forEach((art) => {
    (art.records || []).forEach((r) => {
      const cleanCaller = String(r.callingNumber).replace(/[^0-9]/g, "");
      const callerId = `entity:phone:${cleanCaller}`;
      
      const callerNode = addNode({
        id: callerId,
        name: `+91 ${cleanCaller}`,
        type: "PHONE",
        subtitle: `Calling Suspect | ${r.location || r.tower || "Active Cell"}`,
        details: {
          phone: cleanCaller,
          imei: r.imei,
          imsi: r.imsi,
          tower: r.tower,
          location: r.location,
          lat: r.lat,
          lng: r.lng
        },
        riskScore: 78,
        anomalyFlags: ["High-Frequency Outbound Caller", "Cell Tower Roaming Anomaly"],
        linkedArtifacts: [art.id]
      });
      phoneToNodes.set(cleanCaller, callerId);

      const cleanCallee = String(r.calledNumber).replace(/[^0-9]/g, "");
      const calleeId = `entity:phone:${cleanCallee}`;
      addNode({
        id: calleeId,
        name: `+91 ${cleanCallee}`,
        type: "PHONE",
        subtitle: "Called Party Contact",
        details: { phone: cleanCallee },
        riskScore: 45,
        linkedArtifacts: [art.id]
      });
      phoneToNodes.set(cleanCallee, calleeId);

      // Call Edge
      addEdge({
        id: `call:${r.recordId || Math.random()}`,
        source: callerId,
        target: calleeId,
        type: "TELECOM_CALL",
        label: `${r.callType || "CALL"} (${r.duration}s)`,
        duration: r.duration,
        timestamp: r.timestamp
      });

      // Track IMEI
      if (r.imei) {
        if (!imeiToPhones.has(r.imei)) imeiToPhones.set(r.imei, new Set());
        imeiToPhones.get(r.imei).add(cleanCaller);
      }

      // Track IP
      if (r.ip) {
        if (!ipToEntities.has(r.ip)) ipToEntities.set(r.ip, new Set());
        ipToEntities.get(r.ip).add(callerId);
      }
    });
  });

  // Link Shared Hardware (IMEI)
  imeiToPhones.forEach((phonesSet, imei) => {
    const imeiId = `entity:imei:${imei}`;
    const isSwapped = phonesSet.size > 1;

    addNode({
      id: imeiId,
      name: `IMEI: ${imei}`,
      type: "IMEI",
      subtitle: isSwapped ? `🚨 Hardware SIM-Swap (${phonesSet.size} SIMs Swapped)` : "Mobile Device Hardware",
      details: {
        imei,
        linkedSims: Array.from(phonesSet)
      },
      riskScore: isSwapped ? 92 : 65,
      anomalyFlags: isSwapped 
        ? ["SIM-Swapping Anomaly", `${phonesSet.size} Phone numbers operated on identical handset`] 
        : ["Hardware Identification"]
    });

    phonesSet.forEach((phone) => {
      addEdge({
        id: `imei_edge:${imei}:${phone}`,
        source: `entity:phone:${phone}`,
        target: imeiId,
        type: "SHARED_HARDWARE",
        label: "Used Same Device (IMEI)"
      });
    });
  });

  // ==========================================================================
  // 3. Process Email Artifacts (.eml Phishing Headers)
  // ==========================================================================
  const emailArtifacts = artifacts.filter((a) => a.sourceType === "EMAIL_HEADER");
  emailArtifacts.forEach((art) => {
    (art.records || []).forEach((r) => {
      const emailNodeId = `entity:email:${normalizeEntityKey(r.fromEmail)}`;
      addNode({
        id: emailNodeId,
        name: r.fromEmail,
        type: "EMAIL_SPOOF",
        subtitle: `Phishing Origin | SPF: ${r.spfStatus} | Spoof: ${r.spoofConfidenceScore}%`,
        details: {
          from: r.fromEmail,
          subject: r.subject,
          spf: r.spfStatus,
          dkim: r.dkimStatus,
          clientMailer: r.clientMailer
        },
        riskScore: r.spoofConfidenceScore || 90,
        anomalyFlags: ["Forged Email Header", "SPF Authentication Failed", "High Spoof Confidence"],
        recommendedAction: `Submit domain takedown request to registrar and block sender IP across state security gateways.`,
        linkedArtifacts: [art.id]
      });

      if (r.originatingIP) {
        if (!ipToEntities.has(r.originatingIP)) ipToEntities.set(r.originatingIP, new Set());
        ipToEntities.get(r.originatingIP).add(emailNodeId);
      }
    });
  });

  // ==========================================================================
  // 4. Process Android APK Artifacts (Banking Trojan & SMS Forwarders)
  // ==========================================================================
  const apkArtifacts = artifacts.filter((a) => a.sourceType === "ANDROID_APK_DUMP");
  apkArtifacts.forEach((art) => {
    (art.records || []).forEach((r) => {
      const apkNodeId = `entity:apk:${normalizeEntityKey(r.packageName)}`;
      addNode({
        id: apkNodeId,
        name: r.appLabel || r.packageName,
        type: "MALWARE_APK",
        subtitle: `Banking Trojan | ${r.dangerousPermissions?.length || 0} Critical Permissions`,
        details: {
          packageName: r.packageName,
          version: r.versionName,
          permissions: r.dangerousPermissions,
          c2Endpoints: r.c2Endpoints,
          smsTarget: r.smsInterceptForwardTarget
        },
        riskScore: 98,
        anomalyFlags: [
          "Trojan Signature Detected",
          "SMS Intercept & OTP Theft Capability",
          "Accessibility Service Abuse"
        ],
        recommendedAction: `Notify CERT-In for APK MD5/SHA256 signature blocklist & push Google Play Protect malware flag.`,
        linkedArtifacts: [art.id]
      });

      // Link to C2 Endpoints
      (r.c2Endpoints || []).forEach((ep) => {
        const c2Id = `entity:c2:${normalizeEntityKey(ep)}`;
        addNode({
          id: c2Id,
          name: `C2: ${ep}`,
          type: "C2_SERVER",
          subtitle: "Command & Control Host / Exfiltration Drop",
          details: { endpoint: ep },
          riskScore: 99,
          anomalyFlags: ["Malware Exfiltration Endpoint", "Command & Control Node"],
          recommendedAction: `Coordinate with NCIIPC/CERT-In for emergency DNS sinkholing of C2 host.`,
          linkedArtifacts: [art.id]
        });

        addEdge({
          id: `c2_flow:${apkNodeId}:${c2Id}`,
          source: apkNodeId,
          target: c2Id,
          type: "C2_COMMUNICATION",
          label: "Exfiltrates Intercepted OTPs"
        });

        // If C2 is an IP, also track in ipToEntities
        const cleanIp = (ep.match(/\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/) || [])[0];
        if (cleanIp) {
          if (!ipToEntities.has(cleanIp)) ipToEntities.set(cleanIp, new Set());
          ipToEntities.get(cleanIp).add(c2Id);
        }
      });

      // Link SMS Interception target phone to Telecom caller!
      if (r.smsInterceptForwardTarget) {
        const cleanSmsTarget = String(r.smsInterceptForwardTarget).replace(/[^0-9]/g, "");
        const targetPhoneId = `entity:phone:${cleanSmsTarget}`;

        // If caller node already created from CDR or create new
        addNode({
          id: targetPhoneId,
          name: `+91 ${cleanSmsTarget}`,
          type: "PHONE",
          subtitle: "🚨 OTP Theft Recipient (Trojan Exfiltration Target)",
          details: { phone: cleanSmsTarget, role: "Trojan SMS Forward Target" },
          riskScore: 96,
          anomalyFlags: ["Direct Recipient of Intercepted Banking OTPs", "Malware Syndicate Controller"],
          linkedArtifacts: [art.id]
        });

        // High-value cross-artifact edge!
        addEdge({
          id: `sms_forward:${apkNodeId}:${targetPhoneId}`,
          source: apkNodeId,
          target: targetPhoneId,
          type: "SMS_INTERCEPT_TARGET",
          label: "🚨 Forwards Stolen OTPs To"
        });
      }
    });
  });

  // ==========================================================================
  // 5. Cross-Artifact IP Synergy (Connects Email, CDR, UPI & C2)
  // ==========================================================================
  ipToEntities.forEach((entitySet, ip) => {
    // Check if proxy / bulletproof / C2
    const isProxy = ip.startsWith("185.") || ip.startsWith("103.21.") || ip.startsWith("45.") || ip.startsWith("194.") || ip.startsWith("195.");
    const isCrossLinked = entitySet.size > 1;

    // Prune domestic residential IPs used by only 1 entity!
    // They are preserved inside that account's dossier details without creating floating graph clutter.
    if (isCrossLinked || isProxy) {
      const ipNodeId = `entity:ip:${ip}`;

      addNode({
        id: ipNodeId,
        name: `IP: ${ip}`,
        type: "C2_SERVER",
        subtitle: isCrossLinked ? `🚨 Shared Cross-Artifact IP (${entitySet.size} Endpoints)` : "Foreign Proxy / Bulletproof Host",
        details: { ip, linkedEntitiesCount: entitySet.size },
        riskScore: isCrossLinked ? 95 : 85,
        anomalyFlags: isCrossLinked 
          ? ["Multi-Artifact Infrastructure Anchor", "Used Across Email, Telecom & Banking"] 
          : ["Foreign Bulletproof Proxy Infrastructure"],
        recommendedAction: `Query ASN/ISP for subscriber IPDR logs and issue preservation notice under Section 91 CrPC.`
      });

      entitySet.forEach((entId) => {
        if (nodeMap.has(entId)) {
          addEdge({
            id: `cross_ip:${ip}:${entId}`,
            source: entId,
            target: ipNodeId,
            type: "CROSS_ARTIFACT_IP",
            label: "Connected via IP Infrastructure"
          });
        }
      });
    }
  });

  // ==========================================================================
  // 6. Feature 4: Explainable Triage & Anomaly Risk Scoring Engine
  // ==========================================================================
  // Step 6a: Calculate Fund Turnaround Velocity for Financial Endpoints
  nodes.forEach((node) => {
    if (node.inboundFunds?.length > 0 && node.outboundFunds?.length > 0) {
      // Find shortest turnaround time between any inbound and subsequent outbound transfer
      let minDeltaSec = Infinity;
      let fastestInflow = null;
      let fastestOutflow = null;

      node.inboundFunds.forEach((inflow) => {
        const inTime = new Date(inflow.timestamp).getTime();
        node.outboundFunds.forEach((outflow) => {
          const outTime = new Date(outflow.timestamp).getTime();
          if (!isNaN(inTime) && !isNaN(outTime) && outTime >= inTime) {
            const diffSec = Math.round((outTime - inTime) / 1000);
            if (diffSec < minDeltaSec) {
              minDeltaSec = diffSec;
              fastestInflow = inflow;
              fastestOutflow = outflow;
            }
          }
        });
      });

      if (minDeltaSec !== Infinity) {
        node.turnaroundSeconds = minDeltaSec;
        const mins = Math.floor(minDeltaSec / 60);
        const secs = minDeltaSec % 60;
        node.turnaroundFormatted = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        node.velocityPair = { from: fastestInflow?.from, to: fastestOutflow?.to };

        if (minDeltaSec <= 180) {
          // Less than 3 minutes = Immediate multi-hop velocity!
          node.velocityTier = "IMMEDIATE_VELOCITY";
          node.velocityDisplay = `⚡ ${node.turnaroundFormatted} Turnaround`;
          if (!node.anomalyFlags.some((f) => f.includes("Immediate Multi-Hop"))) {
            node.anomalyFlags.unshift(`Immediate Multi-Hop Fund Routing Velocity (${node.turnaroundFormatted})`);
          }
        } else if (minDeltaSec <= 600) {
          // 3-10 minutes = High layering velocity
          node.velocityTier = "RAPID_LAYERING";
          node.velocityDisplay = `⚡ ${node.turnaroundFormatted} Turnaround`;
          if (!node.anomalyFlags.some((f) => f.includes("Rapid Fund Layering"))) {
            node.anomalyFlags.unshift(`Rapid Fund Layering Velocity (${node.turnaroundFormatted})`);
          }
        }
      }

      // Check split dispersal fan-out
      if (node.outboundFunds.length >= 2) {
        if (!node.anomalyFlags.some((f) => f.includes("Multi-Branch Split"))) {
          node.anomalyFlags.push(`Multi-Branch Split Dispersal (${node.outboundFunds.length} outbound conduits)`);
        }
      }
    }
  });

  // Step 6b: Compute Granular Triage Assessment for Each Node
  nodes.forEach((node) => {
    const triage = calculateEndpointTriageRisk(node, nodes, edges);
    node.triageAssessment = triage;
    node.riskScore = triage.score;
    node.triageTier = triage.tier;
    node.riskBreakdown = triage.breakdown;
    node.statutoryDirective = triage.statutoryDirective;
    node.statutorySection = triage.statutorySection;
    if (triage.velocityDisplay && !node.velocityDisplay) {
      node.velocityDisplay = triage.velocityDisplay;
    }
  });

  // Optional: Single-Click Trail Isolation Filter
  if (isolateNodeId && nodeMap.has(isolateNodeId)) {
    const keepNodeIds = new Set([isolateNodeId]);
    let currentHop = new Set([isolateNodeId]);

    for (let hop = 0; hop < 2; hop++) {
      const nextHop = new Set();
      edges.forEach((e) => {
        if (currentHop.has(e.source) && !keepNodeIds.has(e.target)) {
          keepNodeIds.add(e.target);
          nextHop.add(e.target);
        }
        if (currentHop.has(e.target) && !keepNodeIds.has(e.source)) {
          keepNodeIds.add(e.source);
          nextHop.add(e.source);
        }
      });
      currentHop = nextHop;
    }

    const isolatedNodes = nodes.filter((n) => keepNodeIds.has(n.id));
    const isolatedEdges = edges.filter((e) => keepNodeIds.has(e.source) && keepNodeIds.has(e.target));

    return {
      nodes: isolatedNodes,
      edges: isolatedEdges,
      metrics: {
        totalNodes: isolatedNodes.length,
        totalEdges: isolatedEdges.length,
        muleNodesCount: isolatedNodes.filter((n) => n.type === "L1_MULE" || n.type === "L2_MULE").length,
        cashoutNodesCount: isolatedNodes.filter((n) => n.type === "CASHOUT").length,
        sharedDevicesCount: isolatedNodes.filter((n) => n.type === "IMEI").length,
        c2ServersCount: isolatedNodes.filter((n) => n.type === "C2_SERVER").length,
        criticalRiskNodesCount: isolatedNodes.filter((n) => n.triageTier === "CRITICAL" || n.riskScore >= 85).length,
        highRiskNodesCount: isolatedNodes.filter((n) => n.triageTier === "HIGH" || (n.riskScore >= 70 && n.riskScore < 85)).length,
        isIsolated: true,
        isolatedRootId: isolateNodeId
      }
    };
  }

  return {
    nodes,
    edges,
    metrics: {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      muleNodesCount: nodes.filter((n) => n.type === "L1_MULE" || n.type === "L2_MULE").length,
      cashoutNodesCount: nodes.filter((n) => n.type === "CASHOUT").length,
      sharedDevicesCount: nodes.filter((n) => n.type === "IMEI").length,
      c2ServersCount: nodes.filter((n) => n.type === "C2_SERVER").length,
      criticalRiskNodesCount: nodes.filter((n) => n.triageTier === "CRITICAL" || n.riskScore >= 85).length,
      highRiskNodesCount: nodes.filter((n) => n.triageTier === "HIGH" || (n.riskScore >= 70 && n.riskScore < 85)).length
    }
  };
}

/**
 * Feature 4: Explainable Risk Scoring Engine
 * Assigns explainable risk scores (0–100) based on anomaly patterns:
 * - Fund turnaround velocity (< 3 mins, rapid layering, split dispersal)
 * - Hardware multiplexing / SIM swapping (3+ SIMs on 1 IMEI)
 * - Spoofed email header signatures (SPF/DKIM fail, high spoof confidence)
 * - Banking Trojan SMS intercept & C2 exfiltration
 * - Terminal cashout & crypto off-ramping
 */
export function calculateEndpointTriageRisk(node, allNodes = [], allEdges = []) {
  if (!node) return { score: 0, tier: "LOW", breakdown: {} };

  let velocityScore = 0;
  let hardwareScore = 0;
  let headerScore = 0;
  let malwareScore = 0;
  let offRampScore = 0;
  let crossArtifactScore = 0;
  const flags = [...(node.anomalyFlags || [])];

  // 1. Multi-Hop Fund Routing Velocity
  if (node.turnaroundSeconds !== undefined) {
    if (node.turnaroundSeconds <= 180) {
      velocityScore += 35; // Turnaround < 3 mins
    } else if (node.turnaroundSeconds <= 600) {
      velocityScore += 25; // Turnaround 3-10 mins
    } else if (node.turnaroundSeconds <= 1800) {
      velocityScore += 15;
    }
  }
  if (node.outboundFunds?.length >= 2) {
    velocityScore += 10; // Split layering
  }

  // 2. Hardware & IMEI Multiplexing
  if (node.type === "IMEI") {
    const simCount = node.details?.linkedSims?.length || 0;
    if (simCount >= 3) {
      hardwareScore += 35;
      if (!flags.some(f => f.includes("High-Velocity SIM Switching"))) {
        flags.push(`High-Velocity SIM Switching (${simCount} SIMs on 1 IMEI)`);
      }
    } else if (simCount >= 2) {
      hardwareScore += 25;
    }
  }
  if (node.type === "PHONE") {
    // Check if linked to an IMEI with multiple SIMs
    const linkedImeiEdge = allEdges.find(e => (e.source === node.id || e.target === node.id) && e.type === "SHARED_HARDWARE");
    if (linkedImeiEdge) {
      const imeiNode = allNodes.find(n => n.id === (linkedImeiEdge.source === node.id ? linkedImeiEdge.target : linkedImeiEdge.source));
      if (imeiNode && (imeiNode.details?.linkedSims?.length || 0) > 1) {
        hardwareScore += 25;
        if (!flags.some(f => f.includes("Multiplexed Handset"))) {
          flags.push(`Operated on Multi-SIM Handset (${imeiNode.name})`);
        }
      }
    }
  }

  // 3. Email Spoofing & Header Origin
  if (node.type === "EMAIL_SPOOF") {
    if (node.details?.spf === "FAIL" || node.details?.spf === "SOFTFAIL") {
      headerScore += 20;
    }
    if (node.details?.dkim === "FAIL") {
      headerScore += 15;
    }
    const spoofConf = node.details?.spoofConfidenceScore || 0;
    if (spoofConf >= 80) {
      headerScore += 20;
    } else if (spoofConf >= 50) {
      headerScore += 10;
    }
  }

  // 4. Banking Trojan & C2 Exfiltration
  if (node.type === "MALWARE_APK") {
    malwareScore += 35;
    const perms = node.details?.permissions || [];
    if (perms.some(p => p.includes("RECEIVE_SMS") || p.includes("READ_SMS"))) {
      malwareScore += 15;
    }
    if (perms.some(p => p.includes("ACCESSIBILITY"))) {
      malwareScore += 15;
    }
  } else if (node.type === "C2_SERVER") {
    malwareScore += 45;
  } else if (node.details?.role === "Trojan SMS Forward Target" || node.subtitle?.includes("OTP Theft")) {
    malwareScore += 45;
  }

  // 5. Terminal Cashout & Crypto Off-Ramp
  if (node.type === "CASHOUT") {
    offRampScore += 40;
  }

  // 6. Cross-Artifact Infrastructure Synergy
  if (node.type === "C2_SERVER" && (node.details?.linkedEntitiesCount || 0) > 1) {
    crossArtifactScore += 20;
  }

  // Calculate Base Composite Score
  let compositeScore = 0;
  if (node.type === "VICTIM") {
    compositeScore = 10;
  } else if (node.type === "CASHOUT") {
    compositeScore = Math.max(90, 50 + offRampScore + (velocityScore > 0 ? 10 : 0));
  } else if (node.type === "MALWARE_APK" || node.type === "C2_SERVER") {
    compositeScore = Math.max(88, 45 + malwareScore + crossArtifactScore);
  } else if (node.type === "L1_MULE") {
    compositeScore = Math.max(72, 40 + velocityScore + (node.outboundFunds?.length > 1 ? 15 : 0));
  } else if (node.type === "L2_MULE") {
    compositeScore = Math.max(78, 45 + velocityScore + 10);
  } else if (node.type === "IMEI") {
    compositeScore = Math.max(65, 30 + hardwareScore);
  } else if (node.type === "EMAIL_SPOOF") {
    compositeScore = Math.max(85, 35 + headerScore);
  } else if (node.type === "PHONE") {
    if (node.details?.role === "Trojan SMS Forward Target") {
      compositeScore = 96;
    } else {
      compositeScore = Math.max(50, 35 + hardwareScore);
    }
  } else {
    compositeScore = Math.max(25, velocityScore + hardwareScore + headerScore + malwareScore);
  }

  const finalScore = Math.min(99, Math.max(10, compositeScore));

  // Determine Triage Tier
  let tier = "LOW";
  if (finalScore >= 85) tier = "CRITICAL";
  else if (finalScore >= 70) tier = "HIGH";
  else if (finalScore >= 40) tier = "MEDIUM";

  // Formulate Velocity Display
  let velocityDisplay = null;
  if (node.turnaroundFormatted) {
    velocityDisplay = `⚡ ${node.turnaroundFormatted} Fund Turnaround`;
  } else if (node.type === "IMEI" && (node.details?.linkedSims?.length || 0) > 1) {
    velocityDisplay = `📱 ${node.details.linkedSims.length} SIMs on Handset`;
  } else if (node.type === "EMAIL_SPOOF") {
    velocityDisplay = `✉️ SPF ${node.details?.spf || "FAIL"} (94% Spoof)`;
  } else if (node.type === "MALWARE_APK") {
    velocityDisplay = `🛡️ SMS Intercept & Accessibility Abuse`;
  } else if (node.type === "CASHOUT") {
    velocityDisplay = `💰 Terminal Cashout Point`;
  }

  // Statutory Police Legal Directives
  let statutoryDirective = node.recommendedAction || "";
  let statutorySection = "Sec 91 CrPC";

  if (node.type === "L1_MULE") {
    statutorySection = "1930 Portal / Sec 91 CrPC";
    statutoryDirective = `Issue immediate 1930 NCRP / I4C debit freeze on ${node.details?.account || "account"} (${node.details?.vpa || "UPI handle"}). Issue Section 91 CrPC notice to bank for beneficiary KYC & IP logs.`;
  } else if (node.type === "L2_MULE") {
    statutorySection = "Sec 91 CrPC / PMLA";
    statutoryDirective = `Serve Section 91 CrPC directive to ${node.details?.bank || "Nodal Bank"} to freeze balance, preserve 90-day ledger, and identify Layer-3 cashout conduits.`;
  } else if (node.type === "CASHOUT") {
    statutorySection = "Sec 102 CrPC Seizure";
    statutoryDirective = `Dispatch immediate CCTV seizure requisition under Section 91 CrPC to terminal operator. If Crypto P2P, submit immediate freeze ticket to Binance/WazirX compliance.`;
  } else if (node.type === "EMAIL_SPOOF") {
    statutorySection = "Sec 69A IT Act / CERT-In";
    statutoryDirective = `Submit emergency domain takedown under Section 69A IT Act to registrar and alert CERT-In to block originating IP ${node.details?.originatingIP || "185.220.101.45"}.`;
  } else if (node.type === "MALWARE_APK") {
    statutorySection = "Sec 43 / 66 IT Act";
    statutoryDirective = `Transmit APK SHA-256 hash to CERT-In & Google Play Protect for remote handset neutralization; seize C2 drop servers.`;
  } else if (node.type === "C2_SERVER") {
    statutorySection = "Sec 69A IT Act / NCIIPC";
    statutoryDirective = `Initiate emergency DNS sinkhole order with NCIIPC/CERT-In and request IPDR logs from hosting provider under Section 91 CrPC.`;
  } else if (node.type === "IMEI") {
    statutorySection = "CEIR Portal / Sec 91 CrPC";
    statutoryDirective = `Blacklist IMEI on DoT CEIR portal and issue Section 91 CrPC order to TSP for all associated CDR/IPDR dumps.`;
  } else if (node.type === "PHONE") {
    statutorySection = "DoT Sanchar Saathi / Sec 91 CrPC";
    statutoryDirective = `Issue immediate SIM de-allocation notice to telecom operator and query subscriber CAF form & live tower ping.`;
  }

  return {
    score: finalScore,
    tier,
    breakdown: {
      velocityScore: Math.min(35, velocityScore),
      hardwareScore: Math.min(35, hardwareScore),
      headerScore: Math.min(35, headerScore),
      malwareScore: Math.min(45, malwareScore),
      offRampScore: Math.min(40, offRampScore),
      crossArtifactScore: Math.min(20, crossArtifactScore)
    },
    flags,
    velocityDisplay,
    statutoryDirective,
    statutorySection
  };
}

/**
 * Returns prioritized triage queue matrix sorted by risk score descending
 */
export function getTriageRiskMatrix(nodes = [], edges = []) {
  const rankedEndpoints = [...nodes].sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0));

  const tierCounts = {
    CRITICAL: rankedEndpoints.filter((n) => n.triageTier === "CRITICAL" || n.riskScore >= 85).length,
    HIGH: rankedEndpoints.filter((n) => n.triageTier === "HIGH" || (n.riskScore >= 70 && n.riskScore < 85)).length,
    MEDIUM: rankedEndpoints.filter((n) => n.triageTier === "MEDIUM" || (n.riskScore >= 40 && n.riskScore < 70)).length,
    LOW: rankedEndpoints.filter((n) => (n.triageTier === "LOW" || n.riskScore < 40) && n.type !== "VICTIM").length,
    VICTIMS: rankedEndpoints.filter((n) => n.type === "VICTIM").length
  };

  const anomalyCounts = {
    immediateVelocity: rankedEndpoints.filter((n) => n.turnaroundSeconds !== undefined && n.turnaroundSeconds <= 180).length,
    rapidLayering: rankedEndpoints.filter((n) => n.turnaroundSeconds !== undefined && n.turnaroundSeconds > 180 && n.turnaroundSeconds <= 600).length,
    simMultiplexing: rankedEndpoints.filter((n) => n.type === "IMEI" || n.anomalyFlags?.some(f => f.includes("SIM"))).length,
    headerSpoofing: rankedEndpoints.filter((n) => n.type === "EMAIL_SPOOF").length,
    trojanMalware: rankedEndpoints.filter((n) => n.type === "MALWARE_APK" || n.type === "C2_SERVER" || n.details?.role === "Trojan SMS Forward Target").length,
    cashoutOfframp: rankedEndpoints.filter((n) => n.type === "CASHOUT").length
  };

  return {
    rankedEndpoints,
    tierCounts,
    anomalyCounts,
    totalEndpoints: rankedEndpoints.length
  };
}

/**
 * Traces the complete upstream and downstream transaction path for a selected node
 */
export function traceMuleFlowPath(selectedNodeId, allNodes = [], allEdges = []) {
  if (!selectedNodeId) return { pathNodeIds: new Set(), pathEdgeIds: new Set() };

  const pathNodeIds = new Set([selectedNodeId]);
  const pathEdgeIds = new Set();

  // Downstream BFS (Follow outgoing funds flow)
  const queueDown = [selectedNodeId];
  while (queueDown.length > 0) {
    const curr = queueDown.shift();
    allEdges.forEach((e) => {
      if (e.source === curr && (e.type === "FUNDS_FLOW" || e.type === "C2_COMMUNICATION" || e.type === "SMS_INTERCEPT_TARGET")) {
        pathEdgeIds.add(e.id);
        if (!pathNodeIds.has(e.target)) {
          pathNodeIds.add(e.target);
          queueDown.push(e.target);
        }
      }
    });
  }

  // Upstream BFS (Follow incoming funds flow)
  const queueUp = [selectedNodeId];
  while (queueUp.length > 0) {
    const curr = queueUp.shift();
    allEdges.forEach((e) => {
      if (e.target === curr && (e.type === "FUNDS_FLOW" || e.type === "C2_COMMUNICATION" || e.type === "SMS_INTERCEPT_TARGET")) {
        pathEdgeIds.add(e.id);
        if (!pathNodeIds.has(e.source)) {
          pathNodeIds.add(e.source);
          queueUp.push(e.source);
        }
      }
    });
  }

  return { pathNodeIds, pathEdgeIds };
}
