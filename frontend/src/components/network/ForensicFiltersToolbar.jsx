import React from "react";
import { 
  RiSearchLine, 
  RiFilter3Line, 
  RiRefreshLine, 
  RiFocus2Line,
  RiPlayFill,
  RiPauseFill,
  RiAlertFill,
  RiShieldCheckLine,
  RiBankLine,
  RiNodeTree,
  RiCompass3Line,
  RiExchangeFundsLine
} from "react-icons/ri";
import { ARTIFACT_NODE_TYPES } from "../../services/forensicCorrelationService";

export default function ForensicFiltersToolbar({
  searchTerm,
  setSearchTerm,
  selectedScope,
  setSelectedScope,
  selectedRiskFilter,
  setSelectedRiskFilter,
  activeNodeTypes,
  toggleNodeType,
  isSimulationActive,
  setIsSimulationActive,
  onResetView,
  totalEntitiesCount = 0,
  bigDataMode = "SYNDICATE_HUBS",
  setBigDataMode,
  minVolume = 0,
  setMinVolume,
  isTrailIsolated = false,
  setIsTrailIsolated,
  selectedNodeId = null
}) {
  return (
    <div 
      className="bg-slate-900/90 border border-slate-700/70 rounded-xl backdrop-blur-md shadow-2xl flex flex-col gap-3 font-sans"
      style={{ padding: "18px 22px" }}
    >
      {/* 20L Big-Data Clutter Reduction Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
            <RiShieldCheckLine className="text-sm" />
            <span>20L Declutter Engine:</span>
          </span>

          {/* Mode Switcher Buttons */}
          <div className="flex items-center rounded-lg bg-slate-950/80 p-0.5 border border-slate-700/60 shadow-inner">
            <button
              onClick={() => setBigDataMode?.("SYNDICATE_HUBS")}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                bigDataMode === "SYNDICATE_HUBS"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Show high-impact criminal backbone: Top Victims, Primary Mules, and Terminal Cashouts"
            >
              <RiNodeTree className="text-sm" />
              <span>Syndicate Hubs (Nexus)</span>
            </button>

            <button
              onClick={() => setBigDataMode?.("BANK_CORRIDORS")}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                bigDataMode === "BANK_CORRIDORS"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Aggregate transfers by institutional banking corridors (SBI, HDFC, Axis, Crypto Sinks)"
            >
              <RiBankLine className="text-sm" />
              <span>Bank Corridors</span>
            </button>

            <button
              onClick={() => setBigDataMode?.("FULL_MESH")}
              className={`px-3 py-1 rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                bigDataMode === "FULL_MESH"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Display entire transaction network with volume thresholding"
            >
              <RiCompass3Line className="text-sm" />
              <span>Granular Mesh</span>
            </button>
          </div>
        </div>

        {/* Trail Isolation & Min Volume Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Min Volume Dropdown */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/60 rounded-lg px-2.5 py-1">
            <RiExchangeFundsLine className="text-amber-400 text-xs" />
            <span className="text-[10.5px] font-mono text-slate-400 font-medium">Min Vol:</span>
            <select
              value={minVolume}
              onChange={(e) => setMinVolume?.(Number(e.target.value))}
              className="bg-transparent text-xs text-amber-300 font-mono font-bold focus:outline-none cursor-pointer"
            >
              <option value="0" className="bg-slate-950 text-slate-300">All Amounts</option>
              <option value="25000" className="bg-slate-950 text-amber-300">≥ ₹25,000</option>
              <option value="50000" className="bg-slate-950 text-amber-300">≥ ₹50,000</option>
              <option value="100000" className="bg-slate-950 text-amber-300">≥ ₹1,00,000</option>
              <option value="250000" className="bg-slate-950 text-amber-300">≥ ₹2,50,000</option>
            </select>
          </div>

          {/* 1-Click Trail Isolation Toggle */}
          <button
            onClick={() => setIsTrailIsolated?.(!isTrailIsolated)}
            disabled={!selectedNodeId && !isTrailIsolated}
            className={`px-3 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all border ${
              isTrailIsolated
                ? "bg-red-600 text-white border-red-500 shadow-md shadow-red-600/30 cursor-pointer animate-pulse"
                : selectedNodeId
                ? "bg-slate-950/80 text-emerald-400 border-emerald-500/60 hover:bg-emerald-950/50 cursor-pointer"
                : "bg-slate-950/40 text-slate-600 border-slate-800 cursor-not-allowed"
            }`}
            title={selectedNodeId ? "Isolate 2-hop money trail around selected suspect" : "Select a node first to isolate its money trail"}
          >
            <span>🎯</span>
            <span>{isTrailIsolated ? "Isolate Trail: ON" : "Isolate Trail"}</span>
          </button>
        </div>
      </div>

      {/* Top Row: Search & Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 text-xs font-mono">
        {/* Search Box (4 cols) */}
        <div className="relative sm:col-span-2 lg:col-span-4 flex items-center">
          <RiSearchLine className="absolute left-4 text-slate-400 text-xs pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search account, IFSC, VPA, phone, IMEI, or IP..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-10 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-all shadow-inner"
            style={{ paddingLeft: "42px", paddingRight: "30px" }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>

        {/* Forensic Scope Filter (3 cols) */}
        <div className="lg:col-span-3">
          <select
            value={selectedScope}
            onChange={(e) => setSelectedScope(e.target.value)}
            className="w-full h-10 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-500 font-mono transition-all cursor-pointer shadow-inner"
            style={{ paddingLeft: "12px", paddingRight: "12px" }}
          >
            <option value="ALL" className="bg-slate-950 text-slate-300">-- ALL ARTIFACT LAYERS --</option>
            <option value="FINANCIAL" className="bg-slate-950 text-emerald-300">💰 Financial Mule Trail (Victims & Mules)</option>
            <option value="TELECOM" className="bg-slate-950 text-blue-300">📱 Telecom & Hardware (Phones, IMEIs)</option>
            <option value="CYBER" className="bg-slate-950 text-fuchsia-300">🛡️ Cyber & C2 (Trojans, Drop IPs)</option>
          </select>
        </div>

        {/* Anomaly & Risk Severity Filter (3 cols) */}
        <div className="lg:col-span-3">
          <select
            value={selectedRiskFilter}
            onChange={(e) => setSelectedRiskFilter(e.target.value)}
            className="w-full h-10 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-red-400 font-bold focus:outline-none focus:border-red-500 font-mono transition-all cursor-pointer shadow-inner"
            style={{ paddingLeft: "12px", paddingRight: "12px" }}
          >
            <option value="ALL" className="bg-slate-950 text-slate-300">-- ALL RISK LEVELS --</option>
            <option value="CRITICAL" className="bg-slate-950 text-red-400">🚨 Critical Risk Only (≥ 80%)</option>
            <option value="HIGH" className="bg-slate-950 text-amber-400">⚠️ High Risk & Above (≥ 65%)</option>
            <option value="LOW" className="bg-slate-950 text-emerald-400">🟢 Low Risk / Victims (≤ 40%)</option>
          </select>
        </div>

        {/* Graph Physics & View Center Controls (2 cols) */}
        <div className="lg:col-span-2 flex items-center gap-2">
          {/* Physics Pause / Play */}
          <button
            onClick={() => setIsSimulationActive(!isSimulationActive)}
            className={`flex-1 h-10 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-inner ${
              isSimulationActive
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/50 hover:bg-blue-600/30"
                : "bg-amber-600/20 text-amber-300 border border-amber-500/50 hover:bg-amber-600/30"
            }`}
            title={isSimulationActive ? "Pause Physics Simulation" : "Resume Physics Simulation"}
          >
            {isSimulationActive ? <RiPauseFill className="text-sm" /> : <RiPlayFill className="text-sm" />}
            <span className="text-[11px]">{isSimulationActive ? "Physics" : "Frozen"}</span>
          </button>

          {/* Center & Recenter View */}
          <button
            onClick={onResetView}
            className="h-10 px-3 bg-slate-950/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono font-bold shadow-inner"
            title="Recenter Canvas & Reset Zoom"
          >
            <RiFocus2Line className="text-sm text-blue-400" />
            <span className="hidden xl:inline text-[11px]">Center</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Entity Layer Toggles */}
      <div className="flex flex-wrap items-center gap-2 pt-2.5 px-1 border-t border-slate-800/80">
        <span className="text-[10px] font-mono text-slate-400 uppercase font-bold tracking-wider mr-1">
          Entity Layers:
        </span>

        {Object.entries(ARTIFACT_NODE_TYPES).map(([typeKey, config]) => {
          const isActive = activeNodeTypes[typeKey];
          return (
            <button
              key={typeKey}
              onClick={() => toggleNodeType(typeKey)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono font-medium flex items-center gap-1.5 border-0 transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-950/60 text-slate-100 hover:bg-slate-950/80 shadow-sm"
                  : "bg-transparent text-slate-500 hover:bg-slate-950/30 line-through opacity-40"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: config.base,
                  boxShadow: isActive ? `0 0 6px ${config.base}` : "none"
                }}
              />
              <span className="tracking-wide">{config.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
