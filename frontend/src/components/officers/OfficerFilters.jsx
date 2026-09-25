import React from "react";
import { FaSearch, FaUndo, FaChevronDown } from "react-icons/fa";

const OfficerFilters = ({
  filters,
  onFilterChange,
  onReset,
  ranks = [],
  units = []
}) => {
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  return (
    <div 
      className="bg-slate-900/85 border border-slate-700/60 rounded-md backdrop-blur-md shadow-xl"
      style={{ padding: "20px 24px" }}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs font-mono">
        
        {/* Search Input (2 cols) */}
        <div className="relative sm:col-span-2 lg:col-span-2 flex items-center">
          <FaSearch className="absolute left-4 text-slate-400 text-xs pointer-events-none z-10" />
          <input
            type="text"
            name="search"
            placeholder="Search officer by name, rank, badge ID..."
            value={filters.search || ""}
            onChange={handleSelectChange}
            className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-all shadow-inner"
            style={{ paddingLeft: "44px", paddingRight: "16px" }}
          />
        </div>

        {/* Unit Dropdown */}
        <div>
          <select
            name="unit"
            value={filters.unit || ""}
            onChange={handleSelectChange}
            className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono transition-all cursor-pointer shadow-inner"
            style={{ paddingLeft: "14px", paddingRight: "14px" }}
          >
            <option value="" className="bg-slate-950 text-slate-400">-- ALL UNITS --</option>
            {units.map((u) => (
              <option key={u} value={u} className="bg-slate-950 text-slate-200">
                {u}
              </option>
            ))}
          </select>
        </div>

        {/* Rank Dropdown */}
        <div>
          <select
            name="rank"
            value={filters.rank || ""}
            onChange={handleSelectChange}
            className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono transition-all cursor-pointer shadow-inner"
            style={{ paddingLeft: "14px", paddingRight: "14px" }}
          >
            <option value="" className="bg-slate-950 text-slate-400">-- ALL RANKS --</option>
            {ranks.map((r) => (
              <option key={r} value={r} className="bg-slate-950 text-slate-200">
                {r}
              </option>
            ))}
          </select>
        </div>

        {/* Criteria Dropdown */}
        <div>
          <select
            name="minClearance"
            value={filters.minClearance || ""}
            onChange={handleSelectChange}
            className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono transition-all cursor-pointer shadow-inner"
            style={{ paddingLeft: "14px", paddingRight: "14px" }}
          >
            <option value="" className="bg-slate-950 text-slate-400">-- ALL CRITERIA --</option>
            <option value="90" className="bg-slate-950 text-slate-200">90%+ Top Tier</option>
            <option value="85" className="bg-slate-950 text-slate-200">85%+ High Efficiency</option>
            <option value="80" className="bg-slate-950 text-slate-200">80%+ Optimal</option>
            <option value="below80" className="bg-slate-950 text-slate-200">&lt; 80% Scrutiny</option>
          </select>
        </div>

        {/* Reset Button */}
        <div>
          <button
            type="button"
            onClick={onReset}
            className="w-full h-11 rounded-md bg-slate-950/80 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white font-mono text-xs font-bold transition-all cursor-pointer shadow-inner flex items-center justify-center gap-2 active:scale-95"
          >
            <FaUndo className="text-[10px] text-slate-400" />
            <span>RESET</span>
          </button>
        </div>

      </div>
    </div>
  );
};

export default OfficerFilters;
