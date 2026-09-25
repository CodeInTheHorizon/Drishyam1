import React, { useState } from "react";
import { FaInfoCircle, FaArrowUp, FaArrowDown } from "react-icons/fa";

/* ── Inline SVG sparkline ─────────────────────────────────────────── */
const Sparkline = ({ data, color, id }) => {
  if (!data || data.length < 2) return null;
  const W = 100, H = 28;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: H - ((v - min) / range) * H * 0.85,
  }));

  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L ${W},${H} L 0,${H} Z`;
  const last = pts[pts.length - 1];
  const gradId = `sg-${id}`;

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      overflow="visible"
      className="w-full"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${gradId})`} />
      <path
        d={linePath}
        stroke={color}
        strokeWidth="1.8"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r="2.5" fill={color} />
    </svg>
  );
};

/* ── StatCard ─────────────────────────────────────────────────────── */
const StatCard = ({
  title,
  value,
  change,
  icon: Icon,
  color = "text-blue-500",
  borderColor = "border-blue-500",
  lastSync,
  dataSource,
  coverage,
  subText,
  sparkData,
  sparkColor,
}) => {
  const [showMetadata, setShowMetadata] = useState(false);

  const sparkId = (title || "card").replace(/[^a-z0-9]/gi, "").toLowerCase();
  const isPositive = !String(change).startsWith("-");

  // Sanitize operational metadata fields to prevent any "undefined" display
  const cleanDataSource = (!dataSource || String(dataSource).includes("undefined"))
    ? "CaseMaster (Catalyst Datastore)"
    : dataSource;
  const cleanCoverage = (!coverage || String(coverage).includes("undefined"))
    ? "Statewide Active Units (CCTNS Datastore)"
    : coverage;
  const cleanLastSync = (!lastSync || String(lastSync).includes("undefined"))
    ? "Real-Time Synced"
    : lastSync;

  // Extract color hex from Tailwind class for accent line
  const accentHex =
    color.includes("blue") ? "#3b82f6" :
      color.includes("amber") ? "#f59e0b" :
        color.includes("emerald") ? "#10b981" :
          color.includes("rose") ? "#f43f5e" : "#3b82f6";

  return (
    <div
      className="relative overflow-hidden rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl transition-all duration-200 ease-in-out hover:border-slate-600 hover:bg-slate-800/80 hover:-translate-y-0.5 flex flex-col font-sans"
      style={{ padding: "20px 22px" }}
      onMouseEnter={() => setShowMetadata(true)}
      onMouseLeave={() => setShowMetadata(false)}
    >

      {/* Card body */}
      <div className="flex flex-col items-center justify-center gap-2.5 text-center font-sans">

        {/* ── Row 1: Label + Icon ── */}
        <div className="flex items-center justify-center gap-2 w-full text-center">
          <span
            className="text-xs font-semibold text-slate-300 leading-snug font-sans text-center"
          >
            {title}
          </span>
          <div className={`flex-shrink-0 rounded border border-slate-800/40 bg-slate-800/30 p-2 ${color}`}>
            {Icon ? <Icon className="text-xs sm:text-sm" /> : <FaInfoCircle className="text-xs sm:text-sm" />}
          </div>
        </div>

        {/* Metric value */}
        <div className="my-0.5 text-center w-full">
          <span
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-none tabular-nums font-sans"
          >
            {value}
          </span>
        </div>

        {/* Change */}
        <div className="flex items-center justify-center gap-2 w-full text-center">
          <div className={`flex items-center gap-1 text-[11px] font-semibold ${isPositive ? "text-emerald-400" : "text-red-400"}`}>
            {isPositive
              ? <FaArrowUp className="text-[9px]" />
              : <FaArrowDown className="text-[9px]" />}
            <span>{change}</span>
          </div>
        </div>
      </div>

      <div
        className={`absolute inset-0 flex flex-col justify-between bg-slate-950/97 p-6 text-center transition-all duration-200 ease-in-out ${showMetadata
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-3 pointer-events-none"
          }`}
      >


        <div>
          <div className="flex items-center justify-center gap-1.5 border-b border-slate-800/50 pb-2 mb-3">
            <FaInfoCircle className="text-[10px] text-blue-400/80" />
            <span
              className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono"
            >
              Operational Metadata
            </span>
          </div>

          <div className="space-y-2.5">
            <div>
              <span
                className="text-[9px] text-slate-500 block uppercase tracking-wider mb-0.5 font-semibold font-mono"
              >
                SOURCE
              </span>
              <span
                className="text-[11px] text-slate-300 font-mono font-medium"
              >
                {cleanDataSource}
              </span>
            </div>
            <div>
              <span
                className="text-[9px] text-slate-500 block uppercase tracking-wider mb-0.5 font-semibold font-mono"
              >
                JURISDICTION
              </span>
              <span
                className="text-[11px] text-slate-300 font-sans font-medium"
              >
                {cleanCoverage}
              </span>
            </div>
          </div>
        </div>

        <div
          className="flex flex-col items-center justify-center gap-0.5 border-t border-slate-800/50 pt-2"
        >
          <span
            className="text-[9px] text-slate-500 uppercase tracking-wider font-semibold font-mono"
          >
            LAST SYNC
          </span>
          <span
            className="text-[10px] text-slate-400 font-mono font-medium"
          >
            {cleanLastSync}
          </span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;