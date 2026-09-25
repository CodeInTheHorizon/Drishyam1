import React, { useState, useEffect } from "react";
import PageHeader from "../../components/dashboard/PageHeader";
import StatGrid from "../../components/dashboard/StatGrid";
import TrendChart from "../../components/dashboard/TrendChart";
import CrimeCategoryChart from "../../components/dashboard/CrimeCategoryChart";
import RecentCriticalCases from "../../components/dashboard/RecentCriticalCases";
import QuickActionsPanel from "../../components/dashboard/QuickActionsPanel";
import KarnatakaOverviewPanel from "../../components/dashboard/KarnatakaOverviewPanel";
import AIInsightsBanner from "../../components/dashboard/AIInsightsBanner";
import { fetchDashboardData } from "../../services/dashboardService";
import { recordService } from "../../services/recordService";
import { FaSyncAlt, FaCalendarAlt, FaMapMarkerAlt } from "react-icons/fa";

const DISTRICTS = [
  "All Districts (Statewide)",
  "Bengaluru City",
  "Mysuru District",
  "Mangaluru City",
  "Hubli-Dharwad",
  "Belagavi District",
  "Kalaburagi District",
  "Shivamogga",
  "Udupi District",
  "Davanagere",
  "Tumakuru",
  "Chikkamagaluru",
  "Bidar",
  "Mandya",
  "Dakshina Kannada",
  "Hassan",
  "Uttara Kannada"
];

const Dashboard = () => {
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadData = async (district = selectedDistrict) => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchDashboardData(district);
      if (res.status === "success") {
        setDashboardData(res.data);
      } else {
        setError(res.error || "Failed to load dashboard data");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(selectedDistrict);

    // Subscribe to live record updates
    const unsubscribe = recordService.subscribe(() => {
      loadData(selectedDistrict);
    });

    return () => unsubscribe();
  }, [selectedDistrict]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-xs text-slate-500" style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
        <div className="relative mb-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-slate-800 border-t-blue-500" />
        </div>
        <div className="animate-pulse tracking-widest uppercase">
          Querying Karnataka Police CCTNS Datastore...
        </div>
        <div className="text-[10px] text-slate-600 mt-1.5 uppercase">
          Catalyst Functions: getKPIMetrics, getRecentCriticalCases, getAIIntelligenceAlerts
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] font-mono text-xs text-rose-500 border border-rose-900/30 rounded-xl bg-rose-950/5 p-8 max-w-xl mx-auto">
        <span className="font-bold text-sm uppercase mb-2">Catalyst SDK connection error</span>
        <p className="text-slate-400 text-center mb-4">{error}</p>
        <button
          onClick={() => loadData(selectedDistrict)}
          className="px-4 py-2 bg-rose-900/20 border border-rose-800 hover:bg-rose-900/40 text-rose-300 rounded font-bold transition-all"
        >
          Retry Connection Handshake
        </button>
      </div>
    );
  }

  const { kpi_metrics, crime_trends, crime_distribution, ai_alerts, recent_critical_cases } = dashboardData;

  return (
    <div className="flex flex-col gap-8 font-sans">

      {/* ── 1. Executive Intelligence Header ── */}
      <div 
        className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 bg-slate-900/85 border border-slate-700/60 rounded-md backdrop-blur-md shadow-xl animate-fade-in-up"
        style={{ padding: "22px 24px" }}
      >
        {/* Title row */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Executive Intelligence Dashboard
          </h1>
          <p className="text-xs text-slate-300 mt-1 font-sans">
            Karnataka State Police &bull; CCTNS Analytical Command Briefing
          </p>
        </div>

        {/* Operational Status System (Seamless & Evenly Spaced) */}
        <div className="flex flex-wrap items-center justify-start text-left gap-5 sm:gap-7 self-start lg:self-auto font-mono text-[10px]">
          {/* TELEMETRY */}
          <div className="flex flex-col items-start text-left gap-0.5">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold text-left">TELEMETRY</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              SECURE
            </span>
          </div>

          {/* CCTNS */}
          <div className="flex flex-col items-start text-left gap-0.5">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold text-left">CCTNS</span>
            <span className="text-slate-200 font-bold tracking-wider text-left">CONNECTED</span>
          </div>

          {/* AI CORE */}
          <div className="flex flex-col items-start text-left gap-0.5">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold text-left">AI CORE</span>
            <span className="text-blue-400 font-bold tracking-wider text-left">QUICKML ONLINE</span>
          </div>

          {/* JURISDICTION */}
          <div className="flex flex-col items-start text-left gap-0.5">
            <span className="text-[9px] text-slate-400 uppercase tracking-widest font-semibold text-left">JURISDICTION</span>
            <select
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
              className="bg-transparent text-cyan-400 hover:text-cyan-300 transition-colors duration-150 ease-in-out font-bold font-mono outline-none cursor-pointer text-[10px] tracking-wider uppercase text-left"
            >
              <option value="ALL" className="bg-slate-900 text-slate-200 text-left">STATEWIDE</option>
              {DISTRICTS.slice(1).map((d) => (
                <option key={d} value={d} className="bg-slate-900 text-slate-200 text-left">{d.toUpperCase()}</option>
              ))}
            </select>
          </div>

          {/* SYNC CORE Button */}
          <button
            onClick={() => loadData(selectedDistrict)}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-white transition-all duration-200 ease-in-out cursor-pointer group font-mono text-[10px] active:scale-95 py-1 px-2 rounded hover:bg-slate-800/50"
            title="Refresh Dashboard Data"
          >
            <FaSyncAlt className="text-[10px] text-cyan-400 group-hover:rotate-180 transition-transform duration-300 ease-in-out" />
            <span className="font-bold tracking-widest uppercase">SYNC</span>
          </button>
        </div>
      </div>

      {/* ── 2. Main Grid: Left content + Right visual sidebar ── */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-8 items-start">

        {/* LEFT: Primary intelligence content */}
        <div className="flex flex-col gap-8 min-w-0">

          {/* KPI Cards (Visual 4-Grid with Sparklines) */}
          <div className="animate-fade-in-up" style={{ animationDelay: '60ms' }}>
            <StatGrid metrics={kpi_metrics} />
          </div>

          {/* Chart Row: Trend (2/3) + Category (1/3) */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 animate-fade-in-up" style={{ animationDelay: '120ms' }}>
            <div className="lg:col-span-2">
              <TrendChart data={crime_trends} />
            </div>
            <div className="lg:col-span-1">
              <CrimeCategoryChart data={crime_distribution} />
            </div>
          </div>

          {/* Critical Cases Feed */}
          <div className="animate-fade-in-up" style={{ animationDelay: '180ms' }}>
            <RecentCriticalCases cases={recent_critical_cases} />
          </div>
        </div>

        {/* RIGHT: Intelligence & GIS spatial sidebar */}
        <div className="flex flex-col gap-8 xl:sticky xl:top-10 xl:self-start animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          <KarnatakaOverviewPanel />
          <AIInsightsBanner />
        </div>
      </div>

      {/* ── 3. Command Console (full width below grid) ── */}
      <div className="animate-fade-in-up" style={{ animationDelay: '220ms' }}>
        <QuickActionsPanel />
      </div>

    </div>
  );
};

export default Dashboard;