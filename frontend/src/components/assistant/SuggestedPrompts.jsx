import React from "react";
import { FaMapMarked, FaShieldAlt, FaFolderPlus, FaUserTie, FaExchangeAlt, FaFileSignature } from "react-icons/fa";

const PROMPTS = [
  {
    text: "Summarize crimes in Bengaluru City",
    desc: "Spatial overview of property and cyber offences",
    icon: FaMapMarked,
    iconColor: "#60a5fa",
    iconBg: "rgba(37,99,235,0.12)",
    borderHover: "rgba(37,99,235,0.4)",
  },
  {
    text: "Show high-risk districts",
    desc: "Rank incident levels across Karnataka GIS zones",
    icon: FaShieldAlt,
    iconColor: "#f87171",
    iconBg: "rgba(239,68,68,0.12)",
    borderHover: "rgba(239,68,68,0.4)",
  },
  {
    text: "Explain recent cyber fraud trends",
    desc: "Phishing vectors and digital forensic roadmap",
    icon: FaFolderPlus,
    iconColor: "#c084fc",
    iconBg: "rgba(124,58,237,0.12)",
    borderHover: "rgba(124,58,237,0.4)",
  },
  {
    text: "Generate officer performance summary",
    desc: "Closure and detection rates of investigating officers",
    icon: FaUserTie,
    iconColor: "#34d399",
    iconBg: "rgba(34,197,94,0.12)",
    borderHover: "rgba(34,197,94,0.4)",
  },
  {
    text: "Compare crime statistics between districts",
    desc: "Side-by-side analysis of Bengaluru vs Mangaluru",
    icon: FaExchangeAlt,
    iconColor: "#fbbf24",
    iconBg: "rgba(245,158,11,0.12)",
    borderHover: "rgba(245,158,11,0.4)",
  },
  {
    text: "Draft an executive crime briefing",
    desc: "Formulate DG&IGP brief with threat vectors",
    icon: FaFileSignature,
    iconColor: "#818cf8",
    iconBg: "rgba(99,102,241,0.12)",
    borderHover: "rgba(99,102,241,0.4)",
  },
];

const SuggestedPrompts = ({ onPromptClick }) => {
  return (
    <div>
      <p className="text-[11px] font-bold font-inter text-slate-400 mb-3 px-1 tracking-wide">
        Try asking…
      </p>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
        {PROMPTS.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.text}
              onClick={() => onPromptClick(p.text)}
              className="flex items-start gap-3.5 text-left p-4 sm:p-5 rounded-xl transition-all duration-200 cursor-pointer group"
              style={{
                background: "rgba(10,18,30,0.6)",
                border: "1px solid rgba(51,65,85,0.35)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = p.borderHover;
                e.currentTarget.style.background = "rgba(15,23,42,0.9)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(51,65,85,0.35)";
                e.currentTarget.style.background = "rgba(10,18,30,0.6)";
              }}
            >
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-xl mt-0.5"
                style={{
                  width: 34,
                  height: 34,
                  background: p.iconBg,
                  border: `1px solid ${p.iconColor}30`,
                }}
              >
                <Icon style={{ color: p.iconColor, fontSize: 13 }} />
              </div>
              <div className="min-w-0 pl-1">
                <p className="text-[13px] font-semibold text-white leading-snug font-inter group-hover:text-blue-300 transition-colors">
                  {p.text}
                </p>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed font-inter">
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
