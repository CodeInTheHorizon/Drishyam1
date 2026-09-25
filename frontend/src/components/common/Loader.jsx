import React from "react";

const Loader = ({ message = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4 rounded-xl border border-slate-800 bg-slate-900/40">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-700 border-t-purple-500" />
      <p className="font-mono text-xs font-semibold uppercase tracking-wider text-slate-400">
        {message}
      </p>
    </div>
  );
};

export default Loader;
