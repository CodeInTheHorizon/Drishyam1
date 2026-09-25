import React from "react";
import { FaDatabase, FaSatelliteDish, FaInfoCircle, FaHdd, FaLink } from "react-icons/fa";

const ContextPanel = ({ recentQueries }) => {
  const dataSources = [
    { name: "CCTNS Crime Datastore", status: "SYNCED", count: "14,832 FIRs" },
    { name: "Officer Master Profiles", status: "SYNCED", count: "1,024 Records" },
    { name: "CaseMaster Activity Logs", status: "REAL-TIME", count: "Active Sync" },
    { name: "Zia NLP Classification", status: "ONLINE", count: "NLP v2" }
  ];

  const systemIndicators = [
    { name: "Catalyst Gateway", status: "CONNECTED", color: "text-emerald-400" },
    { name: "QuickML Engine", status: "ONLINE", color: "text-blue-400" },
    { name: "Zia Intelligence", status: "READY", color: "text-purple-400" }
  ];

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col h-[650px] shadow-lg space-y-5">
      
      {/* 1. System Status Indicators */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <FaSatelliteDish className="text-blue-400 text-sm" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            System Infrastructure
          </span>
        </div>
        <div className="space-y-2 font-mono text-[9px] leading-normal">
          {systemIndicators.map((sys) => (
            <div key={sys.name} className="flex justify-between items-center bg-slate-950/40 p-2 rounded-lg border border-slate-900">
              <span className="text-slate-400 font-semibold">{sys.name}</span>
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`${sys.color} font-bold`}>{sys.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Connected Data Sources */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <FaDatabase className="text-blue-400 text-sm" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Tactical Databases
          </span>
        </div>
        <div className="space-y-2 font-mono text-[9px] leading-normal">
          {dataSources.map((ds) => (
            <div key={ds.name} className="flex justify-between items-center bg-slate-950/20 p-2 rounded border border-slate-900/60">
              <div>
                <span className="text-slate-350 block font-semibold">{ds.name}</span>
                <span className="text-slate-550 text-[8px] block mt-0.5">{ds.count}</span>
              </div>
              <span className="text-slate-500 font-bold">{ds.status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Session Active Dossiers */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <FaInfoCircle className="text-blue-400 text-sm" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Active Query Context
          </span>
        </div>
        <div className="space-y-2 font-mono text-[9px] leading-normal">
          <div className="flex justify-between bg-slate-950/40 p-2 rounded border border-slate-900">
            <span className="text-slate-500 uppercase">Target District:</span>
            <span className="text-slate-300 font-bold">ALL KARNATAKA</span>
          </div>
          <div className="flex justify-between bg-slate-950/40 p-2 rounded border border-slate-900">
            <span className="text-slate-500 uppercase">Active Filter:</span>
            <span className="text-slate-300 font-bold">COGNIZABLE FIRS</span>
          </div>
        </div>
      </div>

      {/* 4. Recent Queries */}
      <div className="flex-1 space-y-3 flex flex-col min-h-0">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <FaHdd className="text-blue-400 text-sm" />
          <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
            Active Query Log
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin font-mono text-[9px] text-slate-500">
          {recentQueries && recentQueries.length > 0 ? (
            recentQueries.map((q, idx) => (
              <div key={idx} className="flex items-start gap-1.5 bg-slate-950/10 p-1.5 rounded truncate">
                <FaLink className="text-[8px] mt-0.5 text-slate-700" />
                <span className="truncate hover:text-slate-300 transition-colors" title={q}>
                  {q}
                </span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-slate-700 italic">No queries executed</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default ContextPanel;
