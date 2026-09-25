import React from "react";
import { FaHdd, FaLink, FaFolderMinus, FaCheckCircle, FaSatelliteDish, FaHistory } from "react-icons/fa";

const RecentReports = ({ recentReports, generationQueue, onDownload }) => {
  const browserStatus = [
    { name: "SmartBrowz Server", status: "ONLINE", color: "text-emerald-400" },
    { name: "Stratus Engine", status: "READY", color: "text-blue-400" },
    { name: "Catalyst Functions", status: "ACTIVE", color: "text-emerald-400" }
  ];

  return (
    <div className="bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl p-6 flex flex-col h-[750px] space-y-6">
      
      {/* 1. Infrastructure Status */}
      <div className="space-y-3">
        <div 
          className="flex items-center gap-2.5 border-b border-slate-800/40"
          style={{ paddingLeft: "12px", paddingTop: "8px", paddingBottom: "12px", marginBottom: "14px" }}
        >
          <FaSatelliteDish className="text-blue-400 text-sm" />
          <span className="text-[10px] font-space font-bold tracking-wider text-slate-400 uppercase">
            PDF Renderer Status
          </span>
        </div>
        <div className="space-y-2 font-mono text-[9px] leading-normal">
          {browserStatus.map((node) => (
            <div key={node.name} className="flex justify-between items-center bg-slate-950/50 rounded-lg border border-slate-900/60" style={{ padding: "10px 14px" }}>
              <span className="text-slate-400 font-semibold" style={{ paddingLeft: "4px" }}>{node.name}</span>
              <div className="flex items-center gap-1.5" style={{ paddingRight: "4px" }}>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={`${node.color} font-bold`}>{node.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Active Compilation Queue */}
      <div className="space-y-3">
        <div 
          className="flex items-center gap-2.5 border-b border-slate-800/40"
          style={{ paddingLeft: "12px", paddingTop: "8px", paddingBottom: "12px", marginBottom: "14px" }}
        >
          <FaHdd className="text-blue-400 text-sm" />
          <span className="text-[10px] font-space font-bold tracking-wider text-slate-400 uppercase">
            Generation Queue
          </span>
        </div>
        <div className="space-y-2 font-mono text-[9px]">
          {generationQueue && generationQueue.length > 0 ? (
            generationQueue.map((item, index) => (
              <div key={index} className="flex justify-between items-center bg-blue-950/20 rounded-lg border border-blue-900/40 text-blue-300" style={{ padding: "10px 14px" }}>
                <span className="truncate max-w-[120px] font-bold" style={{ paddingLeft: "4px" }}>{item.title}</span>
                <span className="animate-pulse" style={{ paddingRight: "4px" }}>Compiling...</span>
              </div>
            ))
          ) : (
            <div className="text-center py-4 text-slate-700 italic text-[9px] bg-slate-950/20 rounded-lg border border-slate-900/20" style={{ paddingLeft: "12px", paddingRight: "12px" }}>
              Queue is idle
            </div>
          )}
        </div>
      </div>

      {/* 3. Compiled Documents List */}
      <div className="flex-1 space-y-3 flex flex-col min-h-0">
        <div 
          className="flex items-center gap-2.5 border-b border-slate-800/40"
          style={{ paddingLeft: "12px", paddingTop: "8px", paddingBottom: "12px", marginBottom: "14px" }}
        >
          <FaFolderMinus className="text-blue-400 text-sm" />
          <span className="text-[10px] font-space font-bold tracking-wider text-slate-400 uppercase">
            Recent Generated files
          </span>
        </div>
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 scrollbar-thin">
          {recentReports.map((rep) => (
            <button
              key={rep.id}
              onClick={() => onDownload(rep)}
              className="w-full flex flex-col rounded-lg border border-slate-900/50 bg-slate-950/50 text-left hover:border-slate-800 transition-colors font-mono leading-normal cursor-pointer group"
              style={{ padding: "12px 14px" }}
            >
              <div className="flex justify-between items-center w-full gap-2">
                <span className="font-bold text-[10px] text-slate-300 truncate group-hover:text-blue-400 transition-colors" style={{ paddingLeft: "4px" }}>
                  {rep.title}
                </span>
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                  rep.type === "PDF" ? "bg-red-950/45 text-red-400 border border-red-900/20" : "bg-emerald-950/45 text-emerald-400 border border-emerald-900/20"
                }`}>
                  {rep.type}
                </span>
              </div>
              <div className="flex justify-between items-center text-[8px] text-slate-500 mt-2" style={{ paddingLeft: "4px" }}>
                <span>{rep.date}</span>
                <span>{rep.size}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Audit History Logs */}
      <div className="space-y-3">
        <div 
          className="flex items-center gap-2.5 border-b border-slate-800/40"
          style={{ paddingLeft: "12px", paddingTop: "8px", paddingBottom: "12px", marginBottom: "14px" }}
        >
          <FaHistory className="text-blue-400 text-sm" />
          <span className="text-[10px] font-space font-bold tracking-wider text-slate-400 uppercase">
            Audit Trails (Export History)
          </span>
        </div>
        <div className="space-y-1.5 font-mono text-[8px] text-slate-400 leading-normal bg-slate-950/20 rounded-lg border border-slate-900/40 max-h-24 overflow-y-auto scrollbar-thin" style={{ padding: "12px 14px" }}>
          <div className="truncate" style={{ paddingLeft: "4px" }}>✓ EXPORT_PDF: rep-101 (Success)</div>
          <div className="truncate" style={{ paddingLeft: "4px" }}>✓ EXPORT_EXCEL: rep-102 (Success)</div>
          <div className="truncate" style={{ paddingLeft: "4px" }}>✓ SHARE_LOG: Sent to ACP Rajeshwari</div>
          <div className="truncate" style={{ paddingLeft: "4px" }}>✓ AUTO_ARCHIVE: Backup stored in DG-Grid</div>
        </div>
      </div>

    </div>
  );
};

export default RecentReports;
