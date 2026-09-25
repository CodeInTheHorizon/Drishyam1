import React from "react";
import {
  FaFileSignature,
  FaMapMarkedAlt,
  FaUserTie,
  FaFolderOpen,
  FaClipboardList,
  FaChartLine,
  FaCalendarAlt
} from "react-icons/fa";

const iconMap = {
  FaFileSignature,
  FaMapMarkedAlt,
  FaUserTie,
  FaFolderOpen,
  FaClipboardList,
  FaChartLine,
  FaCalendarAlt
};

const ReportTemplates = ({ templates, activeTemplateId, onSelectTemplate }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-850 pb-3 mb-1">
        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
          Select Intelligence Template
        </h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {templates.map((t) => {
          const Icon = iconMap[t.icon] || FaFileSignature;
          const isActive = t.id === activeTemplateId;
          
          return (
            <button
              key={t.id}
              onClick={() => onSelectTemplate(t.id)}
              className={`flex flex-col text-left p-4 rounded-xl border transition-all duration-300 group cursor-pointer h-full justify-between ${
                isActive
                  ? "bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-500/5"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white"
              }`}
            >
              <div>
                <div className={`flex items-center justify-center h-8 w-8 rounded-lg border transition-colors ${
                  isActive 
                    ? "bg-slate-950 border-blue-500/40 text-blue-400"
                    : "bg-slate-950 border-slate-800 text-slate-500 group-hover:text-slate-300"
                }`}>
                  <Icon className="text-sm" />
                </div>
                <span className="font-mono text-[11px] font-bold text-slate-200 mt-3 block group-hover:text-white transition-colors">
                  {t.title}
                </span>
                <p className="text-[10px] leading-relaxed text-slate-400 font-sans mt-1.5 line-clamp-2">
                  {t.desc}
                </p>
              </div>

              <div className="mt-4 pt-2.5 border-t border-slate-800/40 w-full flex items-center justify-between text-[9px] font-mono tracking-widest text-slate-500 group-hover:text-current uppercase transition-colors">
                <span>SELECT TEMPLATE</span>
                <span>→</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ReportTemplates;
