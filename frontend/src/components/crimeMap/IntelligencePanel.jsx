import React from "react";
import { FaShieldAlt, FaInfoCircle, FaUsers, FaClipboardCheck, FaMapMarkerAlt, FaFileAlt } from "react-icons/fa";

// ── Shared card wrapper ──────────────────────────────────────────────────────
const IntelCard = ({ children, className = "" }) => (
  <div
    className={`bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-md shadow-lg relative overflow-hidden ${className}`}
    style={{ padding: "18px 20px" }}
  >
    {children}
  </div>
);

// ── Section header with left-accent bar ─────────────────────────────────────
const SectionHeader = ({ icon: Icon, label, iconColor = "text-blue-400", accentColor = "#3b82f6" }) => (
  <div style={{ borderBottom: "1px solid rgba(71,85,105,0.35)", marginBottom: 14, paddingBottom: 10 }}
    className="flex items-center gap-2.5">
    <span style={{ display: "inline-block", width: 2.5, height: 12, borderRadius: 2, background: accentColor, flexShrink: 0 }} />
    <Icon className={`${iconColor} text-xs flex-shrink-0`} />
    <h2 className="text-[10px] font-mono font-bold tracking-[0.14em] text-slate-200 uppercase">
      {label}
    </h2>
  </div>
);

const IntelligencePanel = ({ selectionName, metrics, selectedMarker, onDossierClose }) => {
  // If a marker is selected, render the incident dossier card first
  const renderDossier = () => {
    if (!selectedMarker) return null;

    const getSeverityStyle = (sev) => {
      switch (sev) {
        case "CRITICAL": return "text-red-300 bg-red-950/40 border-red-500/40";
        case "HIGH": return "text-amber-300 bg-amber-950/40 border-amber-500/40";
        case "MEDIUM": return "text-blue-300 bg-blue-950/40 border-blue-500/40";
        default: return "text-slate-300 bg-slate-800/40 border-slate-600/40";
      }
    };

    const getStatusStyle = (status) => {
      switch (status) {
        case "Charge-sheet Submitted": return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
        case "Suspect Apprehended": return "text-blue-300 border-blue-500/30 bg-blue-500/10";
        default: return "text-amber-300 border-amber-500/30 bg-amber-500/10";
      }
    };

    return (
      <IntelCard className="border-blue-500/40">
        <SectionHeader icon={FaFileAlt} label="Case Master Dossier" accentColor="#3b82f6" />

        <div className="space-y-3 font-mono text-xs">
          <div>
            <span className="text-[8.5px] text-slate-400 uppercase tracking-wider block mb-0.5">Case / Crime Number</span>
            <span className="text-white font-extrabold text-sm block leading-tight">{selectedMarker.caseNo}</span>
            <span className="text-slate-400 text-[9px] block mt-0.5">{selectedMarker.crimeNo}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <span className="text-[8.5px] text-slate-400 uppercase tracking-wider block mb-1">Severity</span>
              <span className={`inline-block text-[9px] font-bold px-2 py-1 rounded border uppercase ${getSeverityStyle(selectedMarker.severity)}`}>
                ● {selectedMarker.severity}
              </span>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-400 uppercase tracking-wider block mb-1">Status</span>
              <span className={`inline-block text-[8.5px] font-semibold px-2 py-1 rounded border uppercase ${getStatusStyle(selectedMarker.status)}`}>
                {selectedMarker.status}
              </span>
            </div>
          </div>

          <div>
            <span className="text-[8.5px] text-slate-400 uppercase tracking-wider block mb-1">Jurisdiction / Unit</span>
            <span className="text-slate-200 font-medium block text-[11px]">{selectedMarker.unit}</span>
            <span className="text-blue-400 block text-[9.5px] font-bold mt-0.5">{selectedMarker.district.toUpperCase()}</span>
          </div>

          <div>
            <span className="text-[8.5px] text-slate-400 uppercase tracking-wider block mb-1">Investigating Officer</span>
            <span className="text-white font-bold block text-[11px]">{selectedMarker.assignedOfficer.name}</span>
            <span className="text-slate-400 text-[8.5px] block mt-0.5">KGID: {selectedMarker.assignedOfficer.kgid}</span>
          </div>

          <div>
            <span className="text-[8.5px] text-slate-400 uppercase tracking-wider block mb-1.5">Brief Fact Record</span>
            <p className="text-[10px] leading-relaxed text-slate-300 bg-slate-950/70 p-2.5 rounded border border-slate-700/50 font-sans">
              {selectedMarker.briefFacts}
            </p>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-[8.5px] text-slate-400">
            <span>REGISTERED DATE</span>
            <span className="text-slate-200 font-bold">{selectedMarker.date}</span>
          </div>
        </div>

        <button
          onClick={onDossierClose}
          className="absolute top-3.5 right-4 text-[9px] font-mono font-bold text-slate-400 hover:text-white transition-colors uppercase cursor-pointer"
        >
          Clear ✕
        </button>
      </IntelCard>
    );
  };

  const chargeSheetRate = metrics.total > 0 ? Math.round((metrics.chargesheeted / metrics.total) * 100) : 0;

  const categoryColors = {
    "Property Offences": "#38bdf8",
    "Body Offences": "#f87171",
    "Cyber Crimes": "#c084fc",
    "Financial Fraud": "#fbbf24",
    "Narcotics": "#34d399",
    "Crimes Against Women": "#f472b6"
  };

  return (
    <div className="flex flex-col gap-4 pb-2">
      {/* Dossier Card */}
      {renderDossier()}

      {/* 1. Karnataka Overview / Spatial Summary */}
      <IntelCard>
        <SectionHeader icon={FaMapMarkerAlt} label={selectedMarker ? "Incident Context" : "Spatial Summary"} />
        <div className="space-y-3.5">
          <div>
            <span className="text-[8.5px] font-mono font-semibold tracking-wider text-slate-400 uppercase block mb-1">
              Selected Zone / District
            </span>
            <span className="text-base font-extrabold text-white uppercase tracking-wide font-sans block">
              {metrics.name}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-700/40 text-center font-mono">
            <div>
              <span className="text-[8.5px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Total</span>
              <span className="text-xl font-extrabold text-white block">{metrics.total}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Active</span>
              <span className="text-xl font-extrabold text-amber-300 block">{metrics.active}</span>
            </div>
            <div>
              <span className="text-[8.5px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">Charge Rate</span>
              <span className="text-xl font-extrabold text-emerald-300 block">{chargeSheetRate}%</span>
            </div>
          </div>
        </div>
      </IntelCard>

      {/* 2. Crime Category Breakdown */}
      <IntelCard>
        <SectionHeader icon={FaShieldAlt} label="Crime Head Distribution" accentColor="#6366f1" iconColor="text-indigo-400" />
        <div className="space-y-3 font-mono text-[10px]">
          {Object.entries(metrics.catDistribution).map(([cat, count]) => {
            const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
            const barColor = categoryColors[cat] || "#64748b";
            return (
              <div key={cat} className="space-y-1.5">
                <div className="flex justify-between items-center text-slate-200">
                  <span className="truncate max-w-[170px] font-medium" title={cat}>{cat}</span>
                  <span className="font-bold text-white ml-2 flex-shrink-0">{count} <span className="text-slate-400 font-normal">({pct}%)</span></span>
                </div>
                <div className="h-1.5 w-full bg-slate-800/90 border border-slate-700/40 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </IntelCard>

      {/* 3. Severity Breakdown */}
      <IntelCard>
        <SectionHeader icon={FaInfoCircle} label="Severity Breakdown" accentColor="#ef4444" iconColor="text-red-400" />
        <div className="flex flex-col gap-3 font-mono text-xs" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {[
            { label: "CRITICAL", count: metrics.sevBreakdown.CRITICAL || 0, color: "#f87171", bg: "rgba(239,68,68,0.14)", border: "rgba(239,68,68,0.35)" },
            { label: "HIGH",     count: metrics.sevBreakdown.HIGH || 0,     color: "#fbbf24", bg: "rgba(245,158,11,0.14)", border: "rgba(245,158,11,0.35)" },
            { label: "MEDIUM",   count: metrics.sevBreakdown.MEDIUM || 0,   color: "#60a5fa", bg: "rgba(59,130,246,0.14)", border: "rgba(59,130,246,0.35)" },
            { label: "LOW",      count: metrics.sevBreakdown.LOW || 0,      color: "#94a3b8", bg: "rgba(100,116,139,0.14)", border: "rgba(100,116,139,0.35)" },
          ].map(({ label, count, color, bg, border }) => {
            const pct = metrics.total > 0 ? Math.round((count / metrics.total) * 100) : 0;
            return (
              <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: 6, padding: "10px 14px" }}
                className="flex items-center justify-between transition-all duration-150">
                <div className="flex items-center gap-3">
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block", flexShrink: 0 }} />
                  <span style={{ color: color, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em" }}>{label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-base font-extrabold text-white">{count}</span>
                  <span className="text-slate-400 text-[10px] font-medium tracking-wide">{pct}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </IntelCard>

      {/* 4. Assigned Officers */}
      <IntelCard className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-md bg-blue-500/15 border border-blue-500/30 text-blue-400">
            <FaUsers className="text-sm" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold text-slate-200 font-mono uppercase tracking-wider">
              Officers Deployed
            </h3>
            <p className="text-[9px] text-slate-400 font-sans mt-0.5">
              Active in zone
            </p>
          </div>
        </div>
        <div className="text-2xl font-extrabold font-mono text-white">
          {metrics.officersCount}
        </div>
      </IntelCard>

      {/* 5. Recent Incidents */}
      <IntelCard>
        <SectionHeader icon={FaClipboardCheck} label="Recent Incidents" accentColor="#10b981" iconColor="text-emerald-400" />
        <div className="flex flex-col gap-2.5">
          {metrics.recentIncidents && metrics.recentIncidents.length > 0 ? (
            metrics.recentIncidents.map((inc) => (
              <div
                key={inc.id}
                style={{ padding: "10px 12px" }}
                className="border border-slate-700/50 hover:border-slate-600/70 rounded-md flex flex-col gap-1.5 transition-colors duration-150 text-[10px] font-mono bg-slate-900/60 hover:bg-slate-800/70"
              >
                <div className="flex justify-between items-center gap-2">
                  <span className="font-bold text-white text-[10.5px] truncate">{inc.caseNo}</span>
                  <span className="text-[8.5px] text-slate-400 font-medium flex-shrink-0">{inc.date}</span>
                </div>
                <div className="flex justify-between items-center text-[8.5px] pt-1.5 mt-0.5 border-t border-slate-800/60">
                  <span className="uppercase text-slate-300 font-medium truncate max-w-[140px]">{inc.category || "Incident"}</span>
                  <span className={`font-semibold px-1.5 py-0.5 rounded text-[8px] ${
                    inc.status === "Charge-sheet Submitted" ? "text-emerald-300 bg-emerald-950/40" :
                    inc.status === "Suspect Apprehended" ? "text-blue-300 bg-blue-950/40" :
                    "text-amber-300 bg-amber-950/40"
                  }`}>
                    {inc.status?.replace("Submitted", "").replace("Apprehended", "Held") || "Active"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-6 text-slate-400 font-mono text-xs">
              No matching records found.
            </div>
          )}
        </div>
      </IntelCard>
    </div>
  );
};

export default IntelligencePanel;
