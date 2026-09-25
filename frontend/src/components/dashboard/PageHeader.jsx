import { useState, useEffect } from "react";

const PageHeader = ({ title, subtitle, action, children }) => {
  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const [secondsAgo, setSecondsAgo] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsAgo((s) => s + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const liveLabel =
    secondsAgo < 60
      ? `Updated ${secondsAgo}s ago`
      : `Updated ${Math.floor(secondsAgo / 60)}m ago`;

  return (
    <div 
      className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 bg-slate-900/85 border border-slate-700/60 rounded-md backdrop-blur-md shadow-xl animate-fade-in-up"
      style={{ padding: "22px 24px" }}
    >
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-none">
          {title}
        </h1>

        <p className="mt-1.5 text-xs text-slate-300 font-sans leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      </div>

      {/* Right meta group */}
      <div className="flex flex-wrap items-center gap-5 sm:gap-6 self-start md:self-auto flex-shrink-0 font-mono pr-1">
        {/* Live status */}
        <div className="flex items-center gap-2 text-[10px]">
          <span className="live-dot h-2 w-2 rounded-full bg-emerald-400 inline-block flex-shrink-0 animate-pulse" />
          <div className="flex flex-col leading-none">
            <span className="font-bold text-emerald-400 tracking-wider">LIVE FEED</span>
            <span className="text-slate-400 mt-0.5 text-[8.5px]">{liveLabel}</span>
          </div>
        </div>

        <div className="h-5 w-px bg-slate-700/60" />

        {/* Date */}
        <div className="text-[11px] text-slate-300">
          {today}
        </div>

        {(action || children) && (
          <>
            <div className="h-5 w-px bg-slate-700/60" />
            <div className="flex items-center">
              {action || children}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PageHeader;