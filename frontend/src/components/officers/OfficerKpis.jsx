import React from "react";
import {
  FaFolderOpen,
  FaSearch,
  FaCheckCircle,
  FaGavel,
  FaRegClock,
  FaUserLock
} from "react-icons/fa";

const OfficerKpis = ({ kpis }) => {
  if (!kpis) return null;

  const cardData = [
    {
      title: "Total Assigned",
      value: kpis.totalCases,
      color: "text-blue-400",
      borderColor: "border-blue-500",
      icon: FaFolderOpen,
      sub: "All-time history"
    },
    {
      title: "Active Tasks",
      value: kpis.activeCases,
      color: "text-amber-400",
      borderColor: "border-amber-500",
      icon: FaSearch,
      sub: "Active dossiers"
    },
    {
      title: "Cases Closed",
      value: kpis.closedCases,
      color: "text-emerald-400",
      borderColor: "border-emerald-500",
      icon: FaCheckCircle,
      sub: "Resolved cases"
    },
    {
      title: "Charge Rate (IIF-5)",
      value: `${kpis.chargesheetRate}%`,
      color: "text-purple-400",
      borderColor: "border-purple-500",
      icon: FaGavel,
      sub: "Court filings"
    },
    {
      title: "Avg Resolution",
      value: `${kpis.avgInvestigationTime} Days`,
      color: "text-cyan-400",
      borderColor: "border-cyan-500",
      icon: FaRegClock,
      sub: "Cycle duration"
    },
    {
      title: "Detection Rate",
      value: `${kpis.detectionRate}%`,
      color: "text-rose-400",
      borderColor: "border-rose-500",
      icon: FaUserLock,
      sub: "Identifications"
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {cardData.map((card) => {
        const Icon = card.icon;
        
        return (
          <div
            key={card.title}
            className={`h-[110px] rounded-[4px] border border-slate-800 bg-slate-900/60 pt-5 pb-5 px-5 transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/90 border-l-4 ${card.borderColor} shadow-md flex flex-col justify-between`}
          >
            <div className="flex items-start justify-between">
              <span className="text-[9px] font-semibold tracking-wider text-slate-400 uppercase">
                {card.title}
              </span>
              <div className={`rounded-lg bg-slate-800/40 p-1.5 ${card.color}`}>
                <Icon className="text-xs" />
              </div>
            </div>
            <div className="mt-2 leading-none">
              <h2 className="font-mono text-xl sm:text-2xl font-bold tracking-tight text-white leading-none">
                {card.value}
              </h2>
              <span className="text-[8px] font-mono text-slate-500 block mt-1 uppercase tracking-wider">
                {card.sub}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OfficerKpis;
