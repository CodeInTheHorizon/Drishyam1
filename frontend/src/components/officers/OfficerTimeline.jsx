import React from "react";
import { FaCheckCircle, FaHourglassHalf, FaCalendarDay } from "react-icons/fa";

const OfficerTimeline = ({ timeline }) => {
  if (!timeline) return null;

  // Render relative time helper
  const getRelativeDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;
    const diffMs = Date.now() - date.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return dateStr;
  };

  return (
    <div 
      className="rounded-sm border border-slate-700/60 shadow-xl bg-slate-900/85 backdrop-blur-md flex flex-col h-[460px]"
      style={{ padding: "22px 24px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-3.5 mb-4 flex-shrink-0">
        <div className="flex items-center gap-2.5 pl-1">
          <FaCalendarDay className="text-blue-400 text-xs" />
          <h2 className="text-xs font-bold text-white uppercase tracking-[0.14em] font-mono">
            Latest Investigation Activity
          </h2>
        </div>
        <span className="rounded-sm bg-slate-950 border border-slate-700/60 px-2.5 py-0.5 font-mono text-[9px] text-slate-400 uppercase tracking-wider">
          Logs: CaseMaster
        </span>
      </div>

      {/* Timeline track list */}
      <div className="flex-grow overflow-y-auto pr-1 scrollbar-thin">
        <div className="relative border-l border-slate-700/60 pl-6 ml-3 space-y-6 py-1">
          
          {timeline.map((step, index) => {
            const isCompleted = step.status === "completed";
            
            return (
              <div key={index} className="relative group">
                
                {/* Timeline node dot indicator */}
                <span className="absolute -left-[30.5px] top-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-slate-950 border border-slate-600 z-10">
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    isCompleted ? "bg-emerald-400 shadow-sm shadow-emerald-400/50" : "bg-amber-400 animate-pulse"
                  }`} />
                </span>

                {/* Content block: spacing, typography, subtle separator line */}
                <div className="flex flex-col gap-1.5 text-xs font-mono leading-normal pb-4 border-b border-slate-700/30 pl-1">
                  
                  {/* Title & relative date */}
                  <div className="flex justify-between items-center gap-2">
                    <span className={`font-bold uppercase tracking-wider text-xs ${
                      isCompleted ? "text-white" : "text-amber-400 animate-pulse"
                    }`}>
                      {step.stage}
                    </span>
                    <span className="text-slate-400 text-[9px]">{getRelativeDate(step.date)}</span>
                  </div>

                  {/* Officer action details */}
                  <p className="text-slate-300 font-sans leading-relaxed text-xs mt-0.5">
                    {step.desc}
                  </p>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[8.5px] text-slate-400 uppercase tracking-widest">Status:</span>
                    <span className={`text-[8.5px] uppercase tracking-wider font-bold ${
                      isCompleted ? "text-emerald-400" : "text-amber-400"
                    }`}>
                      {isCompleted ? "Completed Action" : "In Progress"}
                    </span>
                  </div>

                </div>
              </div>
            );
          })}

        </div>
      </div>

    </div>
  );
};

export default OfficerTimeline;
