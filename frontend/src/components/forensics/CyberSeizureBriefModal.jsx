import React, { useState } from "react";
import { 
  RiCloseLine, 
  RiPrinterLine, 
  RiDownload2Line, 
  RiFileCopyLine, 
  RiShieldCheckLine, 
  RiTimeLine, 
  RiBankCardLine, 
  RiAlertFill,
  RiBuilding2Line,
  RiCheckDoubleLine,
  RiQrCodeLine
} from "react-icons/ri";

export default function CyberSeizureBriefModal({ briefData, isOpen, onClose }) {
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!isOpen || !briefData) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(briefData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Sec91_Seizure_Brief_${briefData.caseReference.replace(/[^a-zA-Z0-9]/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleCopyNotice = () => {
    const noticeText = `
GOVERNMENT OF MADHYA PRADESH - POLICE DEPARTMENT
STATE CYBER CRIME INVESTIGATION CELL, BHOPAL
NOTICE UNDER SECTION 91 Cr.P.C. / SECTION 94 BNSS 2023 & SECTION 102 Cr.P.C.

TO: NODAL OFFICER (FRAUD RISK MANAGEMENT / OPERATIONS)
RE: URGENT GOLDEN-HOUR DEBIT FREEZE & ACCOUNT LIEN ORDER
CASE REF: ${briefData.caseReference}
DATE: ${briefData.generatedDate} ${briefData.generatedTime}

WHEREAS an investigation into financial cyber fraud is being conducted under FIR Ref: ${briefData.caseReference}.
Digital artifact correlation and NPCI settlement auditing have established that fraudulent siphoned funds totaling ${briefData.kpis[0].value} have been funneled through the following accounts:

${briefData.suspectMules.map((m, idx) => `${idx + 1}. ACCOUNT: ${m.account} | VPA: ${m.vpa} | BANK: ${m.bank} | HOLDER: ${m.name} | INFLOW: ₹${m.inflowINR.toLocaleString("en-IN")}`).join("\n")}

YOU ARE HEREBY DIRECTED TO:
1. Immediately place a total DEBIT FREEZE / LIEN on the above accounts under Section 102 Cr.P.C.
2. Furnish KYC documents, Account Opening Forms (AOF), linked Aadhaar/PAN, and full statement of account within 24 hours under Section 91 Cr.P.C.
3. Preserve all NetBanking IP login access logs and associated mobile numbers.

Authorized Investigating Officer:
${briefData.officer.name} (${briefData.officer.badge})
State Cyber Crime Investigation Cell, Madhya Pradesh Police
    `.trim();

    navigator.clipboard.writeText(noticeText);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn font-sans">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90 print:hidden">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-sm">
              <RiShieldCheckLine />
            </span>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                Section 91 CrPC Standardized Investigative Seizure Brief
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Admissible under Section 65B Indian Evidence Act / BSA 2023 • Golden-Hour Seizure Notice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyNotice}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Copy Section 91 CrPC Bank Lien Notice"
            >
              {copiedNotice ? <RiCheckDoubleLine className="text-emerald-400" /> : <RiFileCopyLine />}
              <span>{copiedNotice ? "Notice Copied!" : "Copy Bank Notice"}</span>
            </button>

            <button
              onClick={handleDownloadJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer"
              title="Download standardized court-admissible forensic JSON"
            >
              <RiDownload2Line />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md shadow-blue-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Print official one-page police brief or save as PDF"
            >
              <RiPrinterLine />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <RiCloseLine className="text-xl" />
            </button>
          </div>
        </div>

        {/* Official Printable Brief Document Sheet */}
        <div 
          id="printable-seizure-brief"
          className="flex-1 overflow-y-auto p-6 sm:p-10 bg-slate-950 text-slate-200 space-y-6 text-xs selection:bg-blue-500/20 print:p-0 print:bg-white print:text-black"
        >
          {/* Document Header */}
          <div className="border-b-2 border-slate-700 pb-5 relative">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase font-extrabold text-blue-400 print:text-blue-800 block">
                  MADHYA PRADESH POLICE • STATE CYBER CRIME INVESTIGATION CELL
                </span>
                <h1 className="text-lg sm:text-xl font-black text-white print:text-black tracking-tight mt-1 uppercase">
                  INVESTIGATIVE SEIZURE BRIEF & TIMELINE REPORT
                </h1>
                <p className="text-[11px] text-slate-400 print:text-gray-600 font-mono mt-0.5">
                  ISSUED UNDER SECTION 91 & 102 Cr.P.C. / SECTION 94 BNSS 2023 (GOLDEN-HOUR ASSET FREEZING)
                </p>
              </div>

              {/* Watermark / Stamp */}
              <div className="text-right">
                <div className="inline-block border border-red-500/40 text-red-400 font-mono font-bold text-[9px] uppercase px-2 py-0.5 rounded bg-red-950/20 mb-1">
                  SECRET / MOST IMMEDIATE
                </div>
                <p className="font-mono text-[10px] text-slate-400">DOC: {briefData.documentId}</p>
              </div>
            </div>

            {/* Case Meta Box */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800 text-[10.5px] font-mono">
              <div>
                <span className="text-slate-500 block text-[9px]">CASE REFERENCE</span>
                <span className="font-bold text-white print:text-black">{briefData.caseReference}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">INVESTIGATING OFFICER</span>
                <span className="font-bold text-white print:text-black">{briefData.officer.name} ({briefData.officer.badge})</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">DATE & TIMESTAMP</span>
                <span className="font-bold text-white print:text-black">{briefData.generatedDate} {briefData.generatedTime}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[9px]">EVIDENTIARY STATUS</span>
                <span className="font-bold text-emerald-400 print:text-green-700">SEC 65B CERTIFIED</span>
              </div>
            </div>
          </div>

          {/* KPI Matrix Strip */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 text-center font-mono">
            {briefData.kpis.map((kpi, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 print:bg-gray-100 print:border-gray-300">
                <span className="text-[8.5px] text-slate-500 print:text-gray-600 block uppercase font-sans font-semibold truncate">
                  {kpi.label}
                </span>
                <span className="text-sm font-bold text-white print:text-black block mt-0.5">
                  {kpi.value}
                </span>
              </div>
            ))}
          </div>

          {/* Section 1: Evidentiary Integrity & Cryptographic Checksums (Sec 65B) */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-blue-400 print:text-blue-800 flex items-center gap-1.5">
              <RiShieldCheckLine className="text-sm" />
              <span>I. EVIDENTIARY CHAIN-OF-CUSTODY & CRYPTOGRAPHIC HASH REGISTER</span>
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-800 print:border-gray-300">
              <table className="w-full text-left text-[10.5px] font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 print:bg-gray-200 print:text-black">
                  <tr>
                    <th className="py-1.5 px-3">EVIDENCE ARTIFACT</th>
                    <th className="py-1.5 px-3">ARTIFACT TYPE</th>
                    <th className="py-1.5 px-3">RECORDS</th>
                    <th className="py-1.5 px-3">SHA-256 INTEGRITY HASH (SEC 65B ADMISSIBLE)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                  {briefData.evidentiarySummary.artifactsList.map((art, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-1.5 px-3 font-bold text-white print:text-black">{art.fileName}</td>
                      <td className="py-1.5 px-3 text-slate-300">{art.sourceType}</td>
                      <td className="py-1.5 px-3 text-slate-400">{art.recordCount}</td>
                      <td className="py-1.5 px-3 text-emerald-400 print:text-green-800 font-mono text-[9.5px]">
                        {art.sha256}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Chronological Golden-Hour Event Timeline */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-amber-400 print:text-amber-800 flex items-center gap-1.5">
              <RiTimeLine className="text-sm" />
              <span>II. CHRONOLOGICAL FRAUD ATTACK & MONEY SIPHONING TIMELINE</span>
            </h4>
            <div className="space-y-2">
              {briefData.timeline.map((item, idx) => (
                <div 
                  key={idx} 
                  className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] print:bg-gray-50 print:border-gray-300"
                >
                  <div className="flex items-start sm:items-center gap-2.5">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                      {item.timeLabel}
                    </span>
                    <div>
                      <span className="font-bold text-white print:text-black">{item.event}: </span>
                      <span className="text-slate-300 print:text-gray-700">{item.description}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9.5px] font-mono font-semibold self-start sm:self-auto ${
                    item.severity === "CRITICAL" 
                      ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                      : (item.severity === "HIGH" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-slate-800 text-slate-300")
                  }`}>
                    {item.phase}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Prime Suspect Mule Accounts & Financial Trail */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-red-400 print:text-red-800 flex items-center gap-1.5">
              <RiBankCardLine className="text-sm" />
              <span>III. IDENTIFIED MULE ACCOUNT CLUSTER & SEIZURE TARGETS</span>
            </h4>
            <div className="overflow-x-auto rounded-lg border border-slate-800 print:border-gray-300">
              <table className="w-full text-left text-[10.5px] font-mono">
                <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 print:bg-gray-200 print:text-black">
                  <tr>
                    <th className="py-1.5 px-3">SUSPECT / BENEFICIARY</th>
                    <th className="py-1.5 px-3">MULE LAYER</th>
                    <th className="py-1.5 px-3">BANK & ACCOUNT</th>
                    <th className="py-1.5 px-3">UPI VPA</th>
                    <th className="py-1.5 px-3">INFLOW (INR)</th>
                    <th className="py-1.5 px-3">ACTION DIRECTIVE</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 print:divide-gray-200">
                  {briefData.suspectMules.map((m, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-1.5 px-3 font-bold text-white print:text-black">{m.name}</td>
                      <td className="py-1.5 px-3">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          m.layer.includes("Layer-1") ? "bg-amber-500/10 text-amber-300" : "bg-orange-500/10 text-orange-300"
                        }`}>
                          {m.layer}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-slate-300">{m.bank} ({m.account})</td>
                      <td className="py-1.5 px-3 text-blue-300 font-bold">{m.vpa}</td>
                      <td className="py-1.5 px-3 text-emerald-400 font-bold">₹{m.inflowINR.toLocaleString("en-IN")}</td>
                      <td className="py-1.5 px-3 text-red-300 text-[9.5px] max-w-[200px] truncate">{m.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4: Actionable Legal Seizure Directives (Sec 91 CrPC) */}
          <div className="space-y-2">
            <h4 className="text-[11px] font-mono font-bold uppercase tracking-wider text-purple-400 print:text-purple-800 flex items-center gap-1.5">
              <RiAlertFill className="text-sm" />
              <span>IV. STATUTORY SEIZURE MANDATES FOR POLICE FIELD UNITS</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {briefData.seizureDirectives.map((sd, idx) => (
                <div 
                  key={idx} 
                  className="p-3 rounded-lg bg-slate-900/70 border border-slate-800 space-y-1.5 text-[10.5px] print:bg-gray-50 print:border-gray-300"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white print:text-black uppercase tracking-wide">
                      {sd.targetType}
                    </span>
                    <span className="px-1.5 py-0.5 rounded text-[8.5px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                      {sd.priority}
                    </span>
                  </div>
                  <p className="text-[9px] font-mono text-slate-400 print:text-gray-600">
                    Authority: {sd.statutoryProvision}
                  </p>
                  <ul className="list-disc pl-4 space-y-1 text-slate-300 print:text-gray-800 text-[10px]">
                    {sd.instructions.map((ins, i) => (
                      <li key={i}>{ins}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Document Verification & Digital Signature Block */}
          <div className="pt-6 mt-6 border-t-2 border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-[10px] font-mono">
            <div>
              <p className="text-slate-400">DIGITAL FORENSIC VERIFICATION HASH:</p>
              <p className="font-mono text-emerald-400 text-[9px] truncate max-w-md">
                SHA256: {briefData.documentId}-MPPOLICE-CYBER-CELL-COURT-VERIFIED
              </p>
            </div>

            <div className="text-right border-l sm:border-l-0 sm:border-t-0 pl-3 sm:pl-0">
              <p className="text-slate-400 uppercase">SUBMITTED BY INVESTIGATING OFFICER:</p>
              <p className="font-bold text-white print:text-black mt-0.5">{briefData.officer.name}</p>
              <p className="text-slate-500">{briefData.officer.badge} • {briefData.officer.unit}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
