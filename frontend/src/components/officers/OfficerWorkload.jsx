import React from "react";
import { FaFileAlt, FaArrowRight } from "react-icons/fa";

const DOCKET_DATA = [
  {
    docket: "Police remand: Accused in ATM fraud case",
    court: "District Sessions Court",
    dueDate: "28 May 2025",
    status: "HEARING SOON",
    priority: "High",
    priorityColor: "bg-red-500 text-red-400"
  },
  {
    docket: "Charge sheet filing: Cyber stalking case",
    court: "JMFC Court",
    dueDate: "30 May 2025",
    status: "HEARING SOON",
    priority: "High",
    priorityColor: "bg-red-500 text-red-400"
  },
  {
    docket: "Victim statement recording",
    court: "Women Safety Court",
    dueDate: "02 Jun 2025",
    status: "HEARING SOON",
    priority: "Medium",
    priorityColor: "bg-amber-500 text-amber-400"
  },
  {
    docket: "FIR pending: Theft case",
    court: "JMFC Court",
    dueDate: "05 Jun 2025",
    status: "HEARING SOON",
    priority: "Medium",
    priorityColor: "bg-amber-500 text-amber-400"
  },
  {
    docket: "Forensic report follow-up",
    court: "District Sessions Court",
    dueDate: "07 Jun 2025",
    status: "PENDING",
    priority: "Low",
    priorityColor: "bg-emerald-500 text-emerald-400"
  }
];

const OfficerWorkload = ({ workload }) => {
  const dockets = (workload?.dockets && workload.dockets.length > 0) ? workload.dockets : DOCKET_DATA;

  return (
    <div 
      className="rounded-xl border border-slate-800 bg-[#0c1425]/90 backdrop-blur-md shadow-2xl font-sans"
      style={{ padding: "26px 30px" }}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-4"
        style={{ padding: "4px 8px 14px 8px" }}
      >
        <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.18em]">
          ACTIVE WORKLOAD & COURT DOCKETS
        </h3>
        <button
          type="button"
          className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors"
        >
          <span>View All Dockets ({dockets.length})</span>
          <FaArrowRight className="text-[10px]" />
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto px-1">
        <table className="w-full text-left text-xs font-sans">
          <thead>
            <tr className="border-b border-slate-800/80 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              <th className="pb-3 pl-3 pr-4">DOCKET / CASE</th>
              <th className="pb-3 px-4">COURT / UNIT</th>
              <th className="pb-3 px-4">DUE DATE</th>
              <th className="pb-3 px-4">STATUS</th>
              <th className="pb-3 pl-4 pr-3">PRIORITY</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {dockets.map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                {/* Docket / Case with blue file icon */}
                <td className="py-3.5 pl-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                      <FaFileAlt className="text-xs" />
                    </div>
                    <span className="font-semibold text-slate-200">{row.docket}</span>
                  </div>
                </td>

                {/* Court / Unit */}
                <td className="py-3.5 px-4 text-slate-400">
                  {row.court}
                </td>

                {/* Due Date */}
                <td className="py-3.5 px-4 font-mono text-slate-300">
                  {row.dueDate}
                </td>

                {/* Status Badge */}
                <td className="py-3.5 px-4">
                  {row.status === "HEARING SOON" ? (
                    <span className="inline-block px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      HEARING SOON
                    </span>
                  ) : row.status === "COMPLETED" || row.status === "CLOSED" ? (
                    <span className="inline-block px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                      COMPLETED
                    </span>
                  ) : (
                    <span className="inline-block px-2.5 py-0.5 rounded text-[9.5px] font-mono font-bold uppercase tracking-wider bg-blue-500/15 text-blue-300 border border-blue-500/30">
                      PENDING
                    </span>
                  )}
                </td>

                {/* Priority with colored dot */}
                <td className="py-3.5 pl-4 pr-3">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${
                      row.priority === "High" ? "bg-red-400" :
                      row.priority === "Medium" ? "bg-amber-400" :
                      "bg-emerald-400"
                    }`} />
                    <span className="text-slate-300 text-xs">{row.priority}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OfficerWorkload;
