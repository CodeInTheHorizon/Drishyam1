import React, { useState } from "react";
import { FaFilePdf, FaFileExcel, FaShieldAlt, FaFileCode, FaCopy, FaCheck } from "react-icons/fa";

const ReportPreview = ({ reportData, onExport, onShare, onSchedule }) => {
  const [copiedNotice, setCopiedNotice] = useState(false);

  if (!reportData) {
    return (
      <div className="bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl p-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400 font-space text-xs">
        <FaShieldAlt className="text-3xl text-slate-600 animate-pulse" />
        <span>Awaiting parameter compilation. Click 'Preview Report' to generate.</span>
      </div>
    );
  }

  const { title, subtitle, classification, date, meta, summary, kpis, findings, recommendations, isCyberBrief, cyberBriefData } = reportData;
  const doubleBorder = "border-t border-slate-800/30 my-6";

  const handleCopyBankNotice = () => {
    if (!cyberBriefData) return;
    const noticeText = `
GOVERNMENT OF MADHYA PRADESH - POLICE DEPARTMENT
STATE CYBER CRIME INVESTIGATION CELL, BHOPAL
NOTICE UNDER SECTION 91 Cr.P.C. / SECTION 94 BNSS 2023 & SECTION 102 Cr.P.C.

TO: NODAL OFFICER (FRAUD RISK MANAGEMENT / OPERATIONS)
RE: URGENT GOLDEN-HOUR DEBIT FREEZE & ACCOUNT LIEN ORDER
CASE REF: ${cyberBriefData.caseReference}
DATE: ${cyberBriefData.generatedDate} ${cyberBriefData.generatedTime}

WHEREAS an investigation into financial cyber fraud is being conducted under FIR Ref: ${cyberBriefData.caseReference}.
Digital artifact correlation and NPCI settlement auditing have established that fraudulent siphoned funds totaling ${cyberBriefData.kpis[0]?.value || "₹3,42,000"} have been funneled through the following accounts:

${cyberBriefData.suspectMules.map((m, idx) => `${idx + 1}. ACCOUNT: ${m.account} | VPA: ${m.vpa} | BANK: ${m.bank} | HOLDER: ${m.name} | INFLOW: ₹${m.inflowINR.toLocaleString("en-IN")}`).join("\n")}

YOU ARE HEREBY DIRECTED TO:
1. Immediately place a total DEBIT FREEZE / LIEN on the above accounts under Section 102 Cr.P.C.
2. Furnish KYC documents, Account Opening Forms (AOF), linked Aadhaar/PAN, and full statement of account within 24 hours under Section 91 Cr.P.C.
3. Preserve all NetBanking IP login access logs and associated mobile numbers.

Authorized Investigating Officer:
${cyberBriefData.officer.name} (${cyberBriefData.officer.badge})
State Cyber Crime Investigation Cell, Madhya Pradesh Police
    `.trim();

    navigator.clipboard.writeText(noticeText);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 3000);
  };

  const handleExportJSON = () => {
    if (!cyberBriefData) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cyberBriefData, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Sec91_Seizure_Brief_${cyberBriefData.caseReference.replace(/[^a-zA-Z0-9]/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 w-full">
      
      {/* 1. Confidential Document Sheet */}
      <div 
        className="bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl w-full relative overflow-hidden font-space text-xs text-slate-300 leading-relaxed selection:bg-blue-500/20"
        style={{ padding: "40px 48px" }}
      >
        
        {/* Security Watermark Stamp */}
        <div className="absolute top-8 right-8 border border-red-500/40 text-red-500/60 font-bold uppercase tracking-widest text-[9px] px-2.5 py-1 rotate-12 select-none pointer-events-none rounded bg-red-950/10">
          {classification}
        </div>

        {/* Header Cover */}
        <div className="text-center space-y-2 mt-2">
          <span className="text-slate-500 text-[10px] tracking-widest uppercase font-bold">
            MADHYA PRADESH POLICE
          </span>
          <h1 className="text-lg sm:text-xl font-bold text-white tracking-widest uppercase mt-2">
            {title}
          </h1>
          <p className="text-slate-400 text-[10px] tracking-widest uppercase">
            {subtitle}
          </p>
        </div>

        <div className={doubleBorder} />

        {/* Cover Meta Parameters */}
        <div 
          className="grid grid-cols-2 gap-y-3.5 gap-x-6 text-[10px] border-b border-slate-800/20 pb-5 mb-6"
          style={{ paddingLeft: "16px", paddingRight: "16px" }}
        >
          <div>
            <span className="text-slate-550 block uppercase text-[8px]">DOCUMENT DATE:</span>
            <span className="text-slate-200 font-bold font-mono">{date}</span>
          </div>
          <div>
            <span className="text-slate-550 block uppercase text-[8px]">CLASSIFICATION RANK:</span>
            <span className="text-red-400 font-bold uppercase">{classification}</span>
          </div>
          <div>
            <span className="text-slate-550 block uppercase text-[8px]">JURISDICTION SCOPE:</span>
            <span className="text-slate-200 font-bold uppercase">{meta.district}</span>
          </div>
          <div>
            <span className="text-slate-550 block uppercase text-[8px]">CRIME VECTOR HEAD:</span>
            <span className="text-slate-200 font-bold uppercase">{meta.category}</span>
          </div>
          <div>
            <span className="text-slate-550 block uppercase text-[8px]">ACTIVE OFFICER CONTEXT:</span>
            <span className="text-slate-200 font-bold uppercase">{meta.officer}</span>
          </div>
          <div>
            <span className="text-slate-550 block uppercase text-[8px]">TEMPORAL BOUNDS:</span>
            <span className="text-slate-200 font-bold uppercase font-mono">{meta.dateRange}</span>
          </div>
        </div>

        {/* 2. Executive Summary */}
        <div className="space-y-3" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
            I. EXECUTIVE SUMMARY
          </span>
          <p className="text-slate-300 font-sans leading-relaxed text-[11px]" style={{ paddingLeft: "8px" }}>
            {summary}
          </p>
        </div>

        <div className={doubleBorder} />

        {/* 3. KPI Highlights / Summary stats */}
        <div className="space-y-4" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
          <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
            II. KEY METRIC AGGREGATIONS
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-center bg-slate-950/40 border border-slate-800/30 p-4 rounded-xl">
            {kpis.map((kpi, idx) => (
              <div key={idx}>
                <span className="text-[8px] text-slate-500 block uppercase font-mono">{kpi.label}</span>
                <span className="text-sm font-bold text-white block mt-1 font-mono">{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Cyber Brief Specialized Sections */}
        {isCyberBrief && cyberBriefData && (
          <>
            <div className={doubleBorder} />

            {/* Evidentiary Integrity & Cryptographic Hashes (Sec 65B) */}
            <div className="space-y-3" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block">
                III. EVIDENTIARY CHAIN-OF-CUSTODY & CRYPTOGRAPHIC HASHES (SEC 65B ADMISSIBLE)
              </span>
              <div className="overflow-x-auto rounded-lg border border-slate-800/60 bg-slate-950/40">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase border-b border-slate-800/40">
                    <tr>
                      <th className="py-2 px-3">Evidence Artifact</th>
                      <th className="py-2 px-3">Type</th>
                      <th className="py-2 px-3">Records</th>
                      <th className="py-2 px-3">SHA-256 Cryptographic Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-300">
                    {cyberBriefData.evidentiarySummary.artifactsList.map((art, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-bold text-white">{art.fileName}</td>
                        <td className="py-2 px-3 text-slate-400">{art.sourceType}</td>
                        <td className="py-2 px-3 text-slate-400">{art.recordCount}</td>
                        <td className="py-2 px-3 text-emerald-400 text-[9px] font-mono">{art.sha256}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={doubleBorder} />

            {/* Chronological Fraud Timeline */}
            <div className="space-y-3" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">
                IV. CHRONOLOGICAL FRAUD ATTACK & MONEY SIPHONING TIMELINE
              </span>
              <div className="space-y-2">
                {cyberBriefData.timeline.map((item, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10.5px]">
                    <div className="flex items-start sm:items-center gap-2">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-[9.5px] bg-blue-500/10 text-blue-400 border border-blue-500/20 whitespace-nowrap">
                        {item.timeLabel}
                      </span>
                      <div>
                        <span className="font-bold text-white">{item.event}: </span>
                        <span className="text-slate-300">{item.description}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-slate-800 text-slate-300 self-start sm:self-auto">
                      {item.phase}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className={doubleBorder} />

            {/* Mule Account Cluster */}
            <div className="space-y-3" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
              <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">
                V. IDENTIFIED MULE ACCOUNT CLUSTER & SEIZURE TARGETS
              </span>
              <div className="overflow-x-auto rounded-lg border border-slate-800/60 bg-slate-950/40">
                <table className="w-full text-left text-[10px] font-mono">
                  <thead className="bg-slate-900/60 text-slate-400 uppercase border-b border-slate-800/40">
                    <tr>
                      <th className="py-2 px-3">Suspect / Beneficiary</th>
                      <th className="py-2 px-3">Mule Layer</th>
                      <th className="py-2 px-3">Bank & Account</th>
                      <th className="py-2 px-3">UPI VPA</th>
                      <th className="py-2 px-3">Inflow (INR)</th>
                      <th className="py-2 px-3">Action Directive</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/40 text-slate-300">
                    {cyberBriefData.suspectMules.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="py-2 px-3 font-bold text-white">{m.name}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-bold ${
                            m.layer.includes("Layer-1") ? "bg-amber-500/10 text-amber-300" : "bg-orange-500/10 text-orange-300"
                          }`}>
                            {m.layer}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-slate-300">{m.bank} ({m.account})</td>
                        <td className="py-2 px-3 text-blue-300 font-bold">{m.vpa}</td>
                        <td className="py-2 px-3 text-emerald-400 font-bold">₹{m.inflowINR.toLocaleString("en-IN")}</td>
                        <td className="py-2 px-3 text-red-300 text-[9px]">{m.action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={doubleBorder} />

            {/* Actionable Police Directives (Sec 91 CrPC) */}
            <div className="space-y-3" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block">
                VI. STATUTORY SEIZURE MANDATES FOR POLICE FIELD UNITS (SEC 91 & 102 CRPC)
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {cyberBriefData.seizureDirectives.map((sd, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-950/40 border border-slate-850 space-y-1 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white uppercase">{sd.targetType}</span>
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-red-500/10 text-red-400 border border-red-500/20">
                        {sd.priority}
                      </span>
                    </div>
                    <p className="text-[8.5px] font-mono text-slate-500">Authority: {sd.statutoryProvision}</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-300 text-[9.5px]">
                      {sd.instructions.map((ins, i) => (
                        <li key={i}>{ins}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Generic findings if not cyber brief */}
        {!isCyberBrief && (
          <>
            <div className={doubleBorder} />
            <div className="space-y-3" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                III. INVESTIGATIVE FINDINGS
              </span>
              <div className="space-y-3" style={{ paddingLeft: "16px" }}>
                {findings.map((finding, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-[11px] leading-relaxed text-slate-300">
                    <span className="text-blue-500 font-bold font-mono">{idx + 1}.</span>
                    <span className="font-sans">{finding}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={doubleBorder} />

            <div className="space-y-3" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                IV. STRATEGIC RECOMMENDATIONS
              </span>
              <div className="space-y-3" style={{ paddingLeft: "16px" }}>
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-[11px] leading-relaxed text-slate-350">
                    <span className="text-red-500 font-bold font-mono">●</span>
                    <span className="font-sans">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <div className={doubleBorder} />

        {/* 6. Filtered Database Records Table */}
        {reportData.recordsTable && reportData.recordsTable.length > 0 && (
          <div className="space-y-4" style={{ paddingLeft: "16px", paddingRight: "16px" }}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest block">
                V. AUDITED FIR INCIDENT REGISTERS ({reportData.recordsTable.length} FILTERED ROWS)
              </span>
              <span className="text-[9px] font-space text-slate-500 uppercase">
                Showing all matching output
              </span>
            </div>

            <div className="overflow-x-auto rounded-lg border border-slate-800/40 bg-slate-950/40">
              <table className="w-full text-left text-[10px] font-space">
                <thead className="bg-slate-900/60 text-slate-400 uppercase border-b border-slate-800/40">
                  <tr>
                    <th className="py-3 px-4">Crime No / Date</th>
                    <th className="py-3 px-4">Jurisdiction (District / PS)</th>
                    <th className="py-3 px-4">Category & Section</th>
                    <th className="py-3 px-4">Allotted Officer</th>
                    <th className="py-3 px-4">Status & Severity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850/40 text-slate-300">
                  {reportData.recordsTable.map((r) => (
                    <tr key={r.id || r.crimeNo} className="hover:bg-slate-900/50">
                      <td className="py-3 px-4 font-bold text-blue-400 font-mono">
                        {r.crimeNo}
                        <span className="block text-[9px] font-normal text-slate-500 font-mono mt-0.5">{r.regDate}</span>
                      </td>
                      <td className="py-3 px-4">
                        {r.unit}
                        <span className="block text-[9px] text-slate-500">{r.district}</span>
                      </td>
                      <td className="py-3 px-4">
                        {r.crimeHead}
                        <span className="block text-[9px] text-slate-500 font-mono mt-0.5">{r.actSections}</span>
                      </td>
                      <td className="py-3 px-4">
                        {r.allottedOfficerName}
                        <span className="block text-[9px] text-slate-500">{r.allottedOfficerRank}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          r.status === "Case Closed / Completed" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {r.status}
                        </span>
                        <span className="block text-[9px] font-bold text-slate-400 mt-0.5">{r.severity}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="border-t border-dashed border-slate-800/40 my-8" />

        {/* Signatures */}
        <div 
          className="flex justify-between items-end pt-2 text-[8px] text-slate-550 font-space"
          style={{ paddingLeft: "16px", paddingRight: "16px" }}
        >
          <div>
            <span>SYSTEM ENCRYPTED: SHA256_SEC65B_POLICE_LOG</span>
            <span className="block mt-0.5 font-mono">KSP CYBER COMMAND DATASTORE HANDSHAKE COMPLETED</span>
          </div>
          <div className="text-right uppercase border-t border-slate-800 pt-1.5 w-44">
            <span>{isCyberBrief ? (cyberBriefData?.officer?.name || "INVESTIGATING OFFICER") : "COMMAND OFFICER"}</span>
          </div>
        </div>

      </div>

      {/* 2. Actions Strip */}
      <div 
        className="bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl flex flex-wrap gap-3.5 justify-center items-center w-full"
        style={{ padding: "18px 24px" }}
      >
        <button
          onClick={() => onExport("PDF")}
          className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-md transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer active:scale-95"
          style={{ paddingLeft: "24px", paddingRight: "24px", paddingTop: "12px", paddingBottom: "12px" }}
        >
          <FaFilePdf className="text-sm" />
          <span>PRINT / SAVE AS PDF</span>
        </button>

        {isCyberBrief && cyberBriefData && (
          <>
            <button
              onClick={handleExportJSON}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-md transition-all shadow-lg hover:shadow-blue-600/30 cursor-pointer active:scale-95"
              style={{ paddingLeft: "24px", paddingRight: "24px", paddingTop: "12px", paddingBottom: "12px" }}
            >
              <FaFileCode className="text-sm" />
              <span>EXPORT DOCKET JSON</span>
            </button>

            <button
              onClick={handleCopyBankNotice}
              className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-mono font-bold text-xs rounded-md transition-all shadow-md cursor-pointer active:scale-95"
              style={{ paddingLeft: "24px", paddingRight: "24px", paddingTop: "12px", paddingBottom: "12px" }}
            >
              {copiedNotice ? <FaCheck className="text-emerald-400" /> : <FaCopy />}
              <span>{copiedNotice ? "NOTICE COPIED!" : "COPY SEC 91 BANK NOTICE"}</span>
            </button>
          </>
        )}

        {reportData.recordsTable && reportData.recordsTable.length > 0 && (
          <button
            onClick={() => onExport("EXCEL")}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-md transition-all shadow-lg hover:shadow-emerald-600/30 cursor-pointer active:scale-95"
            style={{ paddingLeft: "24px", paddingRight: "24px", paddingTop: "12px", paddingBottom: "12px" }}
          >
            <FaFileExcel className="text-sm" />
            <span>EXPORT EXCEL (CSV)</span>
          </button>
        )}
      </div>

    </div>
  );
};

export default ReportPreview;
