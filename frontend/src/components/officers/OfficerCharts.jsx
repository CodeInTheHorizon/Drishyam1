import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

const MONTH_DATA = [
  { month: "Jan", assigned: 45, resolved: 30 },
  { month: "Feb", assigned: 65, resolved: 48 },
  { month: "Mar", assigned: 52, resolved: 40 },
  { month: "Apr", assigned: 78, resolved: 68 },
  { month: "May", assigned: 90, resolved: 78 },
  { month: "Jun", assigned: 68, resolved: 58 },
  { month: "Jul", assigned: 72, resolved: 62 },
  { month: "Aug", assigned: 65, resolved: 55 }
];

const DEFAULT_CATEGORIES = [
  { name: "Property Offenses", value: 10, color: "#3b82f6" },
  { name: "Cyber Crimes", value: 8, color: "#a855f7" },
  { name: "Financial & Fraud", value: 6, color: "#f59e0b" }
];

const CustomAreaTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-md border border-slate-700/80 bg-[#080d19]/95 p-2.5 shadow-xl font-mono text-xs">
        <p className="text-slate-300 font-bold border-b border-slate-800 pb-1 mb-1.5">{label} 2025</p>
        <div className="space-y-1">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center justify-between gap-4">
              <span className="text-slate-400 text-[11px]">{entry.name}:</span>
              <span className="font-bold text-white text-[11px]">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const CATEGORY_STYLE_MAP = {
  "Property Offences": {
    color: "#3b82f6",
    gradientId: "officerPieGradProperty",
    light: "#60a5fa",
    dark: "#1d4ed8",
    shadow: "rgba(59, 130, 246, 0.4)"
  },
  "Property Offenses": {
    color: "#3b82f6",
    gradientId: "officerPieGradProperty",
    light: "#60a5fa",
    dark: "#1d4ed8",
    shadow: "rgba(59, 130, 246, 0.4)"
  },
  "Cyber Crimes": {
    color: "#a855f7",
    gradientId: "officerPieGradCyber",
    light: "#c084fc",
    dark: "#7e22ce",
    shadow: "rgba(168, 85, 247, 0.4)"
  },
  "Cyber Crime": {
    color: "#a855f7",
    gradientId: "officerPieGradCyber",
    light: "#c084fc",
    dark: "#7e22ce",
    shadow: "rgba(168, 85, 247, 0.4)"
  },
  "Financial Fraud": {
    color: "#f59e0b",
    gradientId: "officerPieGradFinancial",
    light: "#fbbf24",
    dark: "#b45309",
    shadow: "rgba(245, 158, 11, 0.4)"
  },
  "Financial & Fraud": {
    color: "#f59e0b",
    gradientId: "officerPieGradFinancial",
    light: "#fbbf24",
    dark: "#b45309",
    shadow: "rgba(245, 158, 11, 0.4)"
  },
  "Assault": {
    color: "#f97316",
    gradientId: "officerPieGradAssault",
    light: "#ff8c38",
    dark: "#c2410c",
    shadow: "rgba(249, 115, 22, 0.4)"
  },
  "Theft": {
    color: "#eab308",
    gradientId: "officerPieGradTheft",
    light: "#facc15",
    dark: "#a16207",
    shadow: "rgba(234, 179, 8, 0.4)"
  },
  "Murder": {
    color: "#ef4444",
    gradientId: "officerPieGradMurder",
    light: "#f87171",
    dark: "#b91c1c",
    shadow: "rgba(239, 68, 68, 0.4)"
  }
};

const DEFAULT_STYLE = {
  color: "#38bdf8",
  gradientId: "officerPieGradDefault",
  light: "#7dd3fc",
  dark: "#0284c7",
  shadow: "rgba(56, 189, 248, 0.4)"
};

const CustomPieTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const style = CATEGORY_STYLE_MAP[entry.name] || DEFAULT_STYLE;
    return (
      <div className="relative z-[9999] rounded-xl border border-slate-700/80 bg-slate-950/98 p-3 shadow-2xl backdrop-blur-md font-mono text-xs">
        <div className="flex items-center gap-2 mb-1 pb-1 border-b border-slate-800/60">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.color }} />
          <p className="font-bold text-white uppercase tracking-wider">{entry.name}</p>
        </div>
        <p className="text-slate-400">Cases: <span className="text-white font-bold">{entry.value}</span></p>
      </div>
    );
  }
  return null;
};

const OfficerCharts = ({ monthlyTrend = [], categoryDistribution = [] }) => {
  const chartTrend = (monthlyTrend && monthlyTrend.length >= 6) ? monthlyTrend : MONTH_DATA;
  const categories = (categoryDistribution && categoryDistribution.length > 0) ? categoryDistribution : DEFAULT_CATEGORIES;
  
  const totalCases = categories.reduce((sum, item) => sum + item.value, 0) || 24;

  // Calculate dynamic Y-axis upper limit based on actual data
  const maxDataVal = Math.max(
    ...chartTrend.map((d) => Math.max(Number(d.assigned) || 0, Number(d.resolved) || 0)),
    4
  );
  const yUpper = maxDataVal <= 8 
    ? maxDataVal + 2 
    : maxDataVal <= 20 
      ? Math.ceil((maxDataVal + 2) / 2) * 2 
      : Math.ceil((maxDataVal * 1.15) / 5) * 5;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch h-full">
      
      {/* 1. CASE RESOLUTION TREND (7 cols) */}
      <div 
        className="lg:col-span-7 rounded-xl border border-slate-800 bg-[#0c1425]/90 backdrop-blur-md shadow-2xl font-sans flex flex-col justify-between"
        style={{ padding: "26px 30px" }}
      >
        <div>
          <div 
            className="flex items-center justify-center text-center pb-3.5 mb-2 border-b border-slate-800/60 w-full"
            style={{ padding: "4px 8px 14px 8px" }}
          >
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.18em] text-center">
              CASE RESOLUTION TREND
            </h3>
          </div>
        </div>

        {/* Area Chart */}
        <div className="h-[210px] w-full mt-4 pl-2 pr-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartTrend}
              margin={{ top: 12, right: 12, left: -6, bottom: 4 }}
            >
              <defs>
                <linearGradient id="colorImgAssigned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.001}/>
                </linearGradient>
                <linearGradient id="colorImgResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.001}/>
                </linearGradient>
              </defs>

              <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" vertical={false} />

              <XAxis
                dataKey="month"
                tick={{ fill: "#64748b", fontSize: 9.5, fontFamily: "monospace" }}
                axisLine={{ stroke: "#1e293b" }}
                tickLine={false}
                dy={5}
              />

              <YAxis
                domain={[0, yUpper]}
                allowDecimals={false}
                tick={{ fill: "#64748b", fontSize: 9.5, fontFamily: "monospace" }}
                axisLine={{ stroke: "#1e293b" }}
                tickLine={false}
                dx={-2}
              />

              <Tooltip content={<CustomAreaTooltip />} />

              <Area
                type="monotone"
                name="Assigned Cases"
                dataKey="assigned"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "#3b82f6" }}
                activeDot={{ r: 4, fill: "#60a5fa" }}
                fillOpacity={1}
                fill="url(#colorImgAssigned)"
              />

              <Area
                type="monotone"
                name="Resolved Cases"
                dataKey="resolved"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ r: 2.5, fill: "#10b981" }}
                activeDot={{ r: 4, fill: "#34d399" }}
                fillOpacity={1}
                fill="url(#colorImgResolved)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Legend Bar */}
        <div className="flex items-center justify-center gap-6 font-mono text-[11px] text-slate-300 mt-4 pt-3 border-t border-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6]" />
            <span className="text-slate-300 font-medium">Assigned Cases</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
            <span className="text-slate-300 font-medium">Resolved Cases</span>
          </div>
        </div>
      </div>

      {/* 2. PERFORMANCE SNAPSHOT (5 cols) */}
      <div 
        className="lg:col-span-5 rounded-xl border border-slate-800 bg-[#0c1425]/90 backdrop-blur-md shadow-2xl font-sans flex flex-col justify-between"
        style={{ padding: "26px 30px" }}
      >
        <div>
          <div 
            className="flex items-center justify-center text-center pb-3.5 mb-2 border-b border-slate-800/60 w-full"
            style={{ padding: "4px 8px 14px 8px" }}
          >
            <h3 className="text-xs font-mono font-bold text-white uppercase tracking-[0.18em] text-center">
              PERFORMANCE SNAPSHOT
            </h3>
          </div>
        </div>

        {/* Donut Chart with Glassmorphic Ring & Central Floating Badge */}
        <div className="relative h-52 w-full flex items-center justify-center my-4">
          {/* Subtle Outer Glowing Glass Ring */}
          <div className="absolute w-44 h-44 rounded-full border border-slate-800/40 bg-slate-900/30 backdrop-blur-md shadow-inner pointer-events-none z-0" />

          <ResponsiveContainer width="100%" height="100%" className="relative z-10">
            <PieChart>
              <defs>
                {Object.entries(CATEGORY_STYLE_MAP).map(([key, style]) => (
                  <linearGradient id={style.gradientId} key={key} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={style.light} stopOpacity={0.95} />
                    <stop offset="60%" stopColor={style.color} stopOpacity={0.85} />
                    <stop offset="100%" stopColor={style.dark} stopOpacity={0.95} />
                  </linearGradient>
                ))}
                <linearGradient id="officerPieGradDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.95} />
                </linearGradient>
              </defs>

              <Pie
                data={categories}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={54}
                outerRadius={74}
                paddingAngle={5}
                cornerRadius={5}
                stroke="rgba(15, 23, 42, 0.6)"
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {categories.map((entry) => {
                  const style = CATEGORY_STYLE_MAP[entry.name] || DEFAULT_STYLE;
                  return (
                    <Cell
                      key={entry.name}
                      fill={`url(#${style.gradientId})`}
                      style={{
                        filter: `drop-shadow(0px 3px 6px ${style.shadow})`,
                        transition: "all 0.3s ease"
                      }}
                    />
                  );
                })}
              </Pie>
              <Tooltip
                content={<CustomPieTooltip />}
                wrapperStyle={{ zIndex: 9999, pointerEvents: "none" }}
                allowEscapeViewBox={{ x: true, y: true }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Inner Glassmorphic Floating Center Badge */}
          <div className="absolute pointer-events-none flex flex-col items-center justify-center w-24 h-24 rounded-full bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-black/50 z-0">
            <span className="text-[8.5px] font-mono tracking-widest text-slate-500 uppercase font-bold">TOTAL</span>
            <span className="font-mono text-xl font-extrabold text-white leading-none mt-1">
              {totalCases}
            </span>
            <span className="text-[8px] font-mono font-bold tracking-wider text-blue-400 uppercase mt-0.5">
              DOCKETS
            </span>
          </div>
        </div>

        {/* Glassmorphic Legend Item Cards with Shaded Progress Bars (Bottom-Stacked) */}
        <div className="space-y-3 mt-3 px-2">
          {categories.map((item) => {
            const pct = totalCases > 0 ? Math.round((item.value / totalCases) * 100) : 0;
            const style = CATEGORY_STYLE_MAP[item.name] || DEFAULT_STYLE;

            return (
              <div
                key={item.name}
                className="bg-slate-900/40 border border-slate-800/60 rounded-xl px-4 py-3 backdrop-blur-sm hover:border-slate-700/60 transition-all shadow-sm space-y-2.5"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2.5 truncate">
                    <span
                      className="h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: style.color, boxShadow: `0 0 6px ${style.color}` }}
                    />
                    <span className="font-bold text-slate-200 uppercase tracking-wide text-[10.5px] truncate">
                      {item.name}
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono text-[10.5px] flex-shrink-0">
                    <span className="text-white font-bold">{item.value} Cases</span>
                    <span className="text-slate-600 px-1.5">•</span>
                    <span className="text-emerald-400 font-bold">{pct}%</span>
                  </div>
                </div>

                {/* Shaded Gradient Progress Bar */}
                <div className="h-1.5 w-full rounded-full bg-slate-950/80 overflow-hidden border border-slate-800/40">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg, ${style.light}, ${style.color}, ${style.dark})`,
                      boxShadow: `0 0 8px ${style.shadow}`
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
};

export default OfficerCharts;
