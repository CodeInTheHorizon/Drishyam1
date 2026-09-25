const ChartCard = ({ title, subtitle, badge, action, centerTitle = false, className = "", children }) => {
  return (
    <div 
      className={`rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl ${className}`}
      style={{ padding: "22px 24px" }}
    >
      <div className={`mb-6 flex flex-wrap items-center ${centerTitle && !action && !badge ? "justify-center text-center" : "justify-between"} gap-4 w-full`}>
        <div className={`flex flex-col ${centerTitle ? "items-center text-center w-full" : "items-start"}`}>
          <h2 className={`text-[10px] font-bold uppercase tracking-[0.18em] text-white font-mono ${centerTitle ? "text-center" : ""}`}>
            {title}
          </h2>

          {subtitle && (
            <p className="mt-1 text-[11px] text-slate-400 leading-relaxed font-sans">
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="flex-shrink-0">{action}</div>}

        {badge && (
          <span className="rounded-sm bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 text-[10px] font-bold text-emerald-400 font-mono">
            {badge}
          </span>
        )}
      </div>

      {children}
    </div>
  );
};

export default ChartCard;