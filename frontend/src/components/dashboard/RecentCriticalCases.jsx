import React, { useState } from "react";
import { FaShieldAlt, FaCalendarAlt, FaUser, FaClipboardList, FaAngleDown, FaAngleUp } from "react-icons/fa";

const RecentCriticalCases = ({ cases }) => {
  const [expandedCaseId, setExpandedCaseId] = useState(null);

  const toggleExpand = (caseId) => {
    setExpandedCaseId(expandedCaseId === caseId ? null : caseId);
  };

  const getRiskBadge = (risk) => {
    switch (risk) {
      case "CRITICAL":
        return "bg-red-500/8 text-red-400 border border-red-500/15 font-black tracking-wide";
      case "HIGH":
        return "bg-amber-500/8 text-amber-400 border border-amber-500/15 font-bold tracking-wide";
      case "MEDIUM":
      default:
        return "bg-blue-500/8 text-blue-400 border border-blue-500/15 font-semibold";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Charge-sheet Submitted":
        return "text-emerald-400 bg-emerald-500/5 border border-emerald-500/12";
      case "Suspect Apprehended":
        return "text-blue-400 bg-blue-500/5 border border-blue-500/12";
      case "Under Investigation":
      default:
        return "text-slate-400 bg-slate-900/60 border border-slate-800/25";
    }
  };

  return (
    <div 
      className="rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl w-full"
      style={{ padding: "22px 24px" }}
    >
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-4 mb-5">
        <div className="flex items-center gap-2.5">
          <FaClipboardList className="text-blue-400 text-base" />
          <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
            Critical CCTNS Case Feed
          </h2>
        </div>
        <span className="rounded-sm bg-slate-950/80 border border-slate-700/70 px-2.5 py-1 text-[10px] text-slate-300 font-mono">
          Source: CaseMaster
        </span>
      </div>

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800/20 text-[9px] text-slate-500 uppercase tracking-[0.14em] font-space">
              <th className="py-4 px-6">Crime Number / CaseNo</th>
              <th className="py-4 px-6">Jurisdiction (Unit)</th>
              <th className="py-4 px-6">Sections & Acts</th>
              <th className="py-4 px-6">Status</th>
              <th className="py-4 px-6 text-right">Risk Index</th>
              <th className="py-4 px-6 text-center">Inspect</th>
            </tr>
          </thead>
          <tbody className="text-xs">
            {cases && cases.map((c) => {
              const isExpanded = expandedCaseId === c.CaseMasterID;

              return (
                <React.Fragment key={c.CaseMasterID}>
                  {/* Standard Row */}
                  <tr className="intel-row group hover:bg-slate-800/40 transition-colors duration-200 ease-in-out cursor-pointer">
                    <td className="py-5 px-6">
                      <div className="font-bold text-slate-300 group-hover:text-blue-400 transition-colors duration-150 font-mono text-[11px] tracking-tight">
                        {c.CaseNo}
                      </div>
                      <div className="text-[9px] text-slate-600 mt-1 select-all font-mono">
                        {c.CrimeNo}
                      </div>
                    </td>
                    <td className="py-5 px-6 text-slate-400">
                      <div>{c.UnitName.replace(" Police Station", " PS")}</div>
                      <div className="text-[9px] text-slate-600 mt-1">{c.DistrictName}</div>
                    </td>
                    <td className="py-5 px-6">
                      <div className="text-slate-400 max-w-[280px] truncate" title={c.act_sections}>
                        {c.act_sections}
                      </div>
                      <div className="text-[9px] text-slate-600 mt-1 flex items-center gap-1.5 font-mono">
                        <FaCalendarAlt className="text-[8px] text-slate-700" /> Filed: {c.CrimeRegisteredDate}
                      </div>
                    </td>
                    <td className="py-5 px-6">
                      <span className={`status-chip rounded-md px-2.5 py-1 text-[9px] tracking-wide font-bold ${getStatusColor(c.CaseStatusName)}`}>
                        {c.CaseStatusName}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-right">
                      <span className={`rounded-md px-2.5 py-1 text-[9px] tracking-wider ${getRiskBadge(c.risk_index)}`}>
                        {c.risk_index}
                      </span>
                    </td>
                    <td className="py-5 px-6 text-center">
                      <button
                        onClick={() => toggleExpand(c.CaseMasterID)}
                        className="p-1.5 rounded-[3px] bg-slate-800/30 hover:bg-slate-800/60 text-slate-500 hover:text-white transition-colors cursor-pointer"
                      >
                        {isExpanded ? <FaAngleUp className="text-[10px]" /> : <FaAngleDown className="text-[10px]" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expanded Inspector Drawer */}
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="bg-slate-950/70 px-8 py-6 border-l-2 border-l-blue-500/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[11px] leading-relaxed text-slate-300">
                          {/* Case Briefing */}
                          <div className="md:col-span-2 space-y-2.5">
                            <span className="text-[9px] font-bold text-blue-400/80 uppercase tracking-widest block font-space">
                              Case Briefing (BriefFacts)
                            </span>
                            <p className="text-slate-400 bg-slate-900/40 p-3.5 rounded-[3px] border border-slate-800/20 leading-relaxed">
                              {c.BriefFacts}
                            </p>
                          </div>

                          {/* Operational Assignments */}
                          <div className="space-y-3.5 bg-slate-900/20 p-4 rounded-[3px] border border-slate-800/15">
                            <div>
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">
                                Investigating Officer (IO)
                              </span>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <FaUser className="text-[9px] text-slate-500" />
                                <span className="text-slate-300 font-bold">{c.investigating_officer.RankName} {c.investigating_officer.FirstName}</span>
                              </div>
                              <span className="text-[9px] text-slate-600 block pl-4 mt-0.5">KGID: {c.investigating_officer.KGID}</span>
                            </div>

                            <div className="border-t border-slate-800/20 pt-3">
                              <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block">
                                Suspects / Accused
                              </span>
                              <div className="mt-1.5 space-y-1.5">
                                {c.suspects.map((s) => (
                                  <div key={s.AccusedMasterID} className="flex items-center justify-between">
                                    <span className="text-slate-400 font-semibold">{s.PersonID}: {s.AccusedName}</span>
                                    <span className={`text-[9px] px-1.5 py-0.5 rounded-[2px] ${s.ApprehensionStatus === "Detained" || s.ApprehensionStatus === "Judicial Custody"
                                        ? "text-emerald-400 bg-emerald-500/5"
                                        : "text-rose-400 bg-rose-500/5"
                                      }`}>
                                      {s.ApprehensionStatus}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RecentCriticalCases;
