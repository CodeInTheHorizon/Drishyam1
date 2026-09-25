import React from "react";
import { FaUndo, FaSearch, FaFilter } from "react-icons/fa";
import { crimeService } from "../../services/crimeService";

const MapFilters = ({ filters, onFilterChange, onReset }) => {
  const districts = crimeService.getDistricts();
  const categories = crimeService.getCategories();
  const severities = crimeService.getSeverities();
  const statuses = crimeService.getStatuses();

  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    onFilterChange(name, value);
  };

  return (
    <div className="cmd-toolbar rounded-md px-5 py-3 animate-fade-in-up" style={{ padding: "14px 18px" }}>
      <div className="flex flex-wrap items-center gap-3">

        {/* Label */}
        <div className="flex items-center gap-2.5 pl-1 pr-3.5 border-r border-slate-700/40 mr-0.5 flex-shrink-0">
          <div className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-pulse" />
          <span className="text-[10px] font-mono font-bold tracking-[0.14em] text-slate-400 uppercase whitespace-nowrap">
            Intel Filters
          </span>
        </div>

        {/* District */}
        <div className="flex-1 min-w-[130px]">
          <select
            name="district"
            value={filters.district || ""}
            onChange={handleSelectChange}
            className="w-full"
          >
            <option value="">All Districts</option>
            {districts.map((d) => (
              <option key={d} value={d}>{d.toUpperCase()}</option>
            ))}
          </select>
        </div>

        {/* Police Unit Search */}
        <div className="flex-1 min-w-[130px] relative">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none" />
          <input
            type="text"
            name="unit"
            placeholder="Police Station..."
            value={filters.unit || ""}
            onChange={handleSelectChange}
            className="w-full pl-7"
          />
        </div>

        {/* Crime Category */}
        <div className="flex-1 min-w-[130px]">
          <select
            name="category"
            value={filters.category || ""}
            onChange={handleSelectChange}
            className="w-full"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div className="min-w-[110px]">
          <select
            name="severity"
            value={filters.severity || ""}
            onChange={handleSelectChange}
            className="w-full"
          >
            <option value="">All Severity</option>
            {severities.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="flex-1 min-w-[130px]">
          <select
            name="status"
            value={filters.status || ""}
            onChange={handleSelectChange}
            className="w-full"
          >
            <option value="">All Statuses</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* Date separator */}
        <div className="flex items-center gap-2 border-l border-slate-700/30 pl-2.5">
          <input
            type="date"
            name="startDate"
            value={filters.startDate || ""}
            onChange={handleSelectChange}
            className="w-32"
          />
          <span className="text-slate-600 text-[9px] font-mono flex-shrink-0">→</span>
          <input
            type="date"
            name="endDate"
            value={filters.endDate || ""}
            onChange={handleSelectChange}
            className="w-32"
          />
        </div>

        {/* Reset */}
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/30 hover:border-slate-600/40 text-slate-400 hover:text-slate-200 px-3 py-1.5 rounded-md text-[10px] font-mono font-bold transition-all duration-150 flex-shrink-0 cursor-pointer"
        >
          <FaUndo className="text-[8px]" />
          Reset
        </button>
      </div>
    </div>
  );
};

export default MapFilters;
