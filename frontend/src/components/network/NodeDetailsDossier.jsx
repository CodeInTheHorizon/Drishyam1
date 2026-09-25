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
  RiArrowRightUpLine,
  RiCheckboxCircleLine,
  RiTimeLine
} from "react-icons/ri";
import { Link } from "react-router-dom";

export default function NodeDetailsDossier({
  node,
  onClose,
  onFocusNode
}) {
  if (!node) return null;

  const isSuspect = node.type === "SUSPECT";
  const isLocation = node.type === "LOCATION";
  const isComplainant = node.type === "COMPLAINANT";
  const isSyndicate = node.type === "SYNDICATE";

  const getIcon = () => {
    if (isSuspect) return <RiShieldUserLine className="text-xl text-red-400" />;
    if (isLocation) return <RiBuilding2Line className="text-xl text-blue-400" />;
    if (isComplainant) return <RiUserHeartLine className="text-xl text-green-400" />;
    return <RiTeamLine className="text-xl text-purple-400" />;
  };

  const getBadgeColor = () => {
    if (isSuspect) return "bg-red-500/10 text-red-400 border-red-500/30";
    if (isLocation) return "bg-blue-500/10 text-blue-400 border-blue-500/30";
    if (isComplainant) return "bg-green-500/10 text-green-400 border-green-500/30";
    return "bg-purple-500/10 text-purple-400 border-purple-500/30";
  };

  return (
    <div className="fixed right-6 bottom-6 top-24 w-[380px] sm:w-[440px] bg-slate-900/98 border border-slate-700/80 rounded-md shadow-2xl backdrop-blur-xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 font-sans">
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
            <span className={`inline-block px-2 py-0.5 rounded-sm text-[9.5px] font-mono uppercase font-bold border ${getBadgeColor()} mb-1`}>
              {node.colorConfig?.label || node.type}
            </span>
            <h3 className="text-base font-bold text-white tracking-wide truncate">
              {node.name}
            </h3>
            {node.alias && (
              <p className="text-xs text-amber-300 font-mono font-semibold">
                {node.alias}
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

        {/* Associated Crime Syndicates */}
        {node.syndicates && node.syndicates.length > 0 && (
          <div>
            <h4 className="text-[10.5px] font-mono text-slate-300 uppercase font-bold tracking-wider mb-1.5 flex items-center gap-1.5">
              <RiScales3Line className="text-purple-400 text-sm" />
              <span>Syndicate Affiliations</span>
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {node.syndicates.map((syn, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 rounded text-[10.5px] font-medium bg-purple-950/50 text-purple-300 border border-purple-700/50"
                >
                  {syn}
                </span>
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
                  <span className={fir.status === "Case Closed / Completed" ? "text-emerald-400 font-semibold" : "text-amber-300"}>
                    {fir.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3.5 border-t border-slate-700/60 bg-slate-950/90 flex items-center justify-between gap-3">
        <Link
          to="/records"
          className="flex-1 py-2 px-4 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-center transition-colors flex items-center justify-center gap-1.5 text-xs"
        >
          <span>View in CCTNS Records</span>
          <RiArrowRightUpLine className="text-sm" />
        </Link>
      </div>
    </div>
  );
}
