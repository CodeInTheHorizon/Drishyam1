import React, { useState } from "react";
import { 
  FaMapMarkedAlt, 
  FaShieldAlt, 
  FaLaptopCode, 
  FaUserShield, 
  FaBalanceScale, 
  FaFileAlt,
  FaChartPie,
  FaClock,
  FaFilter,
  FaLanguage
} from "react-icons/fa";

const CATEGORIES = [
  { id: "all", label: "All Questions" },
  { id: "districts", label: "Districts & Hotspots" },
  { id: "cyber", label: "Cyber & Financial Fraud" },
  { id: "officers", label: "Officer Performance" },
  { id: "briefing", label: "Command Briefings" }
];

const PROMPTS = [
  {
    category: "districts",
    text: "Summarize crime distribution across Bhopal & Indore",
    desc: "Spatial analysis of property, violent, and cyber offenses across MP's key urban centers",
    icon: FaMapMarkedAlt,
    iconColor: "#60a5fa",
    iconBg: "rgba(37,99,235,0.12)",
    borderHover: "rgba(37,99,235,0.4)",
  },
  {
    category: "districts",
    text: "Identify critical crime hotspots and high-risk zones in MP",
    desc: "Active GIS density mapping, recurring crime corridors, and red-zone alerts",
    icon: FaShieldAlt,
    iconColor: "#f87171",
    iconBg: "rgba(239,68,68,0.12)",
    borderHover: "rgba(239,68,68,0.4)",
  },
  {
    category: "cyber",
    text: "Explain recent cyber fraud vectors and prevention roadmap",
    desc: "Telemetry on AePS fingerprint cloning, fake utility bill SMS, and AI voice cloning scams",
    icon: FaLaptopCode,
    iconColor: "#c084fc",
    iconBg: "rgba(124,58,237,0.12)",
    borderHover: "rgba(124,58,237,0.4)",
  },
  {
    category: "officers",
    text: "Evaluate investigating officer workload and case clearance",
    desc: "Detection rates, chargesheet timelines (IIF-5), and active docket load across MP officers",
    icon: FaUserShield,
    iconColor: "#34d399",
    iconBg: "rgba(34,197,94,0.12)",
    borderHover: "rgba(34,197,94,0.4)",
  },
  {
    category: "districts",
    text: "Compare crime statistics between Bhopal and Indore divisions",
    desc: "Side-by-side comparative analysis of FIR volumes, chargesheet rates, and resolution metrics",
    icon: FaBalanceScale,
    iconColor: "#fbbf24",
    iconBg: "rgba(245,158,11,0.12)",
    borderHover: "rgba(245,158,11,0.4)",
  },
  {
    category: "briefing",
    text: "Draft an executive crime intelligence briefing for DGP",
    desc: "Confidential high-level command brief with strategic threat assessments and resource allocations",
    icon: FaFileAlt,
    iconColor: "#818cf8",
    iconBg: "rgba(99,102,241,0.12)",
    borderHover: "rgba(99,102,241,0.4)",
  },
  {
    category: "districts",
    text: "What are the most common crime categories reported this year?",
    desc: "Breakdown across Cyber Offenses, Property/Theft, Financial Fraud, and Body Crimes",
    icon: FaChartPie,
    iconColor: "#38bdf8",
    iconBg: "rgba(56,189,248,0.12)",
    borderHover: "rgba(56,189,248,0.4)",
  },
  {
    category: "officers",
    text: "Show status of pending vs resolved FIR investigations",
    desc: "Investigation lifecycle, pending chargesheet compliance, and case disposal ratios",
    icon: FaClock,
    iconColor: "#fb7185",
    iconBg: "rgba(251,113,133,0.12)",
    borderHover: "rgba(251,113,133,0.4)",
  },
];

const SuggestedPrompts = ({ onPromptClick }) => {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredPrompts = selectedCategory === "all"
    ? PROMPTS
    : PROMPTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="space-y-3">
      {/* Category Pills and Language Tag */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
          <span className="text-[11px] font-bold font-inter text-slate-400 mr-1 flex items-center gap-1">
            <FaFilter className="text-[9px] text-cyan-400" /> Prompts:
          </span>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-500/30"
                  : "bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/40 border border-cyan-800/40 px-2 py-0.5 rounded-md self-start sm:self-auto">
          <FaLanguage className="text-xs" />
          <span>Supports English & हिन्दी</span>
        </div>
      </div>

      {/* Suggested Questions Grid */}
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {filteredPrompts.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.text}
              onClick={() => onPromptClick(p.text)}
              className="flex items-start gap-3.5 text-left p-4 sm:p-4.5 rounded-xl transition-all duration-200 cursor-pointer group"
              style={{
                background: "rgba(10,18,30,0.65)",
                border: "1px solid rgba(51,65,85,0.4)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = p.borderHover;
                e.currentTarget.style.background = "rgba(15,23,42,0.95)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(51,65,85,0.4)";
                e.currentTarget.style.background = "rgba(10,18,30,0.65)";
                e.currentTarget.style.transform = "translateY(0)";
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-xl mt-0.5"
                style={{
                  width: 36,
                  height: 36,
                  background: p.iconBg,
                  border: `1px solid ${p.iconColor}35`,
                }}
              >
                <Icon style={{ color: p.iconColor, fontSize: 14 }} />
              </div>
              <div className="min-w-0 pl-0.5">
                <p className="text-[13px] font-semibold text-white leading-snug font-inter group-hover:text-cyan-300 transition-colors">
                  {p.text}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-inter line-clamp-2">
                  {p.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SuggestedPrompts;
