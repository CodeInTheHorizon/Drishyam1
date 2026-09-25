import React from "react";
import {
  FaFolderOpen,
  FaSearch,
  FaCheckCircle,
  FaFileAlt,
  FaRegClock,
  FaUserShield,
  FaMapMarkerAlt,
  FaBuilding,
  FaCalendarAlt,
  FaGraduationCap,
  FaMedal,
  FaStar,
  FaChevronDown,
  FaCogs
} from "react-icons/fa";

const OfficerHeader = ({ profile, officerList = [], onOfficerChange, allowSelector = true }) => {
  if (!profile) return null;

  const kpis = profile.kpis || {
    totalCases: 0,
    activeCases: 0,
    closedCases: 0,
    chargesheetRate: 0,
    avgInvestigationTime: 0,
    detectionRate: 0
  };

  const empId = profile.empId || `EMP-${profile.badgeNumber ? profile.badgeNumber.replace(/\D/g, "") || "3047" : "3047"}`;
  const rating = profile.summary?.rating?.replace(" / 5.0", "/5") || "4.8/5";

  return (
    <div
      className="rounded-xl border border-slate-800 bg-[#0c1425]/90 backdrop-blur-md shadow-2xl font-sans flex flex-col justify-between h-full"
      style={{ padding: "26px 30px" }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-stretch h-full">

        {/* LEFT: Selected Officer Card (7 cols) - fully utilizes vertical & horizontal space */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-5 border-b lg:border-b-0 lg:border-r border-slate-800/80 pb-6 lg:pb-0 lg:pr-8">
          
          {/* Top: Dossier Header + Officer Profile */}
          <div>
            <div className="flex items-center justify-between px-2 pb-2 mb-3.5">
              <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.18em]">
                SELECTED OFFICER DOSSIER
              </h3>
              <span className="inline-flex items-center gap-1.5 text-emerald-400 text-[10px] font-mono font-bold tracking-wider">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                ACTIVE
              </span>
            </div>

            {/* Officer Photo & Name Header */}
            <div className="flex items-center gap-5 p-4 sm:p-5 pl-5 sm:pl-6 rounded-[3px] bg-slate-950/60 border border-slate-800/70 shadow-inner mx-1">
              <div className="h-16 w-16 rounded-[3px] overflow-hidden border border-slate-700 bg-slate-950 p-0.5 shadow-md flex-shrink-0 ml-0.5">
                <img
                  src={profile.avatar}
                  alt={profile.name}
                  className="h-full w-full object-cover rounded-[2px]"
                />
              </div>

              <div className="min-w-0 flex-1 pl-1">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight font-sans">
                    {profile.name}
                  </h3>
                </div>
                <div className="text-xs font-mono text-slate-400 mt-1.5 flex flex-wrap items-center gap-2.5">
                  <span className="text-blue-400 font-semibold">{profile.rank || "PSI"}</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-300 font-semibold">{empId}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Middle: 5x1 Metadata List evenly spaced across available height */}
          <div className="flex flex-col gap-3 text-xs text-slate-300 font-sans my-1 mx-1">
            <div className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:bg-slate-900/50 hover:border-slate-700/60 transition-all shadow-sm">
              <div className="h-7 w-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <FaMapMarkerAlt className="text-xs" />
              </div>
              <span className="font-medium text-slate-200">{profile.station || "South Zone"}</span>
            </div>

            <div className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:bg-slate-900/50 hover:border-slate-700/60 transition-all shadow-sm">
              <div className="h-7 w-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <FaBuilding className="text-xs" />
              </div>
              <span className="font-medium text-slate-200">{profile.unit || "Law & Order - Crime Against Women"}</span>
            </div>

            <div className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:bg-slate-900/50 hover:border-slate-700/60 transition-all shadow-sm">
              <div className="h-7 w-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <FaCalendarAlt className="text-xs" />
              </div>
              <span className="font-medium text-slate-200">{profile.yearsOfService || "12"} Years of Active Service</span>
            </div>

            <div className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl bg-slate-950/50 border border-slate-800/60 hover:bg-slate-900/50 hover:border-slate-700/60 transition-all shadow-sm">
              <div className="h-7 w-7 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
                <FaGraduationCap className="text-xs" />
              </div>
              <span className="font-medium text-slate-200">{profile.summary?.strongArea || "Trained in Cyber Crimes & Evidence Handling"}</span>
            </div>

            <div className="flex items-center gap-3.5 px-4.5 py-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-200 hover:bg-amber-500/15 transition-all shadow-sm">
              <div className="h-7 w-7 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
                <FaMedal className="text-xs" />
              </div>
              <span className="font-semibold text-amber-300">Awards: 2 Commendation Medals</span>
            </div>
          </div>

          {/* Bottom: Dynamic Dropdown: SELECT OFFICER */}
          <div className="pt-2 px-2">
            <label className="text-[9px] font-mono font-bold tracking-widest text-slate-400 uppercase block mb-1.5 pl-0.5">
              SWITCH SELECTED OFFICER
            </label>
            <div className="relative">
              <select
                value={profile.badgeNumber}
                onChange={(e) => onOfficerChange(e.target.value)}
                className="w-full bg-[#080d19] border border-slate-800 rounded-lg py-2.5 pl-3.5 pr-9 text-xs text-white focus:outline-none focus:border-blue-500 font-sans cursor-pointer appearance-none shadow-inner"
              >
                {officerList.map((off) => (
                  <option key={off.badgeNumber} value={off.badgeNumber}>
                    {off.name} (EMP-{off.badgeNumber.replace(/\D/g, "") || "3047"})
                  </option>
                ))}
              </select>
              <FaChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-[10px] pointer-events-none" />
            </div>
          </div>

        </div>

        {/* RIGHT: 3x2 KPI GRID (5 cols) - styled like executive dashboard KPI cards */}
        <div className="lg:col-span-5 grid grid-cols-2 gap-3.5 self-center w-full lg:pl-8">
          
          {/* Card 1: TOTAL ASSIGNED */}
          <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-3.5">
            <div className="flex items-center justify-between gap-1.5 w-full">
              <span className="text-[11px] font-semibold text-slate-300 font-sans truncate">Total Cases</span>
              <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-purple-400 shadow-inner">
                <FaCogs className="text-xs" />
              </div>
            </div>
            <div className="my-1 text-center w-full">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                {kpis.totalCases || 12}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-full text-center">
              <span className="text-[10px] font-semibold text-slate-400 font-sans truncate">All Time History</span>
            </div>
          </div>

          {/* Card 2: ACTIVE WORKLOAD */}
          <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-3.5">
            <div className="flex items-center justify-between gap-1.5 w-full">
              <span className="text-[11px] font-semibold text-slate-300 font-sans truncate">Active Cases</span>
              <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-blue-400 shadow-inner">
                <FaFolderOpen className="text-xs" />
              </div>
            </div>
            <div className="my-1 text-center w-full">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                {kpis.activeCases || 5}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-full text-center">
              <span className="text-[10px] font-semibold text-slate-400 font-sans truncate">Open Investigations</span>
            </div>
          </div>

          {/* Card 3: CASES CLOSED */}
          <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-3.5">
            <div className="flex items-center justify-between gap-1.5 w-full">
              <span className="text-[11px] font-semibold text-slate-300 font-sans truncate">Cases Solved</span>
              <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-emerald-400 shadow-inner">
                <FaCheckCircle className="text-xs" />
              </div>
            </div>
            <div className="my-1 text-center w-full">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                {kpis.closedCases || 8}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-full text-center">
              <span className="text-[10px] font-semibold text-emerald-400 font-sans truncate">Resolved This Year</span>
            </div>
          </div>

          {/* Card 4: FILING RATE */}
          <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-3.5">
            <div className="flex items-center justify-between gap-1.5 w-full">
              <span className="text-[11px] font-semibold text-slate-300 font-sans truncate">Charge-Sheet</span>
              <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-rose-400 shadow-inner">
                <FaFileAlt className="text-xs" />
              </div>
            </div>
            <div className="my-1 text-center w-full">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                {kpis.chargesheetRate || 82}%
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-full text-center">
              <span className="text-[10px] font-semibold text-emerald-400 font-sans truncate">↑ 5% vs target</span>
            </div>
          </div>

          {/* Card 5: AVG RESOLUTION */}
          <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-3.5">
            <div className="flex items-center justify-between gap-1.5 w-full">
              <span className="text-[11px] font-semibold text-slate-300 font-sans truncate">Avg Duration</span>
              <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-emerald-400 shadow-inner">
                <FaRegClock className="text-xs" />
              </div>
            </div>
            <div className="my-1 text-center w-full">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                {kpis.avgInvestigationTime || 38}d
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-full text-center">
              <span className="text-[10px] font-semibold text-emerald-400 font-sans truncate">↑ 12% faster</span>
            </div>
          </div>

          {/* Card 6: DETECTION RATE */}
          <div className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col justify-between font-sans p-3.5">
            <div className="flex items-center justify-between gap-1.5 w-full">
              <span className="text-[11px] font-semibold text-slate-300 font-sans truncate">Detection Rate</span>
              <div className="flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-1.5 text-rose-400 shadow-inner">
                <FaUserShield className="text-xs" />
              </div>
            </div>
            <div className="my-1 text-center w-full">
              <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans">
                {kpis.detectionRate || 52}%
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 w-full text-center">
              <span className="text-[10px] font-semibold text-slate-400 font-sans truncate">Suspect Identification</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default OfficerHeader;
