import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble";
import { RiRobot2Fill } from "react-icons/ri";
import { FaBolt } from "react-icons/fa";

const ChatWindow = ({ messages, isTyping }) => {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{
        minHeight: 0,
        padding: "28px 36px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "18px",
        scrollbarWidth: "thin",
        scrollbarColor: "rgba(51,65,85,0.3) transparent",
      }}
    >
      {messages.length === 0 ? (
        /* ── Empty / Welcome State ── */
        <div className="flex flex-col items-center justify-center flex-1 py-12 gap-6 text-center select-none">
          <div
            className="flex items-center justify-center rounded-2xl"
            style={{
              width: 72,
              height: 72,
              background: "linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(124,58,237,0.2) 100%)",
              border: "1px solid rgba(37,99,235,0.3)",
              boxShadow: "0 0 40px rgba(37,99,235,0.12)",
            }}
          >
            <RiRobot2Fill className="text-4xl text-blue-400" />
          </div>

          <div className="space-y-2">
            <h3
              className="text-xl font-bold text-white font-space"
              style={{ letterSpacing: "-0.02em" }}
            >
              KSP AI Copilot
            </h3>
            <p className="text-sm text-slate-400 font-inter leading-relaxed max-w-sm">
              Connected to the live CCTNS database. Ask me anything about crime data,
              FIR records, officers, or district-level statistics.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: "CCTNS Live", color: "#22c55e" },
              { label: "QuickML v4.2", color: "#a78bfa" },
              { label: "45 FIR records", color: "#60a5fa" },
            ].map((badge) => (
              <span
                key={badge.label}
                className="flex items-center gap-1.5 text-xs font-mono font-semibold px-3 py-1.5 rounded-full"
                style={{
                  color: badge.color,
                  background: `${badge.color}15`,
                  border: `1px solid ${badge.color}30`,
                }}
              >
                <FaBolt className="text-[9px]" />
                {badge.label}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <>
          {messages.map((msg, index) => (
            <MessageBubble key={index} message={msg} />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 items-end mt-3">
              <div
                className="flex-shrink-0 flex items-center justify-center rounded-xl"
                style={{
                  width: 36,
                  height: 36,
                  background: "linear-gradient(135deg, rgba(37,99,235,0.2) 0%, rgba(124,58,237,0.2) 100%)",
                  border: "1px solid rgba(37,99,235,0.3)",
                }}
              >
                <RiRobot2Fill className="text-base text-blue-400" />
              </div>
              <div
                className="flex items-center gap-1.5 px-5 py-3.5 rounded-2xl rounded-bl-sm"
                style={{
                  background: "rgba(15,23,42,0.8)",
                  border: "1px solid rgba(51,65,85,0.4)",
                }}
              >
                {[0, 150, 300].map((delay) => (
                  <span
                    key={delay}
                    className="h-2.5 w-2.5 rounded-full bg-blue-400 animate-bounce"
                    style={{ animationDelay: `${delay}ms` }}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500 font-inter mb-1">Analyzing…</span>
            </div>
          )}
        </>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
