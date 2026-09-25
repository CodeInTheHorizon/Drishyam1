import React from "react";
import { 
  RiSearchLine, 
  RiFilter3Line, 
  RiRefreshLine, 
  RiFocus2Line,
  RiPlayFill,
  RiPauseFill
} from "react-icons/ri";
import { networkService } from "../../services/networkService";

const { NODE_COLORS } = networkService;

export default function NetworkFiltersToolbar({
  searchTerm,
  setSearchTerm,
  selectedDistrict,
  setSelectedDistrict,
  selectedCategory,
  setSelectedCategory,
  activeNodeTypes,
  toggleNodeType,
  isSimulationActive,
  setIsSimulationActive,
  onResetView,
  districts,
  categories
}) {
  return (
    <div 
      className="bg-slate-900/85 border border-slate-700/60 rounded-md backdrop-blur-md shadow-xl flex flex-col gap-4"
      style={{ padding: "20px 24px" }}
    >
      {/* Top Row: Search & Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 text-xs font-mono">
        {/* Search Box (4 cols) */}
        <div className="relative sm:col-span-2 lg:col-span-4 flex items-center">
          <RiSearchLine className="absolute left-4 text-slate-400 text-xs pointer-events-none z-10" />
          <input
            type="text"
            placeholder="Search suspect, alias ('Speedy'), FIR, station..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-all shadow-inner"
            style={{ paddingLeft: "44px", paddingRight: "32px" }}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* District Filter (3 cols) */}
        <div className="lg:col-span-3">
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono transition-all cursor-pointer shadow-inner"
            style={{ paddingLeft: "14px", paddingRight: "14px" }}
          >
            <option value="ALL" className="bg-slate-950 text-slate-400">-- ALL DISTRICTS ({districts.length}) --</option>
            {districts.map((d) => (
              <option key={d} value={d} className="bg-slate-950 text-slate-200">{d}</option>
            ))}
          </select>
        </div>

        {/* Category Filter (3 cols) */}
        <div className="lg:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono transition-all cursor-pointer shadow-inner"
            style={{ paddingLeft: "14px", paddingRight: "14px" }}
          >
            <option value="ALL" className="bg-slate-950 text-slate-400">-- ALL CRIME HEADS --</option>
            {categories.map((c) => (
              <option key={c} value={c} className="bg-slate-950 text-slate-200">{c}</option>
            ))}
          </select>
        </div>

        {/* Graph Physics & View Controls (2 cols) */}
        <div className="lg:col-span-2 flex items-center gap-2">
          <button
            onClick={() => setIsSimulationActive(!isSimulationActive)}
            className={`flex-1 h-11 rounded-md text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-inner ${
              isSimulationActive
                ? "bg-blue-600/20 text-blue-300 border border-blue-500/50 hover:bg-blue-600/30"
                : "bg-amber-600/20 text-amber-300 border border-amber-500/50 hover:bg-amber-600/30"
            }`}
            title={isSimulationActive ? "Pause Physics Simulation" : "Resume Physics Simulation"}
          >
            {isSimulationActive ? <RiPauseFill className="text-sm" /> : <RiPlayFill className="text-sm" />}
            <span className="text-[11px]">{isSimulationActive ? "Physics" : "Frozen"}</span>
          </button>

          <button
            onClick={onResetView}
            className="h-11 px-3 bg-slate-950/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/60 rounded-md text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono font-bold shadow-inner"
            title="Recenter & Reset Zoom"
          >
            <RiFocus2Line className="text-sm text-blue-400" />
            <span className="hidden xl:inline text-[11px]">Center</span>
          </button>
        </div>
      </div>

      {/* Bottom Row: Node Type Toggles with NO borders and blended backgrounds */}
      <div className="flex flex-wrap items-center gap-2 pt-3 px-1 border-t border-slate-800/80">
        <span className="text-[10.5px] font-mono text-slate-400 uppercase font-bold tracking-wider mr-1.5">
          Entity Layers:
        </span>

        {Object.entries(NODE_COLORS).map(([typeKey, config]) => {
          const isActive = activeNodeTypes[typeKey];
          return (
            <button
              key={typeKey}
              onClick={() => toggleNodeType(typeKey)}
              className={`px-3 py-1.5 rounded text-[11px] font-mono font-medium flex items-center gap-2 border-0 transition-all cursor-pointer ${
                isActive
                  ? "bg-slate-950/60 text-slate-100 hover:bg-slate-950/80 shadow-sm"
                  : "bg-transparent text-slate-500 hover:bg-slate-950/30 line-through opacity-40"
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: config.base,
                  boxShadow: isActive ? `0 0 8px ${config.base}` : "none"
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
