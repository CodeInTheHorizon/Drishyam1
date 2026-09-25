import React, { useState } from "react";
import { FaBell, FaExclamationTriangle, FaCheck, FaAngleRight } from "react-icons/fa";
import { triggerAction } from "../../services/dashboardService";

const AIAlertsList = ({ alerts, onAlertHandled }) => {
  const [loadingAlertId, setLoadingAlertId] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState(alerts || []);

  const handleAction = async (alertId, actionName) => {
    setLoadingAlertId(alertId);
    try {
      await triggerAction("ai_alert_action", { alertId, action: actionName });
      
      // Simulate removing/updating the alert local state on dismissal
      if (actionName === "dismiss") {
        setActiveAlerts((prev) => prev.filter((a) => a.alert_id !== alertId));
      } else {
        setActiveAlerts((prev) =>
          prev.map((a) =>
            a.alert_id === alertId ? { ...a, status: "INVESTIGATING" } : a
          )
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAlertId(null);
    }
  };

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return {
          bg: "bg-red-950/20",
          border: "border-red-900/40 border-l-red-500",
          text: "text-red-400",
          badge: "bg-red-500/10 text-red-400 border border-red-500/20"
        };
      case "HIGH":
        return {
          bg: "bg-amber-950/20",
          border: "border-amber-900/40 border-l-amber-500",
          text: "text-amber-400",
          badge: "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        };
      case "MEDIUM":
      default:
        return {
          bg: "bg-blue-950/20",
          border: "border-blue-900/40 border-l-blue-500",
          text: "text-blue-400",
          badge: "bg-blue-500/10 text-blue-400 border border-blue-500/20"
        };
    }
  };

  return (
    <div className="rounded-[4px] border border-slate-800/25 bg-slate-900/50 p-7 flex flex-col h-[520px]">
      <div className="flex items-center justify-between border-b border-slate-800/25 pb-4 mb-5">
        <div className="flex items-center gap-2">
          <FaBell className="text-blue-400/80 text-base" />
          <h2 className="text-[11px] font-bold text-white uppercase tracking-widest font-mono">
            AI Pattern Alerts
          </h2>
        </div>
        <span className="rounded-[3px] bg-slate-900/60 border border-slate-800/20 px-2.5 py-1 font-mono text-[9px] text-slate-600 uppercase tracking-wider">
          {activeAlerts.length} Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {activeAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 font-mono text-xs">
            <FaCheck className="text-lg text-slate-600 mb-2" />
            No active threat alerts registered.
          </div>
        ) : (
          activeAlerts.map((alert) => {
            const styles = getSeverityStyles(alert.severity);
            const isProcessing = loadingAlertId === alert.alert_id;

            return (
              <div
                key={alert.alert_id}
                className={`rounded-[4px] border border-l-4 p-4 transition-all duration-200 ${styles.bg} ${styles.border}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-sm px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-wider ${styles.badge}`}>
                      {alert.severity}
                    </span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {alert.alert_id}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">
                    {alert.timestamp}
                  </span>
                </div>

                <p className="mt-2 text-xs leading-relaxed text-slate-300">
                  {alert.message}
                </p>

                <div className="mt-2.5 font-mono text-[9px] text-slate-500">
                  JURISDICTION: <span className="text-slate-400">{alert.impacted_jurisdiction}</span>
                </div>

                {alert.correlated_cases && alert.correlated_cases.length > 0 && (
                  <div className="mt-1 flex flex-wrap items-center gap-1 font-mono text-[9px] text-slate-500">
                    <span>CORRELATED CRIMENO:</span>
                    {alert.correlated_cases.map((c) => (
                      <span key={c} className="rounded bg-slate-800/80 px-1 text-slate-400 border border-slate-700/50">
                        {c}
                      </span>
                    ))}
                  </div>
                )}

                {/* Inline Action Controls */}
                <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-800/60 pt-2.5">
                  {alert.status === "INVESTIGATING" ? (
                    <span className="text-[10px] font-mono text-amber-500 flex items-center gap-1">
                      <FaExclamationTriangle className="text-[9px]" /> INVESTIGATION UNDERWAY
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAction(alert.alert_id, "dismiss")}
                        disabled={isProcessing}
                        className="rounded border border-slate-800 bg-slate-900 hover:bg-slate-850 hover:text-white px-2 py-1 font-mono text-[10px] text-slate-400 transition-colors disabled:opacity-50"
                      >
                        Dismiss
                      </button>
                      <button
                        onClick={() => handleAction(alert.alert_id, "investigate")}
                        disabled={isProcessing}
                        className="rounded bg-blue-600 hover:bg-blue-700 px-2 py-1 font-mono text-[10px] text-white flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        Investigate <FaAngleRight className="text-[8px]" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AIAlertsList;
