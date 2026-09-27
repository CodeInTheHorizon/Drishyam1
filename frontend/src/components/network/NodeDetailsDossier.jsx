import React from "react";
import { 
  RiCloseLine, 
  RiShieldUserLine, 
  RiBuilding2Line, 
  RiUserHeartLine, 
  RiTeamLine,
  RiFileTextLine,
  RiMapPinLine,
  RiScales3Line,
  RiBankCardLine,
  RiCellphoneLine,
  RiSmartphoneLine,
  RiServerLine,
  RiAndroidLine,
  RiMailLine,
  RiAlertFill,
  RiMoneyDollarCircleLine,
  RiExchangeDollarLine,
  RiShieldCheckLine,
  RiArrowRightLine,
  RiSparklingFill
} from "react-icons/ri";

export default function NodeDetailsDossier({
  node,
  onClose,
  onFocusNode
}) {
  if (!node) return null;

  const isForensicNode = [
    "VICTIM", "L1_MULE", "L2_MULE", "CASHOUT", 
    "PHONE", "IMEI", "C2_SERVER", "MALWARE_APK", "EMAIL_SPOOF"
  ].includes(node.type);

  const isSuspect = node.type === "SUSPECT";
  const isLocation = node.type === "LOCATION";
  const isComplainant = node.type === "COMPLAINANT";
  const isSyndicate = node.type === "SYNDICATE";

  const getForensicIcon = () => {
    switch (node.type) {
      case "VICTIM": return <RiUserHeartLine className="text-xl text-emerald-400" />;
      case "L1_MULE": return <RiBankCardLine className="text-xl text-amber-400" />;
      case "L2_MULE": return <RiExchangeDollarLine className="text-xl text-orange-400" />;
      case "CASHOUT": return <RiMoneyDollarCircleLine className="text-xl text-red-400" />;
      case "PHONE": return <RiCellphoneLine className="text-xl text-blue-400" />;
      case "IMEI": return <RiSmartphoneLine className="text-xl text-purple-400" />;
      case "C2_SERVER": return <RiServerLine className="text-xl text-rose-400" />;
      case "MALWARE_APK": return <RiAndroidLine className="text-xl text-fuchsia-400" />;
      case "EMAIL_SPOOF": return <RiMailLine className="text-xl text-yellow-400" />;
      default: return <RiFileTextLine className="text-xl text-slate-400" />;
    }
  };

  const getIcon = () => {
    if (isForensicNode) return getForensicIcon();
    if (isSuspect) return <RiShieldUserLine className="text-xl text-red-400" />;
    if (isLocation) return <RiBuilding2Line className="text-xl text-blue-400" />;
    if (isComplainant) return <RiUserHeartLine className="text-xl text-green-400" />;
    return <RiTeamLine className="text-xl text-purple-400" />;
  };

  const getBadgeColor = () => {
    if (isForensicNode) {
      if (node.type === "VICTIM") return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      if (node.type === "L1_MULE") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      if (node.type === "L2_MULE") return "bg-orange-500/10 text-orange-400 border-orange-500/30";
      if (node.type === "CASHOUT") return "bg-red-500/10 text-red-400 border-red-500/30";
      if (node.type === "PHONE") return "bg-blue-500/10 text-blue-400 border-blue-500/30";
      if (node.type === "IMEI") return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      if (node.type === "C2_SERVER") return "bg-rose-500/10 text-rose-400 border-rose-500/30";
      if (node.type === "MALWARE_APK") return "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/30";
      return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
    }
    if (isSuspect) return "bg-red-500/10 text-red-400 border-red-500/30";
    if (isLocation) return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    if (isComplainant) return "bg-green-500/10 text-green-400 border-green-500/30";
    return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  };

  const riskScore = node.riskScore || 0;
  const getRiskSeverity = (score) => {
    if (score >= 85) return { label: "CRITICAL RISK", color: "text-red-400 bg-red-500/10 border-red-500/30" };
    if (score >= 65) return { label: "HIGH RISK", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    if (score >= 40) return { label: "MODERATE", color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
    return { label: "LOW RISK / VICTIM", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
  };
  const severity = getRiskSeverity(riskScore);

  return (
    <div className="fixed right-6 bottom-6 top-24 w-[380px] sm:w-[460px] bg-slate-900/98 border border-slate-700/80 rounded-md shadow-2xl backdrop-blur-xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 font-sans">
      {/* Header */}
      <div 
        className="border-b border-slate-700/60 flex items-start justify-between bg-slate-950/80"
        style={{ padding: "18px 20px" }}
      >
        <div className="flex items-start gap-3 min-w-0">
          <div className={`p-2 rounded-md border ${getBadgeColor()} flex-shrink-0`}>
            {getIcon()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-block px-2 py-0.5 rounded-sm text-[9.5px] font-mono uppercase font-bold border ${getBadgeColor()}`}>
                {node.colorConfig?.label || node.type}
              </span>
              {isForensicNode && (
                <span className={`inline-block px-2 py-0.5 rounded-sm text-[9px] font-mono font-bold border ${severity.color}`}>
                  {severity.label} ({riskScore}%)
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-white tracking-wide truncate">
              {node.name}
            </h3>
            {node.subtitle && (
              <p className="text-xs text-slate-400 font-mono truncate">
                {node.subtitle}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <RiCloseLine className="text-lg" />
        </button>
      </div>

      {/* Body Scroll */}
      <div 
        className="flex-1 overflow-y-auto space-y-4 text-xs"
        style={{ padding: "18px 20px" }}
      >
        {/* Forensic Specific View */}
        {isForensicNode ? (
          <>
            {/* Risk Gauge Bar */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                  <RiAlertFill className={riskScore >= 70 ? "text-red-400" : "text-amber-400"} />
                  Heuristic Anomaly Index
                </span>
                <span className="font-bold text-white">{riskScore}/100</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    riskScore >= 85 ? "bg-red-500" : riskScore >= 65 ? "bg-amber-500" : "bg-emerald-500"
                  }`}
                  style={{ width: `${Math.max(5, riskScore)}%` }}
                />
              </div>
            </div>

            {/* Anomaly Flags */}
            {node.anomalyFlags && node.anomalyFlags.length > 0 && (
              <div>
                <h4 className="text-[10.5px] font-mono text-slate-300 uppercase font-bold tracking-wider mb-2 flex items-center gap-1.5">
                  <RiSparklingFill className="text-amber-400 text-sm" />
                  <span>Detected Anomaly Indicators ({node.anomalyFlags.length})</span>
                </h4>
                <div className="space-y-1.5">
                  {node.anomalyFlags.map((flag, idx) => (
                    <div 
                      key={idx}
                      className="px-2.5 py-1.5 rounded bg-red-950/40 border border-red-800/40 text-red-300 text-[11px] flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Ledger (Mule Inflow & Outflow) */}
            {(node.inboundFunds?.length > 0 || node.outboundFunds?.length > 0) && (
              <div className="space-y-2.5">
                <h4 className="text-[10.5px] font-mono text-slate-300 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <RiBankCardLine className="text-emerald-400 text-sm" />
                  <span>Transaction Ledger & Flow Routing</span>
                </h4>

                {/* Inbound */}
                {node.inboundFunds?.length > 0 && (
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                    <p className="text-[10px] font-mono font-bold text-emerald-400 uppercase">Incoming Transfers (Inflow)</p>
                    {node.inboundFunds.map((inflow, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] border-b border-slate-800/60 pb-1">
                        <span className="text-slate-300 truncate max-w-[200px]">From: {inflow.from}</span>
                        <span className="font-mono font-bold text-emerald-400">
                          +₹{inflow.amount?.toLocaleString("en-IN")} ({inflow.mode})
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Outbound */}
                {node.outboundFunds?.length > 0 && (
                  <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-2.5 space-y-1.5">
                    <p className="text-[10px] font-mono font-bold text-amber-400 uppercase">Dispersed Outflow</p>
                    {node.outboundFunds.map((outflow, i) => (
                      <div key={i} className="flex items-center justify-between text-[11px] border-b border-slate-800/60 pb-1">
                        <span className="text-slate-300 truncate max-w-[200px]">To: {outflow.to}</span>
                        <span className="font-mono font-bold text-amber-400">
                          -₹{outflow.amount?.toLocaleString("en-IN")} ({outflow.mode})
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Hardware & Telecom Specs */}
            {node.details && (node.type === "PHONE" || node.type === "IMEI") && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2">
                <h4 className="text-[10.5px] font-mono text-slate-300 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <RiSmartphoneLine className="text-purple-400 text-sm" />
                  <span>Hardware & Telecom Identity</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                  {node.details.imei && (
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">IMEI NUMBER</span>
                      <span className="text-purple-300 font-bold">{node.details.imei}</span>
                    </div>
                  )}
                  {node.details.imsi && (
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-slate-500 block text-[9px]">IMSI NUMBER</span>
                      <span className="text-blue-300 font-bold">{node.details.imsi}</span>
                    </div>
                  )}
                  {node.details.tower && (
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 col-span-2">
                      <span className="text-slate-500 block text-[9px]">CELL TOWER CGI / LOCATION</span>
                      <span className="text-slate-200">{node.details.tower} {node.details.location ? `(${node.details.location})` : ""}</span>
                    </div>
                  )}
                  {node.details.linkedSims && (
                    <div className="p-2 rounded bg-slate-900 border border-slate-800 col-span-2">
                      <span className="text-slate-500 block text-[9px]">SWAPPED SIM PHONE NUMBERS</span>
                      <span className="text-amber-300 font-bold">{node.details.linkedSims.join(", ")}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Malware & C2 Details */}
            {node.details && (node.type === "MALWARE_APK" || node.type === "C2_SERVER" || node.type === "EMAIL_SPOOF") && (
              <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 space-y-2">
                <h4 className="text-[10.5px] font-mono text-slate-300 uppercase font-bold tracking-wider flex items-center gap-1.5">
                  <RiAndroidLine className="text-fuchsia-400 text-sm" />
                  <span>Cyber Forensic Intelligence</span>
                </h4>
                {node.details.packageName && (
                  <p className="text-[11px] text-slate-300 font-mono">
                    <span className="text-slate-500">Package:</span> {node.details.packageName}
                  </p>
                )}
                {node.details.permissions && (
                  <div>
                    <span className="text-[9.5px] text-slate-500 font-mono block mb-1">DANGEROUS PERMISSIONS:</span>
                    <div className="flex flex-wrap gap-1">
                      {node.details.permissions.map((p, i) => (
                        <span key={i} className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-fuchsia-950/60 text-fuchsia-300 border border-fuchsia-800/40">
                          {p.replace("android.permission.", "")}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {node.details.from && (
                  <div className="space-y-1 text-[11px] font-mono">
                    <p><span className="text-slate-500">Subject:</span> {node.details.subject}</p>
                    <p><span className="text-slate-500">SPF Status:</span> <span className="text-red-400 font-bold">{node.details.spf}</span></p>
                  </div>
                )}
              </div>
            )}

            {/* Actionable Field Directive / Seizure Recommendation */}
            {node.recommendedAction && (
              <div className="p-3.5 rounded-lg bg-blue-950/40 border border-blue-500/40 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                  <RiShieldCheckLine className="text-blue-400 text-sm" />
                  Actionable Police Field Recommendation
                </span>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {node.recommendedAction}
                </p>
              </div>
            )}
          </>
        ) : (
          /* Standard CCTNS RMS View */
          <>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div 
                className="bg-slate-950/70 border border-slate-700/60 rounded-md"
                style={{ padding: "12px 14px" }}
              >
                <p className="text-[9.5px] text-slate-400 uppercase font-mono font-semibold">Linked FIRs</p>
                <p className="text-lg font-bold text-white font-mono mt-0.5">{node.casesCount || 0}</p>
              </div>
              <div 
                className="bg-slate-950/70 border border-slate-700/60 rounded-md"
                style={{ padding: "12px 14px" }}
              >
                <p className="text-[9.5px] text-slate-400 uppercase font-mono font-semibold">
                  {isLocation ? "Connected Suspects" : "Jurisdiction Scope"}
                </p>
                <p className="text-lg font-bold text-blue-400 font-mono mt-0.5">
                  {isLocation 
                    ? (Array.isArray(node.suspects) ? node.suspects.length : (node.suspects?.size || 0))
                    : (node.districts ? `${node.districts.length} Districts` : "1 Station")}
                </p>
              </div>
            </div>

            {/* Cross-District Jurisdictions */}
            {node.districts && node.districts.length > 0 && (
              <div>
                <h4 className="text-[10.5px] font-mono text-slate-300 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                  <RiMapPinLine className="text-blue-400 text-sm" />
                  <span>Active Police Jurisdictions ({node.districts.length})</span>
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {node.districts.map((dist, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-sm text-[10.5px] font-medium bg-blue-950/50 text-blue-300 border border-blue-700/50"
                    >
                      {dist}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Co-Accused Associates */}
            {isSuspect && node.coAccused && node.coAccused.length > 0 && (
              <div>
                <h4 className="text-[10.5px] font-mono text-slate-300 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                  <RiTeamLine className="text-red-400 text-sm" />
                  <span>Identified Co-Accused ({node.coAccused.length})</span>
                </h4>
                <div className="space-y-1.5">
                  {node.coAccused.map((accusedName, idx) => (
                    <div
                      key={idx}
                      className="rounded-md bg-slate-950/60 border border-slate-700/60 flex items-center justify-between group"
                      style={{ padding: "10px 12px" }}
                    >
                      <span className="text-xs font-medium text-slate-200">{accusedName}</span>
                      <span className="text-[9.5px] text-red-300 font-mono bg-red-950/50 px-2 py-0.5 rounded-sm border border-red-800/50 font-semibold">
                        Linked Associate
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Connected FIRs List */}
            <div>
              <h4 className="text-[10.5px] font-mono text-slate-300 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
                <RiFileTextLine className="text-amber-400 text-sm" />
                <span>Database Crime Records ({node.firs ? node.firs.length : 0})</span>
              </h4>
              <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                {node.firs && node.firs.map((fir, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-950/70 border border-slate-700/60 rounded-lg space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-400 text-xs">
                        FIR #{fir.crimeNo}
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9.5px] font-mono bg-slate-800 text-slate-300">
                        {fir.regDate}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-100 font-semibold">
                      {fir.crimeHead} — <span className="text-slate-400 font-normal">{fir.crimeSubHead || fir.actSections}</span>
                    </p>

                    <p className="text-[10.5px] text-slate-300 leading-relaxed line-clamp-2 font-sans">
                      {fir.briefFacts}
                    </p>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[9.5px] text-slate-400 font-mono">
                      <span>{fir.unit}</span>
                      <span>IO: {fir.ioName || "Unassigned"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div 
        className="border-t border-slate-700/60 bg-slate-950/90 flex items-center justify-between"
        style={{ padding: "14px 20px" }}
      >
        <span className="text-[10px] text-slate-500 font-mono">
          ID: {node.id.slice(0, 18)}...
        </span>
        <button
          onClick={() => onFocusNode?.(node)}
          className="px-3 py-1.5 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Focus in Graph</span>
          <RiArrowRightLine />
        </button>
      </div>
    </div>
  );
}
