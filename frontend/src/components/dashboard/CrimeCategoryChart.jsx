import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from "recharts";
import ChartCard from "./ChartCard";

const CATEGORY_STYLE_MAP = {
  "Assault": {
    color: "#f97316",
    gradientId: "pieGradAssault",
    light: "#ff8c38",
    dark: "#c2410c",
    shadow: "rgba(249, 115, 22, 0.4)"
  },
  "Cyber Crime": {
    color: "#a855f7",
    gradientId: "pieGradCyber",
    light: "#c084fc",
    dark: "#7e22ce",
    shadow: "rgba(168, 85, 247, 0.4)"
  },
  "Murder": {
    color: "#ef4444",
    gradientId: "pieGradMurder",
    light: "#f87171",
    dark: "#b91c1c",
    shadow: "rgba(239, 68, 68, 0.4)"
  },
  "Property Related": {
    color: "#3b82f6",
    gradientId: "pieGradProperty",
    light: "#60a5fa",
    dark: "#1d4ed8",
    shadow: "rgba(59, 130, 246, 0.4)"
  },
  "Theft": {
    color: "#eab308",
    gradientId: "pieGradTheft",
    light: "#facc15",
    dark: "#a16207",
    shadow: "rgba(234, 179, 8, 0.4)"
  }
};

const DEFAULT_STYLE = {
  color: "#38bdf8",
  gradientId: "pieGradDefault",
  light: "#7dd3fc",
  dark: "#0284c7",
  shadow: "rgba(56, 189, 248, 0.4)"
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const style = CATEGORY_STYLE_MAP[data.category] || DEFAULT_STYLE;
    return (
      <div className="relative z-[9999] rounded-xl border border-slate-700/80 bg-slate-950/98 p-3.5 shadow-2xl backdrop-blur-md font-mono text-xs">
        <div className="flex items-center gap-2 mb-1.5 pb-1 border-b border-slate-800/60">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: style.color }} />
          <p className="font-bold text-white uppercase tracking-wider">{data.category}</p>
        </div>
        <p className="text-slate-400">Total FIRs: <span className="text-white font-bold">{data.fir_count.toLocaleString("en-IN")}</span></p>
        <p className="text-slate-400 mt-0.5">Share: <span className="text-emerald-400 font-bold">{data.percentage}%</span></p>
      </div>
    );
  }
  return null;
};

const CrimeCategoryChart = ({ data, className = "" }) => {
  if (!data) return null;

  const totalCases = data.reduce((sum, item) => sum + item.fir_count, 0);

  return (
    <ChartCard
      title="Crime Category Distribution"
      centerTitle={true}
      className={`h-full flex flex-col ${className}`}
    >
      <div className="flex flex-col gap-6 flex-1 justify-between pt-2">
        {/* Glassmorphic Outer Container for Donut Chart */}
        <div className="relative h-64 w-full flex items-center justify-center my-auto">
          {/* Subtle Outer Glowing Glass Ring */}
          <div className="absolute w-56 h-56 rounded-full border border-slate-800/40 bg-slate-900/30 backdrop-blur-md shadow-inner pointer-events-none z-0" />

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
                <linearGradient id="pieGradDefault" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#7dd3fc" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#0284c7" stopOpacity={0.95} />
                </linearGradient>
              </defs>

              <Pie
                data={data}
                dataKey="fir_count"
                nameKey="category"
                innerRadius={72}
                outerRadius={96}
                paddingAngle={5}
                cornerRadius={6}
                stroke="rgba(15, 23, 42, 0.6)"
                strokeWidth={2}
                isAnimationActive={true}
                animationDuration={900}
                animationEasing="ease-out"
              >
                {data.map((entry) => {
                  const style = CATEGORY_STYLE_MAP[entry.category] || DEFAULT_STYLE;
                  return (
                    <Cell
                      key={entry.category}
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
                content={<CustomTooltip />}
                wrapperStyle={{ zIndex: 9999, pointerEvents: "none" }}
                allowEscapeViewBox={{ x: true, y: true }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Inner Glassmorphic Floating Center Badge */}
          <div className="absolute pointer-events-none flex flex-col items-center justify-center w-28 h-28 rounded-full bg-slate-950/80 border border-slate-800/80 backdrop-blur-md shadow-xl shadow-black/50 z-0">
            <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase font-bold">TOTAL</span>
            <span className="font-mono text-2xl font-extrabold text-white leading-none mt-1">
              {totalCases.toLocaleString("en-IN")}
            </span>
            <span className="text-[9px] font-mono font-bold tracking-wider text-blue-400 uppercase mt-0.5">
              CASES
            </span>
          </div>
        </div>

        {/* Glassmorphic Legend Item Cards with Shaded Progress Bars */}
        <div className="space-y-3">
          {data.map((item) => {
            const style = CATEGORY_STYLE_MAP[item.category] || DEFAULT_STYLE;
            return (
              <div
                key={item.category}
                className="bg-slate-900/40 border border-slate-800/50 rounded-none p-2.5 backdrop-blur-sm hover:border-slate-700/60 transition-all shadow-sm space-y-2"
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: style.color, boxShadow: `0 0 6px ${style.color}` }}
                    />
                    <span className="font-bold text-slate-200 uppercase tracking-wide text-[10px]">
                      {item.category}
                    </span>
                  </div>
                  <div className="text-slate-400 font-mono text-[10px]">
                    <span className="text-white font-bold">{item.fir_count.toLocaleString("en-IN")} FIRs</span>
                    <span className="text-slate-600 px-1.5">•</span>
                    <span className="text-emerald-400 font-bold">{item.percentage}%</span>
                  </div>
                </div>

                {/* Shaded Gradient Progress Bar */}
                <div className="h-1.5 w-full rounded-none bg-slate-950/80 overflow-hidden border border-slate-800/40">
                  <div
                    className="h-full rounded-none transition-all duration-700"
                    style={{
                      width: `${item.percentage}%`,
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
    </ChartCard>
  );
};

export default CrimeCategoryChart;