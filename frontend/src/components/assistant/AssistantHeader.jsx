import React from "react";
import { FaBrain } from "react-icons/fa";

const AssistantHeader = () => {
  return (
    <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-xl flex items-center gap-4 shadow-sm">
      <div className="h-10 w-10 rounded-lg bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
        <FaBrain className="text-xl animate-pulse" />
      </div>
      <div>
        <h1 className="text-lg font-bold text-white tracking-tight">
          Police Intelligence Assistant
        </h1>
        <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">
          Ask queries about CCTNS CaseMaster records, request district-level crime trends, or review investigating officer workloads.
        </p>
      </div>
    </div>
  );
};

export default AssistantHeader;
