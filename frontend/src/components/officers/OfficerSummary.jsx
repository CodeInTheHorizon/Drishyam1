import React from "react";
import { FaBrain, FaStar, FaRegCheckCircle, FaExclamationTriangle, FaChartLine, FaCheck } from "react-icons/fa";

const OfficerSummary = ({ summary }) => {
  if (!summary) return null;

  // Determine priority based on workload Status
  const priority = summary.workloadStatus === "Optimal" ? "MEDIUM" : "HIGH";

  // Calculate stars count out of 5 based on rating
  const ratingVal = parseFloat(summary.rating) || 5;
  const starsCount = Math.round(ratingVal);

  return (
    <div 
      className="rounded-sm border border-slate-700/60 shadow-xl bg-slate-900/85 backdrop-blur-md flex flex-col h-[460px]"
      style={{ padding: "22px 24px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-3.5 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5 pl-1">
          <FaBrain className="text-purple-400 text-xs animate-pulse" />
          <h2 className="text-xs font-bold text-white uppercase tracking-[0.14em] font-mono">
            AI Performance Recommendation
          </h2>
        </div>
        <span className="rounded-sm bg-slate-950 border border-slate-700/60 px-2.5 py-0.5 font-mono text-[9px] text-slate-400 uppercase tracking-wider">
          Audit Model v4.2
        </span>
      </div>

      {/* Vertical Hierarchy Content */}
      <div className="flex-grow flex flex-col justify-between font-mono text-[10px] leading-normal space-y-3.5 overflow-y-auto pr-1 scrollbar-thin">
        
        {/* 1. Highlighted AI Performance Rating (Stars & Numeric) */}
        <div className="flex items-center justify-between bg-slate-950/80 border border-slate-700/60 p-3.5 rounded-sm flex-shrink-0 shadow-sm">
          <div className="pl-1">
            <span className="text-slate-400 text-[8.5px] uppercase tracking-wider block font-mono">Performance Rating</span>
            <span className="text-xl font-extrabold text-white font-mono mt-1 block leading-none">{summary.rating}</span>
          </div>
          <div className="flex flex-col items-end gap-1 pr-1">
            <div className="flex text-amber-400 text-[10px] gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <FaStar key={i} className={i < starsCount ? "text-amber-400" : "text-slate-700"} />
              ))}
            </div>
            <span className="text-[8px] text-slate-400 uppercase tracking-widest font-mono">Telemetry Rating</span>
          </div>
        </div>

        {/* 2. Executive Summary Details */}
        <div className="space-y-3.5 flex-grow pl-1">
          {/* Executive Summary */}
          <div>
            <span className="text-slate-400 text-[8.5px] uppercase tracking-wider block mb-1 font-mono">Executive Summary</span>
            <p className="text-slate-300 font-sans text-xs leading-relaxed">
              Officer shows consistent command of the docket workflow with high operational precision.
            </p>
          </div>

          {/* Strength */}
          <div className="flex items-start gap-2.5">
            <span className="text-emerald-400 mt-1 flex-shrink-0"><FaCheck className="text-xs" /></span>
            <div>
              <span className="text-slate-400 text-[8.5px] uppercase tracking-wider block font-mono">Strength</span>
              <span className="text-white font-semibold block font-sans text-xs mt-0.5">{summary.strongArea}</span>
            </div>
          </div>

          {/* Areas to Improve */}
          <div className="flex items-start gap-2.5">
            <span className="text-amber-400 mt-1 flex-shrink-0"><FaExclamationTriangle className="text-xs" /></span>
            <div>
              <span className="text-slate-400 text-[8.5px] uppercase tracking-wider block font-mono">Areas to Improve</span>
              <span className="text-slate-300 font-sans text-xs block mt-0.5">
                {summary.workloadStatus === "Optimal" ? "Reduce backlog files" : "Optimize case handover timelines"}
              </span>
            </div>
          </div>

          {/* AI Recommendation */}
          <div>
            <span className="text-slate-400 text-[8.5px] uppercase tracking-wider block mb-1 font-mono">AI Recommendation</span>
            <p className="text-purple-100 font-sans text-xs leading-relaxed bg-purple-950/20 border border-purple-500/30 p-3.5 rounded-sm">
              "{summary.aiRecommendation}"
            </p>
          </div>

          {/* Suggested Action */}
          <div>
            <span className="text-slate-400 text-[8.5px] uppercase tracking-wider block mb-0.5 font-mono">Suggested Action</span>
            <span className="text-slate-300 font-sans block text-xs">
              Deploy cyber-dossier automation to save approx 4 hours per filing cycle.
            </span>
          </div>

          {/* Projected Performance & Confidence Level */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-700/50">
            <div>
              <span className="text-slate-400 text-[8.5px] uppercase tracking-wider block font-mono">Projected Performance</span>
              <span className="text-emerald-400 font-bold block mt-1 text-xs uppercase tracking-wide flex items-center gap-1 font-mono">
                <FaChartLine /> -10% Cycle Time
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[8.5px] uppercase tracking-wider block font-mono">Confidence Level</span>
              <span className="text-blue-400 font-bold block mt-1 text-xs uppercase tracking-wide font-mono">
                94% Audit Match
              </span>
            </div>
          </div>
        </div>

        {/* Sync details */}
        <div className="border-t border-slate-700/50 pt-3 flex justify-between items-center text-[8.5px] text-slate-400 flex-shrink-0 pl-1">
          <div className="flex items-center gap-1.5">
            <FaRegCheckCircle className="text-emerald-400" />
            <span>Telemetry Audited &amp; Synchronized</span>
          </div>
          <span>Updated: {summary.lastUpdated}</span>
        </div>

      </div>
    </div>
  );
};

export default OfficerSummary;
