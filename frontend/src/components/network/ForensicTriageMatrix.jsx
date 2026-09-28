import React, { useState, useMemo } from "react";
import {
  RiAlertFill,
  RiShieldFlashLine,
  RiFlashlightFill,
  RiSmartphoneLine,
  RiMailLine,
  RiAndroidLine,
  RiMoneyDollarCircleLine,
  RiBankCardLine,
  RiExchangeDollarLine,
  RiSearchLine,
  RiFocus3Line,
  RiFileTextLine,
  RiFileCopyLine,
  RiCheckDoubleLine,
  RiFilter3Line,
  RiArrowRightUpLine,
  RiArrowRightLine,
  RiServerLine,
  RiShieldCheckLine,
  RiSparklingFill
} from "react-icons/ri";
import { getTriageRiskMatrix } from "../../services/forensicCorrelationService";

export default function ForensicTriageMatrix({
  nodes = [],
  edges = [],
  selectedNodeId,
  onSelectNode,
  onFocusNodeInGraph,
  onOpenDossier
}) {
  const [selectedTier, setSelectedTier] = useState("ALL"); // "ALL", "CRITICAL", "HIGH", "MEDIUM", "LOW"
  const [selectedAnomaly, setSelectedAnomaly] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  // Compute triage matrix
  const { rankedEndpoints, tierCounts, anomalyCounts } = useMemo(() => {
    return getTriageRiskMatrix(nodes, edges);
  }, [nodes, edges]);

  // Filtering logic
  const filteredEndpoints = useMemo(() => {
    return rankedEndpoints.filter((node) => {
      // 1. Tier filter
      if (selectedTier === "CRITICAL" && node.triageTier !== "CRITICAL") return false;
      if (selectedTier === "HIGH" && node.triageTier !== "HIGH") return false;
      if (selectedTier === "MEDIUM" && node.triageTier !== "MEDIUM") return false;
      if (selectedTier === "LOW" && node.triageTier !== "LOW") return false;

      // 2. Anomaly filter
      if (selectedAnomaly !== "ALL") {
        if (selectedAnomaly === "VELOCITY" && (!node.turnaroundSeconds || node.turnaroundSeconds > 600)) return false;
        if (selectedAnomaly === "IMMEDIATE_VELOCITY" && (!node.turnaroundSeconds || node.turnaroundSeconds > 180)) return false;
        if (selectedAnomaly === "SIM_MULTIPLEXING" && node.type !== "IMEI" && !node.anomalyFlags?.some(f => f.includes("SIM"))) return false;
        if (selectedAnomaly === "EMAIL_SPOOF" && node.type !== "EMAIL_SPOOF") return false;
        if (selectedAnomaly === "MALWARE_C2" && node.type !== "MALWARE_APK" && node.type !== "C2_SERVER" && node.details?.role !== "Trojan SMS Forward Target") return false;
        if (selectedAnomaly === "CASHOUT" && node.type !== "CASHOUT") return false;
      }

      // 3. Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (node.name || "").toLowerCase().includes(q);
        const matchSub = (node.subtitle || "").toLowerCase().includes(q);
        const matchType = (node.type || "").toLowerCase().includes(q);
        const matchDetails = JSON.stringify(node.details || {}).toLowerCase().includes(q);
        const matchFlags = (node.anomalyFlags || []).some(f => f.toLowerCase().includes(q));
        return matchName || matchSub || matchType || matchDetails || matchFlags;
      }

      return true;
    });
  }, [rankedEndpoints, selectedTier, selectedAnomaly, searchQuery]);

  const copyDirective = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getNodeIcon = (type) => {
    switch (type) {
      case "VICTIM": return <RiShieldCheckLine className="text-emerald-400" />;
      case "L1_MULE": return <RiBankCardLine className="text-amber-400" />;
      case "L2_MULE": return <RiExchangeDollarLine className="text-orange-400" />;
      case "CASHOUT": return <RiMoneyDollarCircleLine className="text-red-400" />;
      case "PHONE": return <RiSmartphoneLine className="text-blue-400" />;
      case "IMEI": return <RiSmartphoneLine className="text-purple-400" />;
      case "C2_SERVER": return <RiServerLine className="text-rose-400" />;
      case "MALWARE_APK": return <RiAndroidLine className="text-fuchsia-400" />;
      case "EMAIL_SPOOF": return <RiMailLine className="text-yellow-400" />;
      default: return <RiFileTextLine className="text-slate-400" />;
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300 font-sans">
      {/* KPI Triage Metric Banners */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div 
          onClick={() => setSelectedTier("CRITICAL")}
          className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            selectedTier === "CRITICAL"
              ? "bg-red-950/60 border-red-500/80 shadow-lg shadow-red-900/30 ring-1 ring-red-500/50"
              : "bg-slate-900/85 border-slate-700/60 hover:border-red-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              Critical Priority
            </span>
            <RiAlertFill className="text-red-400 text-base" />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-red-400 font-mono">{tierCounts.CRITICAL}</p>
            <span className="text-[10px] text-slate-400 font-mono">Score ≥ 85%</span>
          </div>
          <span className="text-[10px] text-slate-300 font-sans mt-1">
            Immediate Lien & Freeze Required
          </span>
        </div>

        <div 
          onClick={() => setSelectedAnomaly("IMMEDIATE_VELOCITY")}
          className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            selectedAnomaly === "IMMEDIATE_VELOCITY"
              ? "bg-amber-950/60 border-amber-500/80 shadow-lg shadow-amber-900/30 ring-1 ring-amber-500/50"
              : "bg-slate-900/85 border-slate-700/60 hover:border-amber-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <RiFlashlightFill className="text-amber-400" />
              Rapid Velocity
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
              &lt; 3 MINS
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-amber-400 font-mono">{anomalyCounts.immediateVelocity}</p>
            <span className="text-[10px] text-slate-400 font-mono">Turnaround</span>
          </div>
          <span className="text-[10px] text-slate-300 font-sans mt-1">
            Multi-Hop Immediate Layering
          </span>
        </div>

        <div 
          onClick={() => setSelectedAnomaly("SIM_MULTIPLEXING")}
          className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            selectedAnomaly === "SIM_MULTIPLEXING"
              ? "bg-purple-950/60 border-purple-500/80 shadow-lg shadow-purple-900/30 ring-1 ring-purple-500/50"
              : "bg-slate-900/85 border-slate-700/60 hover:border-purple-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
              <RiSmartphoneLine className="text-purple-400" />
              IMEI Multiplexing
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono font-bold">
              SIM-SWAP
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-purple-300 font-mono">{anomalyCounts.simMultiplexing}</p>
            <span className="text-[10px] text-slate-400 font-mono">Multiplexed</span>
          </div>
          <span className="text-[10px] text-slate-300 font-sans mt-1">
            3+ SIMs on Single Handset
          </span>
        </div>

        <div 
          onClick={() => setSelectedAnomaly("MALWARE_C2")}
          className={`p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
            selectedAnomaly === "MALWARE_C2"
              ? "bg-fuchsia-950/60 border-fuchsia-500/80 shadow-lg shadow-fuchsia-900/30 ring-1 ring-fuchsia-500/50"
              : "bg-slate-900/85 border-slate-700/60 hover:border-fuchsia-500/40"
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-fuchsia-300 flex items-center gap-1.5">
              <RiAndroidLine className="text-fuchsia-400" />
              Trojan Exfiltration
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-fuchsia-500/20 text-fuchsia-300 font-mono font-bold">
              C2 / OTP
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-extrabold text-fuchsia-300 font-mono">{anomalyCounts.trojanMalware}</p>
            <span className="text-[10px] text-slate-400 font-mono">Conduits</span>
          </div>
          <span className="text-[10px] text-slate-300 font-sans mt-1">
            SMS Intercept & Dark C2 Nodes
          </span>
        </div>
      </div>

      {/* Triage Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-700/60 rounded-xl p-4 shadow-lg backdrop-blur-md flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Tier Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-semibold font-mono uppercase mr-1 flex items-center gap-1">
            <RiFilter3Line className="text-blue-400" /> Priority:
          </span>

          <button
            onClick={() => setSelectedTier("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              selectedTier === "ALL"
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/25"
                : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
            }`}
          >
            ALL ({rankedEndpoints.length})
          </button>

          <button
            onClick={() => setSelectedTier("CRITICAL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-1.5 transition-all cursor-pointer ${
              selectedTier === "CRITICAL"
                ? "bg-red-600 text-white shadow-md shadow-red-600/30"
                : "bg-slate-800 text-red-400 hover:bg-slate-750 border border-red-500/30"
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            CRITICAL ({tierCounts.CRITICAL})
          </button>

          <button
            onClick={() => setSelectedTier("HIGH")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              selectedTier === "HIGH"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "bg-slate-800 text-amber-400 hover:bg-slate-750 border border-amber-500/30"
            }`}
          >
            HIGH ({tierCounts.HIGH})
          </button>

          <button
            onClick={() => setSelectedTier("MEDIUM")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
              selectedTier === "MEDIUM"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "bg-slate-800 text-blue-400 hover:bg-slate-750 border border-blue-500/30"
            }`}
          >
            MEDIUM ({tierCounts.MEDIUM})
          </button>
        </div>

        {/* Anomaly Pattern Dropdown & Search Input */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-semibold font-mono uppercase">Anomaly:</span>
            <select
              value={selectedAnomaly}
              onChange={(e) => setSelectedAnomaly(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Anomaly Signatures</option>
              <option value="IMMEDIATE_VELOCITY">Immediate Fund Turnaround (&lt; 3 mins)</option>
              <option value="VELOCITY">Rapid Fund Layering (&lt; 10 mins)</option>
              <option value="SIM_MULTIPLEXING">High-Velocity SIM / IMEI Switching</option>
              <option value="EMAIL_SPOOF">Forged Email Headers (SPF Fail)</option>
              <option value="MALWARE_C2">Banking Trojan / C2 Drop</option>
              <option value="CASHOUT">Terminal ATM / Crypto Off-Ramp</option>
            </select>
          </div>

          <div className="relative min-w-[200px] flex-1 sm:flex-initial">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search endpoints, VPA, phone, IP..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Priority Queue Cards List */}
      <div className="space-y-3.5">
        {filteredEndpoints.length === 0 ? (
          <div className="p-12 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
            <RiShieldFlashLine className="mx-auto text-4xl text-slate-500" />
            <h4 className="text-white font-bold text-sm">No Endpoints Match Filter Criteria</h4>
            <p className="text-slate-400 text-xs">Try selecting ALL priority tiers or clearing your search filter.</p>
          </div>
        ) : (
          filteredEndpoints.map((node, index) => {
            const isCritical = node.triageTier === "CRITICAL" || (node.riskScore || 0) >= 85;
            const isHigh = node.triageTier === "HIGH" || ((node.riskScore || 0) >= 70 && (node.riskScore || 0) < 85);
            const isSelected = selectedNodeId === node.id;
            const breakdown = node.riskBreakdown || {};

            return (
              <div
                key={node.id}
                className={`p-4 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-slate-900/98 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/40"
                    : isCritical
                    ? "bg-slate-900/90 border-red-900/50 hover:border-red-500/60 shadow-md"
                    : "bg-slate-900/85 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left: Rank, Icon, Identity */}
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    {/* Rank Pill */}
                    <div className="flex flex-col items-center justify-center shrink-0">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        isCritical ? "bg-red-500/20 text-red-400 border border-red-500/40" : "bg-slate-800 text-slate-400"
                      }`}>
                        #{index + 1}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-slate-800/80 border border-slate-700 flex items-center justify-center mt-1.5 text-base">
                        {getNodeIcon(node.type)}
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Badge and Tier Pill */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {node.colorConfig?.label || node.type}
                        </span>

                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                          isCritical 
                            ? "bg-red-500/10 text-red-400 border-red-500/30" 
                            : isHigh 
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            : "bg-blue-500/10 text-blue-400 border-blue-500/30"
                        }`}>
                          {isCritical && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                          {node.triageTier || "PRIORITY"} ({node.riskScore || 0}%)
                        </span>

                        {node.velocityDisplay && (
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                            {node.velocityDisplay}
                          </span>
                        )}
                      </div>

                      {/* Endpoint Name & Subtitle */}
                      <h3 className="text-base font-bold text-white tracking-tight truncate">
                        {node.name}
                      </h3>
                      {node.subtitle && (
                        <p className="text-xs text-slate-400 font-mono truncate mt-0.5">
                          {node.subtitle}
                        </p>
                      )}

                      {/* Explainable Factor Breakdown Bar & Indicators */}
                      <div className="mt-3 bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 max-w-xl">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                          <span className="font-semibold uppercase flex items-center gap-1">
                            <RiSparklingFill className="text-amber-400" /> Explainable Risk Rubric
                          </span>
                          <span className="font-bold text-white">{node.riskScore || 0}/100</span>
                        </div>

                        {/* Progress bar */}
                        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isCritical ? "bg-red-500" : isHigh ? "bg-amber-500" : "bg-blue-500"
                            }`}
                            style={{ width: `${Math.max(8, node.riskScore || 0)}%` }}
                          />
                        </div>

                        {/* Factor Indicators */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9.5px] font-mono">
                          <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                            <span className="text-slate-400">⚡ Velocity:</span>
                            <span className={breakdown.velocityScore > 0 ? "text-amber-400 font-bold" : "text-slate-500"}>
                              {breakdown.velocityScore || 0}/35
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                            <span className="text-slate-400">📱 Hardware:</span>
                            <span className={breakdown.hardwareScore > 0 ? "text-purple-300 font-bold" : "text-slate-500"}>
                              {breakdown.hardwareScore || 0}/35
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                            <span className="text-slate-400">✉️ Header:</span>
                            <span className={breakdown.headerScore > 0 ? "text-yellow-400 font-bold" : "text-slate-500"}>
                              {breakdown.headerScore || 0}/35
                            </span>
                          </div>

                          <div className="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded border border-slate-800">
                            <span className="text-slate-400">🛡️ Trojan/C2:</span>
                            <span className={breakdown.malwareScore > 0 ? "text-fuchsia-300 font-bold" : "text-slate-500"}>
                              {breakdown.malwareScore || 0}/45
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Anomaly Tags Pills */}
                      {node.anomalyFlags && node.anomalyFlags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2.5">
                          {node.anomalyFlags.map((flag, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-red-950/40 text-red-300 border border-red-800/40 flex items-center gap-1"
                            >
                              <span className="w-1 h-1 rounded-full bg-red-400" />
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Statutory Legal Action Directive Box & Buttons */}
                  <div className="lg:w-[360px] flex flex-col justify-between gap-3 bg-slate-950/70 border border-slate-800 rounded-lg p-3 shrink-0">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1">
                          <RiShieldCheckLine /> {node.statutorySection || "Sec 91 CrPC Directive"}
                        </span>
                        <button
                          onClick={() => copyDirective(node.statutoryDirective, node.id)}
                          className="text-[10.5px] text-slate-400 hover:text-white flex items-center gap-1 font-mono transition-colors cursor-pointer"
                          title="Copy directive text"
                        >
                          {copiedId === node.id ? (
                            <span className="text-emerald-400 flex items-center gap-0.5">
                              <RiCheckDoubleLine /> Copied
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <RiFileCopyLine /> Copy
                            </span>
                          )}
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed font-sans line-clamp-3">
                        {node.statutoryDirective || "Preserve transaction log and issue Section 91 CrPC directive."}
                      </p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          onSelectNode?.(node.id);
                          onFocusNodeInGraph?.(node.id);
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
                      >
                        <RiFocus3Line />
                        <span>Focus in Graph</span>
                      </button>

                      <button
                        onClick={() => {
                          onSelectNode?.(node.id);
                          onOpenDossier?.(node);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <span>Dossier</span>
                        <RiArrowRightLine />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
