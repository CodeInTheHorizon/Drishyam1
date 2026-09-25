import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FaBrain,
  FaMapMarkedAlt,
  FaUserShield,
  FaFileExport,
  FaFingerprint,
  FaCog,
  FaTerminal,
  FaProjectDiagram,
  FaClock
} from "react-icons/fa";
import FIRFormModal from "../records/FIRFormModal";
import PINVerificationModal from "../records/PINVerificationModal";
import { triggerAction } from "../../services/dashboardService";
import { recordService } from "../../services/recordService";

const QuickActionsPanel = () => {
  const [runningAction, setRunningAction] = useState(null);
  const [isFirModalOpen, setIsFirModalOpen] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const [consoleLogs, setConsoleLogs] = useState([
    { timestamp: "14:26:00", level: "INFO", text: "CCTNS Core Application Software (CAS) v4.2 client initialized." },
    { timestamp: "14:26:02", level: "INFO", text: "QuickML Service Online. Hotspot forecasting active." },
    { timestamp: "14:26:04", level: "INFO", text: "Zia Insights Engine Active." },
    { timestamp: "14:26:06", level: "INFO", text: "Data Sync Successful across 1,024 units." },
    { timestamp: "14:26:08", level: "INFO", text: "All Systems Operational." },
  ]);

  const addLog = (text, level = "INFO") => {
    const time = new Date().toLocaleTimeString("en-IN", { hour12: false });
    setConsoleLogs((prev) =>
      [{ timestamp: time, level, text }, ...prev].slice(0, 10)
    );
  };

  const handleActionClick = async (actionId, label) => {
    if (actionId === "manage_records") {
      setIsFirModalOpen(true);
      addLog("Opening CCTNS Live FIR Registration Modal...", "INIT");
      return;
    }
    if (actionId === "settings") {
      setIsPinModalOpen(true);
      addLog("Prompting Officer PIN Security Override...", "INIT");
      return;
    }
    if (actionId === "reports") {
      addLog("Generating CCTNS Statewide Executive Report...", "INIT");
      try {
        const records = recordService.getRecords();
        const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
          JSON.stringify(records, null, 2)
        )}`;
        const downloadAnchor = document.createElement("a");
        downloadAnchor.setAttribute("href", jsonString);
        downloadAnchor.setAttribute("download", `CCTNS_Statewide_Report_${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        addLog("CCTNS Analytics Export File generated and downloaded.", "SUCCESS");
      } catch (err) {
        addLog("Failed generating report file: " + err.message, "ERROR");
      }
      return;
    }

    if (runningAction) return;
    setRunningAction(actionId);
    addLog(`Triggering operational function: ${label}...`, "INIT");
    try {
      const response = await triggerAction(actionId, { timestamp: new Date().toISOString() });
      addLog(response.message, "SUCCESS");
    } catch {
      addLog(`Failed executing: ${actionId}. Code 500.`, "ERROR");
    } finally {
      setRunningAction(null);
    }
  };

  const handleSaveFir = async (firData) => {
    try {
      await recordService.createRecord(firData);
      addLog(`Successfully registered new FIR in Catalyst Datastore: ${firData.crimeNo || 'New FIR'}`, "SUCCESS");
      setIsFirModalOpen(false);
    } catch (err) {
      addLog(`Failed registering FIR: ${err.message}`, "ERROR");
    }
  };

  const handlePinSuccess = () => {
    addLog("Officer Security PIN Authorization verified successfully.", "SUCCESS");
    setIsPinModalOpen(false);
  };

  const actions = [
    {
      id: "diurnal_matrix",
      label: "Diurnal Heat & Red-Zones",
      icon: FaClock,
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      path: "/spatiotemporal",
      btnText: "Open Radar",
    },
    {
      id: "network_analysis",
      label: "Link & Network Analysis",
      icon: FaProjectDiagram,
      iconColor: "text-blue-400 bg-blue-500/10 border-blue-500/20",
      path: "/network-analysis",
      btnText: "Open Matrix",
    },
    {
      id: "generate_ai_brief",
      label: "AI Insights & Forecast",
      icon: FaBrain,
      iconColor: "text-purple-400 bg-purple-500/10 border-purple-500/20",
      isAction: true,
      btnText: "Run AI Engine",
    },
    {
      id: "hotspot_analysis",
      label: "Crime Map",
      icon: FaMapMarkedAlt,
      iconColor: "text-amber-400 bg-amber-500/10 border-amber-500/20",
      path: "/map",
      btnText: "Open GIS",
    },
    {
      id: "officer_lookup",
      label: "Officer Performance",
      icon: FaUserShield,
      iconColor: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20",
      path: "/officers",
      btnText: "View Roster",
    },
    {
      id: "reports",
      label: "Reports",
      icon: FaFileExport,
      iconColor: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
      isAction: true,
      btnText: "Export Report",
    },
    {
      id: "manage_records",
      label: "Manage Records",
      icon: FaFingerprint,
      iconColor: "text-rose-400 bg-rose-500/10 border-rose-500/20",
      isAction: true,
      btnText: "+ Register FIR",
    },
  ];

  const levelColor = (level) => {
    if (level === "SUCCESS") return "text-emerald-400 font-bold";
    if (level === "ERROR") return "text-rose-400 font-bold";
    if (level === "INIT") return "text-blue-400 font-bold";
    return "text-slate-400";
  };

  return (
    <div className="w-full font-sans">
      {/* ── Interactive Operational Actions ── */}
      <div 
        className="rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl"
        style={{ padding: "22px 24px" }}
      >
        <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-700/50">
          <div>
            <h2 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Quick Actions
            </h2>
          </div>
          <span className="text-[10px] font-mono text-emerald-400 bg-slate-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-sm font-bold">
            Interactive Shortcuts
          </span>
        </div>

        {/* 3x2 Clean Interactive Action Tile Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {actions.map((act) => {
            const Icon = act.icon;
            const isCurrent = runningAction === act.id;

            const tileInner = (
              <div 
                className="flex items-center justify-between rounded-md border border-slate-700/60 bg-slate-950/80 hover:bg-slate-800/80 hover:border-slate-600 transition-all duration-200 ease-in-out group cursor-pointer shadow-sm"
                style={{ padding: "16px 18px" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`p-2.5 rounded-md border flex items-center justify-center flex-shrink-0 ${act.iconColor}`}>
                    {isCurrent ? (
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-700 border-t-cyan-400" />
                    ) : (
                      <Icon className="text-xs" />
                    )}
                  </div>
                  <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors duration-200 ease-in-out font-mono tracking-tight truncate">
                    {act.label}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all duration-200 ease-in-out uppercase ml-2 whitespace-nowrap">
                  {act.btnText} &rarr;
                </span>
              </div>
            );

            if (act.isAction) {
              return (
                <button
                  key={act.id}
                  onClick={() => handleActionClick(act.id, act.label)}
                  disabled={runningAction !== null}
                  className="w-full text-left disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {tileInner}
                </button>
              );
            }

            return (
              <Link key={act.id} to={act.path} className="block">
                {tileInner}
              </Link>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Modals ── */}
      <FIRFormModal
        isOpen={isFirModalOpen}
        onClose={() => setIsFirModalOpen(false)}
        onSave={handleSaveFir}
      />

      <PINVerificationModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
        actionTitle="Security Credentials Authorization"
      />
    </div>
  );
};

export default QuickActionsPanel;
