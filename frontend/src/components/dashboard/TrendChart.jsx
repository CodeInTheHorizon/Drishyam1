import React, { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import ChartCard from "./ChartCard";
import { FaChartLine, FaArrowUp, FaCalendarAlt } from "react-icons/fa";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const total = payload.reduce((sum, entry) => sum + (Number(entry.value) || 0), 0);
    return (
      <div className="rounded-none border border-slate-700/60 bg-slate-950/95 p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs space-y-2.5">
        <div className="flex items-center justify-between gap-4 border-b border-slate-800/80 pb-2">
          <span className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
            <FaCalendarAlt className="text-blue-400 text-[10px]" />
            {label} 2026
          </span>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-none">
            {total} FIRs
          </span>
        </div>

        <div className="space-y-2">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-8 text-[11px]">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-none flex-shrink-0 shadow-sm"
                  style={{ backgroundColor: entry.color, boxShadow: `0 0 6px ${entry.color}` }}
                />
                <span className="text-slate-300 font-medium">{entry.name}</span>
              </div>
              <span className="font-bold text-white tabular-nums">{entry.value.toLocaleString("en-IN")} Cases</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const TrendChart = ({ data, className = "" }) => {
  const [viewMode, setViewMode] = useState("total"); // "total" | "category"

  // Quick analytics calculations for mini bottom summary bar
  const totalCasesSum = data ? data.reduce((acc, d) => acc + (d.total_crimes || 0), 0) : 0;
  const avgMonthlyCases = data && data.length > 0 ? Math.round(totalCasesSum / data.length) : 0;
  const peakMonthObj = data && data.length > 0 ? [...data].sort((a, b) => (b.total_crimes || 0) - (a.total_crimes || 0))[0] : null;

  const toggleControl = (
    <div className="inline-flex items-center gap-3 bg-slate-900/60 border border-slate-700/40 backdrop-blur-md rounded-none p-1.5 text-[11px] font-mono shadow-sm z-10">
      <button
        onClick={() => setViewMode("total")}
        className={`px-4 py-2 rounded-none font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap text-[10px] ${
          viewMode === "total"
            ? "bg-blue-600 text-white shadow-sm border border-blue-400/40"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        }`}
      >
        Overall Trend
      </button>
      <button
        onClick={() => setViewMode("category")}
        className={`px-4 py-2 rounded-none font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer whitespace-nowrap text-[10px] ${
          viewMode === "category"
            ? "bg-blue-600 text-white shadow-sm border border-blue-400/40"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        }`}
      >
        Category-Wise
      </button>
    </div>
  );

  return (
    <ChartCard
      title="Monthly Crime Incidents Trend"
      action={toggleControl}
      className={`h-full flex flex-col ${className}`}
    >
      <div className="flex flex-col flex-1 justify-between gap-4 pt-2">
        {/* Metric Overview Strip (Immediate direction, peak, current, avg) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono text-[10px]">
          <div className="bg-slate-950/80 border border-slate-800/60 p-2 rounded-none flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">DIRECTION</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1 mt-0.5 text-[11px]">
              <FaArrowUp className="text-[9px]" /> UPWARD (+4.2%)
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/60 p-2 rounded-none flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">PEAK MONTH</span>
            <span className="font-bold text-amber-300 mt-0.5 text-[11px]">
              {peakMonthObj ? `${peakMonthObj.month} (${peakMonthObj.total_crimes} FIRs)` : "N/A"}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/60 p-2 rounded-none flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">CURRENT PERIOD</span>
            <span className="font-bold text-cyan-300 mt-0.5 text-[11px]">
              {data && data.length > 0 ? `${data[data.length - 1].month} (${data[data.length - 1].total_crimes} FIRs)` : "N/A"}
            </span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/60 p-2 rounded-none flex flex-col justify-between">
            <span className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">MONTHLY AVG</span>
            <span className="font-bold text-white mt-0.5 text-[11px]">{avgMonthlyCases} FIRs/mo</span>
          </div>
        </div>

        {/* Main Area Chart Container */}
        <div className="h-[320px] w-full flex-1 min-h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 16, right: 16, left: -18, bottom: 0 }}
            >
              <defs>
                {/* Restrained Cyan Multi-stop Linear Gradient */}
                <linearGradient id="colorCyanGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.25} />
                  <stop offset="60%" stopColor="#0891b2" stopOpacity={0.08} />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>

                <linearGradient id="colorTheftGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#facc15" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#eab308" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorAssaultGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff8c38" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#f97316" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorMurderGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f87171" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorPropertyGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCyberGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                stroke="rgba(255, 255, 255, 0.05)"
                strokeDasharray="3 3"
                vertical={false}
              />

              <XAxis
                dataKey="month"
                tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
                tickMargin={10}
              />

              <YAxis
                tick={{ fill: "#64748b", fontSize: 10, fontFamily: "monospace" }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              {viewMode === "category" && (
                <Legend
                  verticalAlign="top"
                  height={36}
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{
                    fontSize: "10px",
                    fontFamily: "monospace",
                    color: "#94a3b8",
                    paddingBottom: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                  }}
                />
              )}

              {/* Render Single Overall Crime Trend in Restrained Cyan */}
              {viewMode === "total" ? (
                <Area
                  type="monotone"
                  name="Overall Incidents (Statewide)"
                  dataKey="total_crimes"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCyanGlow)"
                  dot={{ stroke: "#06b6d4", strokeWidth: 2, fill: "#0891b2", r: 4 }}
                  activeDot={{ r: 6, stroke: "#ffffff", strokeWidth: 2, fill: "#06b6d4" }}
                  isAnimationActive={true}
                  animationDuration={800}
                  animationEasing="ease-out"
                />
              ) : (
                /* Render Category Breakdown Lines */
                <>
                  <Area
                    type="monotone"
                    name="Theft"
                    dataKey="theft"
                    stroke="#eab308"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorTheftGlow)"
                    dot={{ stroke: "#eab308", strokeWidth: 1.5, fill: "#713f12", r: 3 }}
                    activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#eab308" }}
                    isAnimationActive={true}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />

                  <Area
                    type="monotone"
                    name="Assault"
                    dataKey="assault"
                    stroke="#f97316"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorAssaultGlow)"
                    dot={{ stroke: "#f97316", strokeWidth: 1.5, fill: "#7c2d12", r: 3 }}
                    activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#f97316" }}
                    isAnimationActive={true}
                    animationDuration={950}
                    animationEasing="ease-out"
                  />

                  <Area
                    type="monotone"
                    name="Murder"
                    dataKey="murder"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorMurderGlow)"
                    dot={{ stroke: "#ef4444", strokeWidth: 1.5, fill: "#7f1d1d", r: 3 }}
                    activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#ef4444" }}
                    isAnimationActive={true}
                    animationDuration={1100}
                    animationEasing="ease-out"
                  />

                  <Area
                    type="monotone"
                    name="Property Related"
                    dataKey="property_related"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorPropertyGlow)"
                    dot={{ stroke: "#3b82f6", strokeWidth: 1.5, fill: "#1e3a8a", r: 3 }}
                    activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#3b82f6" }}
                    isAnimationActive={true}
                    animationDuration={1250}
                    animationEasing="ease-out"
                  />

                  <Area
                    type="monotone"
                    name="Cyber Crime"
                    dataKey="cyber_crime"
                    stroke="#a855f7"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorCyberGlow)"
                    dot={{ stroke: "#a855f7", strokeWidth: 1.5, fill: "#581c87", r: 3 }}
                    activeDot={{ r: 5, stroke: "#ffffff", strokeWidth: 2, fill: "#a855f7" }}
                    isAnimationActive={true}
                    animationDuration={1400}
                    animationEasing="ease-out"
                  />
                </>
              )}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartCard>
  );
};

export default TrendChart;