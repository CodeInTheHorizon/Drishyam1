import React, { useState } from "react";
import { 
  RiTimeLine, 
  RiFireLine, 
  RiInformationLine,
  RiFileList3Line,
  RiMapPinLine,
  RiShieldLine
} from "react-icons/ri";

export default function DiurnalHeatMatrix({
  matrixData,
  selectedCell,
  onSelectCell
}) {
  const [hoveredCell, setHoveredCell] = useState(null);
  const { grid, maxCellCount, totalIncidents, topPeaks } = matrixData;

  const days = [
    { key: 0, name: "Mon", full: "Monday" },
    { key: 1, name: "Tue", full: "Tuesday" },
    { key: 2, name: "Wed", full: "Wednesday" },
    { key: 3, name: "Thu", full: "Thursday" },
    { key: 4, name: "Fri", full: "Friday" },
    { key: 5, name: "Sat", full: "Saturday" },
    { key: 6, name: "Sun", full: "Sunday" }
  ];

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const getCellColor = (count, intensity) => {
    if (count === 0) return "bg-slate-950/70 border-slate-800 text-slate-600 hover:border-slate-500";
    if (intensity < 0.25) return "bg-emerald-950/90 border-emerald-500/80 text-emerald-300 hover:border-emerald-300 font-bold shadow-[0_0_8px_rgba(16,185,129,0.25)]";
    if (intensity < 0.55) return "bg-cyan-900/90 border-cyan-400 text-cyan-200 hover:border-cyan-200 font-bold shadow-[0_0_10px_rgba(6,182,212,0.35)]";
    if (intensity < 0.8) return "bg-amber-600/90 border-amber-300 text-amber-950 hover:border-amber-100 font-extrabold shadow-[0_0_14px_rgba(245,158,11,0.5)]";
    return "bg-rose-600 border-rose-300 text-white font-extrabold hover:bg-rose-500 shadow-[0_0_16px_rgba(244,63,94,0.7)]";
  };

  const activeCell = selectedCell || hoveredCell;

  return (
    <div 
      className="bg-slate-900/85 border border-slate-700/60 rounded-md backdrop-blur-md shadow-xl space-y-5"
      style={{ padding: "22px 24px" }}
    >
      {/* Top Bar with Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/50 pb-3.5">
        <div>
          <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>24-Hour × 7-Day Diurnal Crime Matrix</span>
          </h2>
          <span className="text-[11px] font-mono text-slate-300 mt-0.5 block">
            {totalIncidents} Live Incident Points Mapped
          </span>
        </div>

        {/* Heat Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300 bg-slate-950/90 px-3.5 py-1.5 rounded-sm border border-slate-700/80">
          <span className="text-slate-400 text-[10px] font-semibold">Intensity:</span>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-slate-950 border border-slate-800" />
            <span className="text-[10px] text-slate-400">0</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-950 border border-emerald-500" />
            <span className="text-[10px] text-emerald-300 font-bold">Low</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-cyan-900 border border-cyan-400" />
            <span className="text-[10px] text-cyan-300 font-bold">Med</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-amber-600 border border-amber-300" />
            <span className="text-[10px] text-amber-300 font-bold">High</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-rose-600 border border-rose-300" />
            <span className="text-[10px] text-rose-300 font-bold">Peak</span>
          </div>
        </div>
      </div>

      {/* 24x7 Heatmap Grid */}
      <div className="overflow-x-auto pb-1.5 px-1 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="min-w-[740px]">
          {/* Hour Numbers Header (00 to 23) */}
          <div className="grid grid-cols-[68px_repeat(24,1fr)] gap-2 mb-2 text-center font-mono text-[10px] text-slate-400">
            <div className="text-right pr-3 font-bold text-slate-400">Day / Hr</div>
            {hours.map((h) => (
              <div 
                key={h} 
                className={`py-1 rounded-sm font-semibold ${
                  (h >= 1 && h <= 4) ? "text-rose-300 bg-rose-950/30 border border-rose-800/40" : 
                  (h >= 11 && h <= 15) ? "text-amber-300 bg-amber-950/30 border border-amber-800/40" : 
                  "text-slate-300"
                }`}
              >
                {String(h).padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Day Rows */}
          {days.map((d) => (
            <div key={d.key} className="grid grid-cols-[68px_repeat(24,1fr)] gap-2 mb-2 items-center">
              {/* Day Label */}
              <div className="text-xs font-mono font-bold text-slate-200 pr-3 text-right">
                {d.name}
              </div>

              {/* 24 Hour Cells */}
              {hours.map((h) => {
                const cell = grid?.[d.key]?.[h] || { count: 0 };
                const intensity = maxCellCount > 0 ? cell.count / maxCellCount : 0;
                const isSelected = selectedCell?.dayIndex === d.key && selectedCell?.hour === h;

                return (
                  <button
                    key={h}
                    onClick={() => onSelectCell && onSelectCell(cell)}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                    className={`h-8.5 rounded-sm border transition-all flex items-center justify-center text-xs font-mono cursor-pointer relative ${
                      getCellColor(cell.count, intensity)
                    } ${isSelected ? "ring-2 ring-amber-400 scale-105 z-10 shadow-lg" : ""}`}
                    title={`${d.full} ${String(h).padStart(2, '0')}:00 • ${cell.count} FIRs`}
                  >
                    {cell.count > 0 ? (
                      <span className="text-[11px] font-bold">{cell.count}</span>
                    ) : (
                      <span className="text-[9px] opacity-20">·</span>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Hour Intelligence & Sample FIRs Panel */}
      <div 
        className="bg-slate-950/80 border border-slate-700/60 rounded-md space-y-3.5"
        style={{ padding: "18px 20px" }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-2.5">
          <div className="flex items-center gap-2">
            <RiFileList3Line className="text-amber-400 text-base" />
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {activeCell ? `${activeCell.dayName || activeCell.day} ${activeCell.timeLabel || ''} Incident Intelligence` : "Click any cell to inspect hourly FIRs"}
            </h4>
          </div>

          {activeCell && activeCell.count > 0 && (
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {activeCell.count} FIRs Logged
              </span>
              <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono font-bold bg-blue-500/15 text-blue-300 border border-blue-500/30">
                Shift: {activeCell.hour >= 22 || activeCell.hour < 6 ? "Night Watch 3" : activeCell.hour < 14 ? "Morning 1" : "Evening 2"}
              </span>
            </div>
          )}
        </div>

        {activeCell && activeCell.firs && activeCell.firs.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-48 overflow-y-auto pr-1">
            {activeCell.firs.slice(0, 6).map((fir, idx) => (
              <div 
                key={idx}
                className="bg-slate-900/90 rounded-sm border border-slate-700/60 hover:border-slate-600 transition-all text-xs space-y-1.5"
                style={{ padding: "14px 16px" }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-blue-400 font-bold">{fir.crimeNo || fir.CrimeNo}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-sm bg-slate-800 text-slate-300">
                    {fir.severity || "MEDIUM"}
                  </span>
                </div>
                <p className="text-slate-100 font-semibold truncate text-[11px]">
                  {fir.crimeHead}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span className="truncate">{fir.unit || "Police Station"}</span>
                  <span className="text-amber-300 font-medium shrink-0 ml-1">{fir.district}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic py-2 text-center font-sans">
            Click on any active hour cell on the 24×7 matrix to view all linked FIR records, police units, and offence descriptions.
          </p>
        )}
      </div>
    </div>
  );
}
