import React from "react";
import { 
  RiRouteLine, 
  RiUserSearchLine, 
  RiExternalLinkLine,
  RiAlertFill,
  RiBuilding2Line,
  RiMapPinRangeLine
} from "react-icons/ri";

export default function CrossJurisdictionFinder({
  crossDistrictSuspects,
  selectedSuspectId,
  onSelectSuspect
}) {
  return (
    <div 
      className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-xl flex flex-col gap-3.5 backdrop-blur-md"
      style={{ padding: "22px 24px" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-700/50 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/15 border border-amber-500/30 rounded-md text-amber-400">
            <RiRouteLine className="text-base" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Cross-Jurisdiction Connection Finder
              <span className="px-2 py-0.5 rounded-sm text-[9.5px] bg-red-950/50 text-red-300 border border-red-500/40 font-mono font-bold">
                {crossDistrictSuspects.length} Multi-District Targets
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Multi-district suspect trails detected across police jurisdictions.
            </p>
          </div>
        </div>
      </div>

      {/* Suspect Multi-Jurisdiction List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[220px] overflow-y-auto pr-1">
        {crossDistrictSuspects.map((suspect) => {
          const isSelected = selectedSuspectId === suspect.id;
          return (
            <button
              key={suspect.id}
              onClick={() => onSelectSuspect(suspect.id)}
              className={`rounded-md border text-left transition-all relative overflow-hidden group cursor-pointer ${
                isSelected
                  ? "bg-blue-900/30 border-blue-500 shadow-md shadow-blue-500/15 ring-1 ring-blue-500/50"
                  : "bg-slate-900/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/80"
              }`}
              style={{ padding: "16px 18px" }}
            >
              {/* Highlight badge on active */}
              {isSelected && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-400 rounded-bl" />
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white group-hover:text-blue-300 transition-colors flex items-center gap-1.5 truncate">
                    <span>{suspect.name}</span>
                    {suspect.alias && (
                      <span className="text-[10.5px] text-amber-300 font-mono font-semibold">
                        {suspect.alias}
                      </span>
                    )}
                  </p>
                  <p className="text-[9.5px] font-mono text-slate-400 mt-0.5 flex items-center gap-1">
                    <RiAlertFill className="text-red-400 text-xs flex-shrink-0" />
                    <span className="text-slate-300">{suspect.casesCount} Linked FIRs</span>
                    <span>•</span>
                    <span className="text-amber-300 font-semibold">{suspect.districts.length} Districts</span>
                  </p>
                </div>
                
                <span className="p-1 rounded-md bg-slate-800/90 group-hover:bg-blue-600/20 text-slate-400 group-hover:text-blue-300 transition-colors">
                  <RiExternalLinkLine className="text-xs" />
                </span>
              </div>

              {/* District Trail Tags */}
              <div className="flex flex-wrap gap-1 mt-2">
                {suspect.districts.map((dist, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[9.5px] font-medium bg-slate-800/90 text-slate-200 border border-slate-700/60 flex items-center gap-1"
                  >
                    <RiMapPinRangeLine className="text-[9px] text-blue-400" />
                    <span>{dist}</span>
                  </span>
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
