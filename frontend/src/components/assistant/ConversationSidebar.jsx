import React from "react";
import { FaPlus } from "react-icons/fa";
import { RiChatHistoryLine } from "react-icons/ri";

const ConversationSidebar = ({ sessions, activeSessionId, onSelectSession, onNewSession }) => {
  return (
    <div className="flex flex-col h-full overflow-hidden font-sans">
      {/* New session button */}
      <div className="px-5 pt-5 pb-3.5 flex-shrink-0">
        <button
          onClick={onNewSession}
          className="w-full flex items-center justify-center gap-2 rounded-none py-2.5 px-4 text-xs font-bold font-mono transition-all cursor-pointer bg-blue-600/25 hover:bg-blue-600/40 border border-blue-500/40 text-blue-300 hover:text-white shadow-sm"
        >
          <FaPlus className="text-[10px]" />
          <span>New Session</span>
        </button>
      </div>

      {/* Section label */}
      <div className="px-5 pb-2.5 flex-shrink-0">
        <div className="flex items-center gap-2 pl-1.5">
          <RiChatHistoryLine className="text-xs text-slate-400" />
          <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-slate-400">
            Recent
          </span>
        </div>
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto px-4 pb-3.5 space-y-2.5 scrollbar-thin">
        {sessions.map((session) => {
          const isActive = session.id === activeSessionId;
          return (
            <button
              key={session.id}
              onClick={() => onSelectSession(session.id)}
              className={`w-full text-left rounded-none transition-all duration-150 cursor-pointer border ${
                isActive 
                  ? "bg-slate-800/90 border-blue-500/50 shadow-sm" 
                  : "bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/60 hover:border-slate-700/80"
              }`}
              style={{ padding: "10px 14px" }}
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="text-xs font-semibold font-sans truncate leading-snug"
                  style={{ color: isActive ? "#93c5fd" : "#cbd5e1" }}
                >
                  {session.title}
                </span>
                {session.status === "active" && (
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                )}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block font-mono">
                {session.timestamp}
              </span>
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div
        className="px-5 py-3.5 flex-shrink-0 flex items-center justify-between font-mono"
        style={{ borderTop: "1px solid rgba(51,65,85,0.4)" }}
      >
        <span className="text-[10px] text-slate-400">{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
        <span className="text-[10px] text-emerald-400 font-semibold">1 active</span>
      </div>
    </div>
  );
};

export default ConversationSidebar;
