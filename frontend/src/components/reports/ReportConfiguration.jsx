import React from "react";
import { FaEye, FaSyncAlt } from "react-icons/fa";
import { crimeService } from "../../services/crimeService";
import { officerService } from "../../services/officerService";

const ReportConfiguration = ({ config, onConfigChange, onGeneratePreview, isGenerating }) => {
  const districts = crimeService.getDistricts();
  const categories = crimeService.getCategories();
  const officers = officerService.getOfficers();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    onConfigChange(name, value);
  };

  return (
    <div className="bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl p-6 sm:p-7 space-y-5">
      <div 
        className="flex items-center gap-3 border-b border-slate-800/60" 
        style={{ paddingLeft: "18px", paddingRight: "18px", paddingTop: "8px", paddingBottom: "14px", marginBottom: "18px" }}
      >
        <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
          Report Parameters Configuration
        </h3>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-end" style={{ paddingLeft: "4px", paddingRight: "4px" }}>
        {/* District selection */}
        <div>
          <label 
            className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2 block"
            style={{ paddingLeft: "6px" }}
          >
            Target District
          </label>
          <select
            name="district"
            value={config.district || ""}
            onChange={handleInputChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-colors cursor-pointer"
            style={{ paddingLeft: "16px", paddingRight: "16px", height: "42px" }}
          >
            <option value="">-- ALL DISTRICTS --</option>
            {districts.map((d) => (
              <option key={d} value={d}>
                {d.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Category selection */}
        <div>
          <label 
            className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2 block"
            style={{ paddingLeft: "6px" }}
          >
            Crime Head
          </label>
          <select
            name="category"
            value={config.category || ""}
            onChange={handleInputChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-colors cursor-pointer"
            style={{ paddingLeft: "16px", paddingRight: "16px", height: "42px" }}
          >
            <option value="">-- ALL CRIME HEADS --</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Officer selection */}
        <div>
          <label 
            className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2 block"
            style={{ paddingLeft: "6px" }}
          >
            Target Officer Profile
          </label>
          <select
            name="officerName"
            value={config.officerName || ""}
            onChange={handleInputChange}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-colors cursor-pointer"
            style={{ paddingLeft: "16px", paddingRight: "16px", height: "42px" }}
          >
            <option value="">-- ALL PERSONNEL --</option>
            {officers.map((off) => (
              <option key={off.badgeNumber} value={off.name}>
                {off.name} ({off.rank.slice(0, 10)}...)
              </option>
            ))}
          </select>
        </div>

        {/* Date Ranges */}
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label 
              className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2 block"
              style={{ paddingLeft: "6px" }}
            >
              Start Date
            </label>
            <input
              type="date"
              name="startDate"
              value={config.startDate || ""}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
              style={{ paddingLeft: "14px", paddingRight: "10px", height: "42px" }}
            />
          </div>
          <div>
            <label 
              className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2 block"
              style={{ paddingLeft: "6px" }}
            >
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={config.endDate || ""}
              onChange={handleInputChange}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
              style={{ paddingLeft: "14px", paddingRight: "10px", height: "42px" }}
            />
          </div>
        </div>

        {/* Report Format */}
        <div>
          <label 
            className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2 block"
            style={{ paddingLeft: "6px" }}
          >
            Export Format
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onConfigChange("format", "PDF")}
              className={`rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer text-center ${config.format === "PDF"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white"
                }`}
              style={{ height: "42px" }}
            >
              PDF
            </button>
            <button
              type="button"
              onClick={() => onConfigChange("format", "EXCEL")}
              className={`rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer text-center ${config.format === "EXCEL"
                  ? "bg-blue-600 border-blue-500 text-white"
                  : "bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white"
                }`}
              style={{ height: "42px" }}
            >
              EXCEL
            </button>
          </div>
        </div>

        {/* Report Scope */}
        <div>
          <label 
            className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2 block"
            style={{ paddingLeft: "6px" }}
          >
            Report Scope
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onConfigChange("scope", "Detailed")}
              className={`rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer text-center ${config.scope === "Detailed"
                  ? "bg-slate-800 border-slate-600 text-white font-bold"
                  : "bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white"
                }`}
              style={{ height: "42px" }}
            >
              DETAILED
            </button>
            <button
              type="button"
              onClick={() => onConfigChange("scope", "Summary")}
              className={`rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer text-center ${config.scope === "Summary"
                  ? "bg-slate-800 border-slate-600 text-white font-bold"
                  : "bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white"
                }`}
              style={{ height: "42px" }}
            >
              SUMMARY
            </button>
          </div>
        </div>

        {/* Priority */}
        <div>
          <label 
            className="text-[9px] font-mono font-bold tracking-wider text-slate-400 uppercase mb-2 block"
            style={{ paddingLeft: "6px" }}
          >
            Priority level
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => onConfigChange("priority", "Critical")}
              className={`rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer text-center ${config.priority === "Critical"
                  ? "bg-red-950/40 border-red-500/50 text-red-400 font-bold"
                  : "bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white"
                }`}
              style={{ height: "42px" }}
            >
              CRITICAL
            </button>
            <button
              type="button"
              onClick={() => onConfigChange("priority", "Routine")}
              className={`rounded-lg text-xs font-mono font-bold border transition-colors cursor-pointer text-center ${config.priority === "Routine"
                  ? "bg-slate-800 border-slate-600 text-white font-bold"
                  : "bg-slate-950 border-slate-800 hover:border-slate-750 text-slate-400 hover:text-white"
                }`}
              style={{ height: "42px" }}
            >
              ROUTINE
            </button>
          </div>
        </div>

        {/* Preview Button */}
        <div>
          <button
            onClick={onGeneratePreview}
            disabled={isGenerating}
            className="w-full flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-500 text-white font-mono font-bold text-xs rounded-lg transition-all shadow-md hover:shadow-blue-600/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ height: "42px", paddingLeft: "18px", paddingRight: "18px" }}
          >
            {isGenerating ? (
              <>
                <FaSyncAlt className="text-[10px] animate-spin" />
                GENERATING...
              </>
            ) : (
              <>
                <FaEye className="text-xs" />
                PREVIEW REPORT
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ReportConfiguration;
