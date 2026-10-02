/**
 * ============================================================================
 * Script: scripts/export_legal_deliverables.js
 * ----------------------------------------------------------------------------
 * Module D: CLI Exporter for Dual Legal Deliverables & Anti-Hallucination Proof
 * Usage: node scripts/export_legal_deliverables.js [VICTIM_ACCOUNT_ID]
 * Example: node scripts/export_legal_deliverables.js KKBK10000000
 * ============================================================================
 */

const fs = require("fs");
const path = require("path");
const { traceVictimMultiHop } = require("../backend/fast2MProcessor");

async function main() {
  const accountId = (process.argv[2] || "KKBK10000000").trim().toUpperCase();
  console.log(`\n⚖️  [Module D] Exporting Court-Ready Legal Deliverables for Account: ${accountId}...`);

  const t0 = Date.now();
  const trace = await traceVictimMultiHop(accountId);
  const elapsed = Date.now() - t0;

  if (!trace || !trace.success) {
    console.error(`❌ Failed to trace account: ${accountId}`);
    process.exit(1);
  }

  const outDir = path.join(__dirname, "../deliverables", accountId);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  console.log(`⚡ Graph Traversed in ${trace.latencyFormatted} (${elapsed}ms total)`);
  console.log(`📁 Saving court-ready deliverables into: ${outDir}\n`);

  // 1. Deliverable 1: Chronological Police Case Diary (Sec 172 CrPC / Sec 192 BNSS)
  const caseDiaryText = `OFFICE OF THE SUPERINTENDENT OF POLICE (CYBER CRIME)
INDORE POLICE COMMISSIONERATE, MADHYA PRADESH
POLICE CASE DIARY (PART-II) — UNDER SECTION 172 CrPC / SECTION 192 BNSS, 2023
====================================================================================================
CASE PARTICULARS:
FIR Reference       : ${trace.caseDiary?.metadata?.firNumber || "FIR/IND/CYBER/2026/0419"}
Police Station      : ${trace.caseDiary?.metadata?.policeStation || "Cyber Crime PS, Indore Commissionerate"}
Case Diary Ref No.  : ${trace.caseDiary?.metadata?.caseDiaryNumber || "CD/2026/0419/P-04"}
Date of Entry       : ${trace.caseDiary?.metadata?.dateOfInvestigation || new Date().toLocaleDateString("en-IN")}
Statutory Sections  : ${trace.caseDiary?.metadata?.statutorySections || "Sec 318(4), 319(2), 61(2) BNS r/w Sec 66C/66D IT Act"}
Complainant Victim  : ${trace.victimAccount} (${trace.victimBank}, IFSC: ${trace.victimIFSC})
Total Funds Siphoned: ${trace.totalSiphonedFormatted} (${trace.totalSiphonedWords || ""})
Total Funds Offramped: ${trace.totalCashedOutFormatted} (${trace.totalCashedOutWords || ""})
Syndicate Topology  : ${trace.counts?.totalNodes || 0} Accounts / ${trace.counts?.totalEdges || 0} Flow Conduits
Traversal Latency   : ${trace.latencyFormatted} (In-Memory BFS Graph Traversal)
Cryptographic Hash  : SHA256:${trace.provenanceDigest || trace.antiHallucinationGuardrail?.subgraphTxnHash}
----------------------------------------------------------------------------------------------------

CHRONOLOGICAL MODUS OPERANDI & MULTI-TIER DISPERSION TRAIL:
${(trace.caseDiary?.phases || []).map(p => `[PHASE ${p.step}] ${p.phase}
Timestamp: ${p.timestamp}
Layer    : ${p.layer}
Details  : ${p.description}
`).join("\n")}
----------------------------------------------------------------------------------------------------
CURRENT HOLDING ACCOUNTS RECOMMENDED FOR IMMEDIATE FREEZING (SEC 106 BNSS):
${(trace.holdingAccountsRecommendations || []).map((h, i) => `${i + 1}. [${h.priority}] Account: ${h.account} | Bank: ${h.bank} | IFSC: ${h.ifsc}
   Disputed Amount: ${h.disputedAmountFormatted} | Txn UTR: ${h.viaTxnId}
   Action: ${h.action}`).join("\n\n")}

----------------------------------------------------------------------------------------------------
INVESTIGATION OFFICER STATUTORY CERTIFICATION:
"I, Inspector R. K. Sharma, Cyber Crime PS Indore, hereby certify that the aforesaid fund dispersal sequence has been mechanically extracted from the 2,000,000 banking ledger using deterministic BFS graph traversal without generative AI hallucination or manual extrapolation."

(Shri R. K. Sharma)
Investigating Officer / Cyber Crime Police Station
Indore Police Commissionerate, Madhya Pradesh
Badge: MPP-2026-IO
`;
  const caseDiaryPath = path.join(outDir, `1_Police_Case_Diary_FIR0419_${accountId}.txt`);
  fs.writeFileSync(caseDiaryPath, caseDiaryText, "utf8");
  console.log(`✅ 1. Case Diary: ${path.basename(caseDiaryPath)}`);

  // 2. Deliverable 2: Statutory Bank Freezing Requisitions (Sec 91 CrPC / Sec 94 & 106 BNSS)
  const bundleText = (trace.section91Requisitions || []).map((n, i) => 
    `====================================================================================================
BANK REQUISITION NOTICE #${i + 1} — ${n.bank} (Disputed: ${n.totalDisputedAmountFormatted})
====================================================================================================
${n.statutoryNoticeText}`
  ).join("\n\n\n");
  const bundlePath = path.join(outDir, `2_Section91_Bank_Freezing_Notices_Bundle_${accountId}.txt`);
  fs.writeFileSync(bundlePath, bundleText, "utf8");
  console.log(`✅ 2. Bank Freezing Notices (${trace.section91Requisitions.length} Banks): ${path.basename(bundlePath)}`);

  // Also write individual bank notices
  const bankDir = path.join(outDir, "bank_notices");
  if (!fs.existsSync(bankDir)) fs.mkdirSync(bankDir);
  (trace.section91Requisitions || []).forEach(n => {
    const singlePath = path.join(bankDir, `Notice_${n.bankCode || "BANK"}_${accountId}.txt`);
    fs.writeFileSync(singlePath, n.statutoryNoticeText, "utf8");
  });
  console.log(`   └─ Saved ${trace.section91Requisitions.length} individual bank notices into: ${bankDir}`);

  // 3. Deliverable 3: Section 63 BSA / Section 65B IEA Electronic Evidence Certificate
  const bsa = trace.bsa63Certificate || {};
  const certText = `====================================================================================================
CERTIFICATE OF ELECTRONIC EVIDENCE
UNDER SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM (BSA), 2023
READ WITH SECTION 65B OF INDIAN EVIDENCE ACT, 1872
====================================================================================================
Certificate Ref  : ${bsa.certificateId}
Issuing Authority: ${bsa.issuingAuthority}
Police Station   : ${bsa.policeStation}
Case FIR Ref     : ${bsa.firReference}
Date & Timestamp : ${bsa.timestamp}

ELECTRONIC SOURCE PARTICULARS:
Source File      : ${bsa.sourceDatasetFile}
Extraction Engine: Abhedya-Chakra Forensic Topological Indexer v2.0 (Zero-LLM Math Exact)
System Specs     : ${bsa.systemSpecs}
Verified Records : ${bsa.verifiedRecordsCount} Directed Flows
Total Volume     : ${bsa.totalDisputedAmountFormatted}
Evidence SHA-256 : ${trace.provenanceDigest}

STATUTORY ATTESTATION & DECLARATION:
${(bsa.declarations || []).join("\n\n")}

I hereby depose and verify that the above contents are true and correct to my official knowledge as derived mechanically through lawful computer processing.

(Shri R. K. Sharma)
Inspector of Police / Investigating Officer
Cyber Crime Police Station, Indore Commissionerate
Badge: MPP-2026-IO
Digital Seal Hash (SHA-256): ${trace.provenanceDigest}
`;
  const certPath = path.join(outDir, `3_Sec63_BSA_Electronic_Certificate_${accountId}.txt`);
  fs.writeFileSync(certPath, certText, "utf8");
  console.log(`✅ 3. Sec 63 BSA Electronic Certificate: ${path.basename(certPath)}`);

  // 4. Deliverable 4: Isolated Syndicate CSV Sub-Dataset
  const records = trace.subDatasetRecords || [];
  const csvHeaders = ["Transaction_ID", "Sender_Account", "Receiver_Account", "Sender_IFSC", "Receiver_IFSC", "Amount", "Timestamp", "Payment_Mode", "Narration", "IP_Address", "Device_Type"];
  const csvRows = records.map(r => [
    r.txnId || "",
    r.from || "",
    r.to || "",
    r.sIFSC || "",
    r.rIFSC || "",
    r.amt || 0,
    r.ts || "",
    r.mode || "",
    `"${(r.narr || "").replace(/"/g, '""')}"`,
    r.ip || "",
    r.dev || ""
  ]);
  const csvContent = [csvHeaders.join(","), ...csvRows.map(r => r.join(","))].join("\n");
  const csvPath = path.join(outDir, `4_Syndicate_Ledger_${accountId}.csv`);
  fs.writeFileSync(csvPath, csvContent, "utf8");
  console.log(`✅ 4. Isolated Syndicate CSV: ${path.basename(csvPath)} (${records.length} transactions)`);

  console.log(`\n🎉 All Module D Deliverables successfully generated for ${accountId}!\n`);
}

main().catch(err => {
  console.error("Fatal export error:", err);
  process.exit(1);
});
