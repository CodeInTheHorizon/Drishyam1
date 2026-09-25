import React from "react";
import {
  RiCarLine,
  RiCalendarScheduleLine
} from "react-icons/ri";

export default function PatrolDeploymentSchedule({ shifts }) {
  if (!shifts || shifts.length === 0) return null;

  return (
    <div 
      className="bg-slate-900/85 border border-slate-700/60 rounded-md backdrop-blur-md shadow-xl space-y-4"
      style={{ padding: "22px 24px" }}
    >
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
          <RiCalendarScheduleLine className="text-blue-400 text-sm" />
          <span>Recommended Shift Patrol Deployments</span>
        </h3>
        <span className="text-[10.5px] text-slate-400 font-mono">Based on diurnal risk peaks</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {shifts.map((shift, idx) => {
          const isCritical = shift.riskLevel.includes("CRITICAL");
          const isHigh = shift.riskLevel.includes("HIGH");

          return (
            <div
              key={idx}
              className={`rounded-md border flex flex-col justify-between ${isCritical
                  ? "bg-rose-950/30 border-rose-800/50"
                  : isHigh
                    ? "bg-amber-950/30 border-amber-800/50"
                    : "bg-slate-900/60 border-slate-700/60"
                }`}
              style={{ padding: "18px 20px" }}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-white font-mono">
                    {shift.shiftName.split(':')[0]}
                  </span>
                  <span className={`px-2 py-0.5 rounded-sm text-[9.5px] font-mono font-bold ${isCritical
                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                      : isHigh
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                    }`}>
                    {shift.timeRange} HRS
                  </span>
                </div>

                <p className="text-xs text-slate-200 font-medium mb-3 font-sans">
                  {shift.threatFocus}
                </p>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 pt-1">
                <RiCarLine className="text-xs" />
                <span>{shift.recommendedUnits}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
