import React from "react";
import { FaAward, FaArrowRight, FaFileAlt, FaPercentage, FaHourglassHalf, FaClipboardList, FaMedal, FaStar } from "react-icons/fa";

const OfficerOfTheMonthCard = ({ officer, onSelectProfile }) => {
  if (!officer) return null;

  const empId = officer.empId || `EMP-${officer.badgeNumber ? officer.badgeNumber.replace(/\D/g, "") || "2568" : "2568"}`;

  return (
    <div 
      className="rounded-xl border border-slate-800/90 bg-[#0c1425]/90 backdrop-blur-md shadow-2xl font-sans relative overflow-hidden"
      style={{ padding: "26px 30px" }}
    >
      {/* Subtle Ambient Gold Glow Top Left */}
      <div className="absolute -top-16 -left-16 w-56 h-56 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch relative z-10">
        
        {/* LEFT COLUMN: Featured Officer Dossier (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5">
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
            
            {/* Officer Photo & Active Tag with Gold Accent Frame */}
            <div className="flex flex-col items-center gap-2 flex-shrink-0">
              <div className="h-28 w-28 rounded-xl overflow-hidden border-2 border-amber-500/40 bg-slate-950 p-0.5 shadow-[0_0_16px_rgba(245,158,11,0.18)]">
                <img
                  src={officer.avatar}
                  alt={officer.name}
                  className="h-full w-full object-cover rounded-lg"
                />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 tracking-wider uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE</span>
              </div>
            </div>

            {/* Officer Info Details */}
            <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
              
              {/* Prominent Officer of the Month Gold Banner */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[3px] bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/5 border border-amber-500/40 text-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.2)]">
                <FaMedal className="text-amber-400 text-xs flex-shrink-0" />
                <span className="font-mono text-xs font-black tracking-[0.22em] uppercase text-amber-200">
                  OFFICER OF THE MONTH
                </span>
              </div>

              {/* Name & Subtitle */}
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
                  {officer.name}
                </h2>
                <p className="text-xs text-slate-400 font-sans mt-1">
                  <span className="text-blue-400 font-bold font-mono">{officer.rank || "PSI"}</span> • <span className="text-slate-200 font-medium">{officer.unit || "Vehicle Section"}</span> • <span className="text-slate-400">{officer.station || "Karnataka Police HQ"}</span>
                </p>
              </div>

              {/* 4 Metadata Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 font-mono text-xs">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-[3px] p-2 shadow-inner">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Employee ID</span>
                  <span className="font-bold text-white text-xs">{empId}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-[3px] p-2 shadow-inner">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Badge No.</span>
                  <span className="font-bold text-white text-xs">{officer.badgeNumber}</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-[3px] p-2 shadow-inner">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Experience</span>
                  <span className="font-bold text-white text-xs">{officer.yearsOfService} Years</span>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-[3px] p-2 shadow-inner">
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Rank</span>
                  <span className="font-bold text-blue-400 text-xs">{officer.rank || "PSI"}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-0.5">
                <button
                  type="button"
                  onClick={() => onSelectProfile && onSelectProfile(officer.badgeNumber)}
                  className="inline-flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300 font-mono font-bold uppercase tracking-wider cursor-pointer transition-colors hover:translate-x-0.5 duration-200"
                >
                  <span>View Full Profile</span>
                  <FaArrowRight className="text-[10px]" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Special Citation Award Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/25 px-4.5 py-3 rounded-[3px] flex items-center gap-3.5 shadow-sm">
            <div className="h-8 w-8 rounded-[2px] bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-[0_0_10px_rgba(245,158,11,0.25)]">
              <FaAward className="text-sm" />
            </div>
            <div className="text-xs min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-bold text-amber-400 font-mono text-[10px] uppercase tracking-widest">
                  SPECIAL CITATION AWARD
                </span>
                <span className="text-amber-500/80 text-[10px]">★ ★ ★ ★ ★</span>
              </div>
              <p className="text-slate-300 text-xs italic font-sans mt-0.5 leading-snug">
                "{officer.commendation || "Awarded Director General's Honor Star for highest case resolution and investigation efficiency in previous month."}"
              </p>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Performance Highlights (5 cols, 2x2 grid) */}
        <div className="lg:col-span-5 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-800/80 pt-5 lg:pt-0 lg:pl-8">
          <div className="mb-5 px-1">
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.18em]">
              PERFORMANCE HIGHLIGHTS
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3.5 flex-1">
            
            {/* 1. Cases Solved */}
            <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-4">
              <div className="flex flex-col items-center justify-center gap-2 text-center w-full font-sans">
                <div className="flex items-center justify-center gap-2 w-full text-center">
                  <span className="text-xs font-semibold text-slate-300 leading-snug font-sans text-center">Cases Solved</span>
                  <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-emerald-400 shadow-inner">
                    <FaFileAlt className="text-xs" />
                  </div>
                </div>
                <div className="my-0.5 text-center w-full">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                    {officer.casesSolvedMonth || 12}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 w-full text-center">
                  <div className="flex items-center gap-1 text-[10.5px] font-semibold text-slate-400">
                    <span>All Time Total</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Clearance Rate */}
            <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-4">
              <div className="flex flex-col items-center justify-center gap-2 text-center w-full font-sans">
                <div className="flex items-center justify-center gap-2 w-full text-center">
                  <span className="text-xs font-semibold text-slate-300 leading-snug font-sans text-center">Clearance Rate</span>
                  <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-amber-400 shadow-inner">
                    <FaPercentage className="text-xs" />
                  </div>
                </div>
                <div className="my-0.5 text-center w-full">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                    {officer.clearanceRate || 85}%
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 w-full text-center">
                  <div className="flex items-center gap-1 text-[10.5px] font-semibold text-emerald-400">
                    <span>↑ 7% vs last month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Cases in Queue */}
            <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-4">
              <div className="flex flex-col items-center justify-center gap-2 text-center w-full font-sans">
                <div className="flex items-center justify-center gap-2 w-full text-center">
                  <span className="text-xs font-semibold text-slate-300 leading-snug font-sans text-center">Cases in Queue</span>
                  <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-blue-400 shadow-inner">
                    <FaHourglassHalf className="text-xs" />
                  </div>
                </div>
                <div className="my-0.5 text-center w-full">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                    6
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 w-full text-center">
                  <div className="flex items-center gap-1 text-[10.5px] font-semibold text-emerald-400">
                    <span>↓ 2 vs last month</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Pending Tasks */}
            <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-4">
              <div className="flex flex-col items-center justify-center gap-2 text-center w-full font-sans">
                <div className="flex items-center justify-center gap-2 w-full text-center">
                  <span className="text-xs font-semibold text-slate-300 leading-snug font-sans text-center">Pending Tasks</span>
                  <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-purple-400 shadow-inner">
                    <FaClipboardList className="text-xs" />
                  </div>
                </div>
                <div className="my-0.5 text-center w-full">
                  <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                    87 <span className="text-xs font-normal text-slate-400">/ 200</span>
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 w-full text-center">
                  <div className="flex items-center gap-1 text-[10.5px] font-semibold text-emerald-400">
                    <span>↓ 33 completed</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default OfficerOfTheMonthCard;
