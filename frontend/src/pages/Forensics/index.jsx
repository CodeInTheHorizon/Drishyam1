import React, { useState } from "react";
import {
  RiShieldFlashLine,
  RiFileUploadLine,
  RiNodeTree,
  RiFileChartLine,
  RiFolderShield2Line,
  RiSparklingFill
} from "react-icons/ri";
import ForensicIngestionView from "../../components/forensics/ForensicIngestionView";
import { useNavigate } from "react-router-dom";

export default function ForensicsPage() {
  const [activeModule, setActiveModule] = useState("INGESTION");
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-lg">
              <RiShieldFlashLine />
            </span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              AI-Powered Cyber Fraud Digital Artifact Correlator
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Unified forensic triage pipeline for golden-hour investigation across CDRs, IPDRs, UPI settlements, .eml headers & APK dumps.
          </p>
        </div>

        {/* Module Sub-Navigation */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveModule("INGESTION")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              activeModule === "INGESTION"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <RiFileUploadLine className="text-sm" />
            1. Ingestion & SHA-256
          </button>

          <button
            onClick={() => navigate("/network-analysis")}
            className="px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Navigate to Network Link Analysis"
          >
            <RiNodeTree className="text-sm" />
            2. Network Graph
          </button>
        </div>
      </div>

      {/* Feature 1 View */}
      {activeModule === "INGESTION" && (
        <ForensicIngestionView
          onProceedToCorrelation={() => navigate("/network-analysis")}
        />
      )}
    </div>
  );
}
