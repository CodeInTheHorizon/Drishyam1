import React, { useState, useEffect, useMemo } from "react";
import { 
  RiTimeLine, 
  RiRadarLine, 
  RiFireLine, 
  RiCarLine, 
  RiFilter3Line, 
  RiRefreshLine,
  RiBuilding2Line,
  RiShieldFlashLine,
  RiSparklingFill
} from "react-icons/ri";
import { diurnalService } from "../../services/diurnalService";
import { recordService } from "../../services/recordService";
import { crimeService } from "../../services/crimeService";
import DiurnalHeatMatrix from "../../components/diurnal/DiurnalHeatMatrix";
import RedZonePulseAlerts from "../../components/diurnal/RedZonePulseAlerts";
import PatrolDeploymentSchedule from "../../components/diurnal/PatrolDeploymentSchedule";
import HourlyTrendBar from "../../components/diurnal/HourlyTrendBar";

export default function DiurnalMatrix() {
  const [selectedDistrict, setSelectedDistrict] = useState("Bengaluru City");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [selectedCell, setSelectedCell] = useState(null);

  // State to trigger re-renders on database sync
  const [dbVersion, setDbVersion] = useState(0);

  // Subscribe to real-time database changes from recordService
  useEffect(() => {
    const unsubscribe = recordService.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
    return () => unsubscribe();
  }, []);

  const districts = useMemo(() => crimeService.getDistricts() || [], []);
  const categories = useMemo(() => crimeService.getCategories() || [], []);

  // Compute live diurnal matrix & red-zone alerts from database
  const { matrixData, redZoneAlerts, patrolShifts } = useMemo(() => {
    const matrix = diurnalService.getDiurnalMatrix({
      district: selectedDistrict,
      category: selectedCategory,
      severity: selectedSeverity
    });

    const alerts = diurnalService.getRedZoneAlerts();
    const shifts = diurnalService.getPatrolShiftSchedule({
      district: selectedDistrict,
      category: selectedCategory
    });

    return {
      matrixData: matrix,
      redZoneAlerts: alerts,
      patrolShifts: shifts
    };
  }, [selectedDistrict, selectedCategory, selectedSeverity, dbVersion]);

  const handleResetFilters = () => {
    setSelectedDistrict("Bengaluru City");
    setSelectedCategory("ALL");
    setSelectedSeverity("ALL");
    setSelectedCell(null);
  };

  return (
    <div 
      className="flex flex-col gap-8 animate-in fade-in duration-200 pb-16"
      style={{ display: "flex", flexDirection: "column", gap: "32px" }}
    >
      {/* Executive Command Header */}
      <div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/85 border border-slate-700/60 rounded-md backdrop-blur-md shadow-xl"
        style={{ padding: "22px 24px" }}
      >
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <RiTimeLine className="text-amber-400 text-2xl" />
            <span>Spatiotemporal Diurnal Crime Matrix & Red-Zone Pulsing</span>
          </h1>

          <p className="text-xs text-slate-300 mt-1 max-w-2xl font-sans">
            Temporal rhythm analysis & high-velocity surge detection across Karnataka police stations.
          </p>
        </div>

        {/* Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* District Select */}
          <select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            className="bg-slate-950/80 border border-slate-700/70 text-slate-200 rounded-md px-3 py-2 text-xs font-mono focus:border-amber-400 focus:outline-none cursor-pointer hover:border-slate-600 transition-colors"
          >
            <option value="ALL">All Districts (Statewide)</option>
            {districts.map((dist, idx) => (
              <option key={idx} value={dist}>
                {dist}
              </option>
            ))}
          </select>

          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950/80 border border-slate-700/70 text-slate-200 rounded-md px-3 py-2 text-xs font-mono focus:border-amber-400 focus:outline-none cursor-pointer hover:border-slate-600 transition-colors"
          >
            <option value="ALL">All Crime Categories</option>
            {categories.map((cat, idx) => (
              <option key={idx} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Reset Button */}
          <button
            onClick={handleResetFilters}
            className="p-2 rounded-md bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Reset Filters"
          >
            <RiRefreshLine className="text-sm text-amber-400" />
          </button>
        </div>
      </div>

      {/* 4 Executive Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Total Data Points</span>
            <RiTimeLine className="text-blue-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{matrixData.totalIncidents}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">In Active Scope</span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Active Red-Zones</span>
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400 font-mono">{redZoneAlerts.length}</p>
          <span className="text-[9px] text-rose-400/90 font-medium font-sans mt-0.5">&gt;25% Surge Flagged</span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Peak Diurnal Hour</span>
            <RiFireLine className="text-amber-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300 font-mono">
            {matrixData.topPeaks[0]?.hourRange || "02:00 - 04:00"}
          </p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">{matrixData.topPeaks[0]?.day || "Weekends"}</span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Primary Threat Window</span>
            <RiShieldFlashLine className="text-cyan-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-cyan-300 font-mono truncate">
            {matrixData.topPeaks[0]?.primaryThreat || "Property Theft"}
          </p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">Night Watch Shift 3</span>
        </div>
      </div>

      {/* 24-Hour Diurnal Aggregate Curve */}
      <HourlyTrendBar hourlyData={matrixData.grid} />

      {/* Red-Zone Radar Pulse Alerts Stream */}
      <RedZonePulseAlerts
        alerts={redZoneAlerts}
        selectedDistrict={selectedDistrict}
        onSelectDistrict={setSelectedDistrict}
      />

      {/* 24x7 Diurnal Heat Matrix with Interactive FIR Dossier Drawer */}
      <DiurnalHeatMatrix
        matrixData={matrixData}
        selectedCell={selectedCell}
        onSelectCell={setSelectedCell}
      />

      {/* Proactive Tactical Patrol Deployment Schedule */}
      <PatrolDeploymentSchedule shifts={patrolShifts} />
    </div>
  );
}
