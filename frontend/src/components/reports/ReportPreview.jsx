import React from "react";
import { FaFilePdf, FaFileExcel, FaShieldAlt } from "react-icons/fa";

const ReportPreview = ({ reportData, onExport, onShare, onSchedule }) => {
  if (!reportData) {
    return (
      <div className="bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl p-20 text-center flex flex-col items-center justify-center gap-3 text-slate-400 font-space text-xs">
        <FaShieldAlt className="text-3xl text-slate-600 animate-pulse" />
        <span>Awaiting parameter compilation. Click 'Preview Report' to generate.</span>
      </div>
    );
  }

  const { title, subtitle, classification, date, meta, summary, kpis, findings, recommendations } = reportData;

  const doubleBorder = "border-t border-slate-800/30 my-6";

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
            KARNATAKA STATE POLICE
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
          <div className="grid grid-cols-3 gap-4 text-center bg-slate-950/40 border border-slate-800/30 p-5 rounded-xl">
            {kpis.map((kpi, idx) => (
              <div key={idx}>
                <span className="text-[8px] text-slate-500 block uppercase">{kpi.label}</span>
                <span className="text-base font-bold text-white block mt-1 font-mono">{kpi.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className={doubleBorder} />

        {/* 4. Core Findings */}
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

        {/* 5. Command Recommendations */}
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
            <span>SYSTEM ENCRYPTED: MD5_AIP_LOG</span>
            <span className="block mt-0.5 font-mono">KSP DATASTORE HANDSHAKE COMPLETED</span>
          </div>
          <div className="text-right uppercase border-t border-slate-800 pt-1.5 w-36">
            <span>COMMAND OFFICER</span>
          </div>
        </div>

      </div>

      {/* 2. Actions Strip */}
      <div 
        className="bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl flex flex-wrap gap-4 justify-center items-center w-full"
        style={{ padding: "18px 24px" }}
      >
        <button
          onClick={() => onExport("PDF")}
          className="flex items-center justify-center gap-2.5 bg-red-600 hover:bg-red-500 text-white font-mono font-bold text-xs rounded-md transition-all shadow-lg hover:shadow-red-600/30 cursor-pointer active:scale-95"
          style={{ paddingLeft: "28px", paddingRight: "28px", paddingTop: "12px", paddingBottom: "12px" }}
        >
          <FaFilePdf className="text-sm" />
          <span>PRINT / SAVE AS PDF</span>
        </button>
        <button
          onClick={() => onExport("EXCEL")}
          className="flex items-center justify-center gap-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs rounded-md transition-all shadow-lg hover:shadow-emerald-600/30 cursor-pointer active:scale-95"
          style={{ paddingLeft: "28px", paddingRight: "28px", paddingTop: "12px", paddingBottom: "12px" }}
        >
          <FaFileExcel className="text-sm" />
          <span>EXPORT EXCEL (CSV)</span>
        </button>
      </div>

    </div>
  );
};

export default ReportPreview;
