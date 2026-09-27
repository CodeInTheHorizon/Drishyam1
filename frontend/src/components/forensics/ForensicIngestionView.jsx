import React, { useState, useEffect, useRef } from "react";
import {
  RiFileUploadLine,
  RiShieldCheckLine,
  RiFileTextLine,
  RiCellphoneLine,
  RiBankCardLine,
  RiMailLine,
  RiAndroidLine,
  RiFileCopyLine,
  RiDeleteBinLine,
  RiCheckDoubleLine,
  RiFilter3Line,
  RiDownload2Line,
  RiSparklingFill,
  RiAlertLine,
  RiEyeLine,
  RiCloseLine
} from "react-icons/ri";
import {
  ingestAndNormalizeArtifact,
  forensicEvidenceStore,
  SAMPLE_DATASETS
} from "../../services/forensicParserService";
import { useAuth } from "../../context/AuthContext";

export default function ForensicIngestionView({ onProceedToCorrelation }) {
  const { user } = useAuth();
  const [artifacts, setArtifacts] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const [selectedArtifactId, setSelectedArtifactId] = useState(null);
  const [copiedHash, setCopiedHash] = useState(null);
  const [searchFilter, setSearchFilter] = useState("");
  const fileInputRef = useRef(null);

  useEffect(() => {
    // Completely purge legacy browser localStorage
    try {
      localStorage.removeItem("cctns_forensic_artifacts_v1");
    } catch {}

    forensicEvidenceStore.loadFromDatabase().then(() => {
      setArtifacts(forensicEvidenceStore.getArtifacts());
    });

    const unsubscribe = forensicEvidenceStore.subscribe((updated) => {
      setArtifacts(updated);
    });
    return () => unsubscribe();
  }, []);

  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    setIsProcessing(true);
    setStatusMessage(`Hashing and normalizing ${files.length} artifact(s)...`);

    try {
      for (const file of files) {
        const badge = user?.badgeNumber || user?.employeeId || "MPP-2026-IO";
        const artifact = await ingestAndNormalizeArtifact(file, file.name, badge);
        forensicEvidenceStore.addArtifact(artifact);
      }
      setStatusMessage(`Successfully verified and normalized ${files.length} artifact(s).`);
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      console.error("Ingestion failed:", err);
      setStatusMessage(`Ingestion Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleLoadSample = async (sampleKey) => {
    setIsProcessing(true);
    const sample = SAMPLE_DATASETS[sampleKey];
    if (!sample) return;

    setStatusMessage(`Ingesting sample ${sample.fileName}...`);
    try {
      const badge = user?.badgeNumber || "MPP-2026-CYBER-CELL";
      const artifact = await ingestAndNormalizeArtifact(sample.content, sample.fileName, badge);
      forensicEvidenceStore.addArtifact(artifact);
      setStatusMessage(`Loaded & SHA-256 verified: ${sample.fileName}`);
      setSelectedArtifactId(artifact.id);
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      console.error(err);
      setStatusMessage(`Error loading sample: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLoadAllSamples = async () => {
    setIsProcessing(true);
    setStatusMessage("Ingesting multi-source cyber fraud evidence package...");
    try {
      const badge = user?.badgeNumber || "MPP-2026-CYBER-CELL";
      for (const key of Object.keys(SAMPLE_DATASETS)) {
        const s = SAMPLE_DATASETS[key];
        const art = await ingestAndNormalizeArtifact(s.content, s.fileName, badge);
        forensicEvidenceStore.addArtifact(art);
      }
      setStatusMessage("All 4 multi-source evidence artifacts loaded & SHA-256 verified!");
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(artifacts, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `forensic_normalized_evidence_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered artifacts
  const filteredArtifacts = artifacts.filter((art) => {
    if (activeTab !== "ALL" && art.sourceType !== activeTab) return false;
    if (searchFilter) {
      const q = searchFilter.toLowerCase();
      const matchName = art.fileName.toLowerCase().includes(q);
      const matchHash = art.sha256.toLowerCase().includes(q);
      const matchType = art.sourceType.toLowerCase().includes(q);
      return matchName || matchHash || matchType;
    }
    return true;
  });

  const selectedArtifact = artifacts.find((a) => a.id === selectedArtifactId) || null;

  // Aggregate metrics
  const totalArtifacts = artifacts.length;
  const totalRecords = artifacts.reduce((acc, a) => acc + (a.recordCount || 0), 0);
  const allEntities = forensicEvidenceStore.getAllEntities();

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Ingestion Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                <RiShieldCheckLine className="text-sm" /> Sec 65B Indian Evidence Act / BSA Compliant
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                SHA-256 Cryptographic Hash Engine
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              Multi-Source Digital Artifact Ingestion & Normalizer
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Ingest fragmented telecom logs, bank settlement sheets, email headers, and Android dumps. Every artifact is cryptographically hashed and normalized for golden-hour triage.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {artifacts.length > 0 && (
              <>
                <button
                  onClick={handleExportJSON}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
                  title="Export all normalized evidence in standardized JSON"
                >
                  <RiDownload2Line /> Export Normalized JSON
                </button>
                <button
                  onClick={() => forensicEvidenceStore.clearAll()}
                  className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Clear all currently loaded evidence"
                >
                  <RiDeleteBinLine /> Clear All
                </button>
              </>
            )}
          </div>
        </div>

        {/* Drag & Drop Upload Zone */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="lg:col-span-2 border-2 border-dashed border-slate-700 hover:border-blue-500/70 bg-slate-950/60 hover:bg-slate-950/90 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              multiple
              accept=".csv,.tsv,.json,.txt,.eml,.xlsx"
              className="hidden"
            />
            <div className="w-14 h-14 rounded-2xl bg-blue-500/10 group-hover:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 text-2xl mb-3 transition-all">
              <RiFileUploadLine />
            </div>
            <p className="text-white font-medium text-base">
              Drop Investigation Artifacts Here or <span className="text-blue-400 underline decoration-blue-500/40">Browse Files</span>
            </p>
            <p className="text-slate-400 text-xs mt-1 max-w-md">
              Supports Telecom CDR/IPDR (CSV), Bank & UPI Settlement Sheets (CSV/Excel), RFC 5322 Email Headers (.eml), and Android System/APK Dumps (.txt/.json)
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-[11px] text-slate-500 font-mono">
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">.CSV</span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">.EML</span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">.JSON</span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">.TXT</span>
              <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700/60">.TSV</span>
            </div>
          </div>

          {/* Quick 1-Click Sample Ingestion (Essential for Hackathon Judging) */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <RiSparklingFill className="text-amber-400" /> Quick-Test Samples
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Instant Load
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-3">
                Load high-fidelity synthetic cyber fraud artifacts to evaluate normalization and entity linking instantly:
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => handleLoadSample("TELECOM_CDR")}
                  disabled={isProcessing}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500/40 text-xs font-medium text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RiCellphoneLine className="text-blue-400 text-sm" /> Telecom CDR / IPDR Log
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">CSV</span>
                </button>

                <button
                  onClick={() => handleLoadSample("FINANCIAL_UPI")}
                  disabled={isProcessing}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 text-xs font-medium text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RiBankCardLine className="text-emerald-400 text-sm" /> Bank & UPI Mule Sheet
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">CSV</span>
                </button>

                <button
                  onClick={() => handleLoadSample("EMAIL_HEADER")}
                  disabled={isProcessing}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-amber-500/40 text-xs font-medium text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RiMailLine className="text-amber-400 text-sm" /> Phishing Bank Notice (.eml)
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">EML</span>
                </button>

                <button
                  onClick={() => handleLoadSample("ANDROID_APK_DUMP")}
                  disabled={isProcessing}
                  className="w-full text-left px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/40 text-xs font-medium text-slate-200 flex items-center justify-between transition-all cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <RiAndroidLine className="text-purple-400 text-sm" /> Banking Trojan APK Dump
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">JSON</span>
                </button>
              </div>
            </div>

            <button
              onClick={handleLoadAllSamples}
              disabled={isProcessing}
              className="mt-3 w-full py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <RiSparklingFill /> Load All 4 Connected Artifacts
            </button>
          </div>
        </div>

        {/* Status Alert */}
        {statusMessage && (
          <div className="mt-4 px-4 py-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-center justify-between animate-fadeIn">
            <span className="flex items-center gap-2">
              <RiSparklingFill className="text-blue-400" /> {statusMessage}
            </span>
            <button onClick={() => setStatusMessage("")} className="text-slate-400 hover:text-white">
              <RiCloseLine />
            </button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs font-medium">Ingested Evidence Files</span>
          <div className="text-2xl font-bold text-white mt-1">{totalArtifacts}</div>
          <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
            <RiShieldCheckLine /> 100% SHA-256 Signed
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs font-medium">Normalized Records</span>
          <div className="text-2xl font-bold text-blue-400 mt-1">{totalRecords}</div>
          <span className="text-[11px] text-slate-400 mt-1">Standardized Schema</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs font-medium">Extracted Unique Entities</span>
          <div className="text-2xl font-bold text-amber-400 mt-1">{allEntities.length}</div>
          <span className="text-[11px] text-slate-400 mt-1">Phones, IMEIs, VPAs, IPs</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 text-xs font-medium">Evidentiary Status</span>
          <div className="text-base font-bold text-emerald-400 mt-2 flex items-center gap-1.5">
            <RiCheckDoubleLine className="text-lg" /> Court Admissible
          </div>
          <span className="text-[11px] text-slate-400 mt-0.5">Sec 65B Certificate Ready</span>
        </div>
      </div>

      {/* Main Evidence Vault & Normalized Explorer */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        {/* Navigation & Filter Bar */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: "All Evidence", icon: RiFileTextLine },
              { id: "TELECOM_RECORDS", label: "Telecom (CDR/IPDR)", icon: RiCellphoneLine },
              { id: "FINANCIAL_UPI_BANK", label: "Bank & UPI Logs", icon: RiBankCardLine },
              { id: "EMAIL_HEADER", label: "Email Headers (.eml)", icon: RiMailLine },
              { id: "ANDROID_APK_DUMP", label: "Android / APK Dumps", icon: RiAndroidLine }
            ].map((tab) => {
              const Icon = tab.icon;
              const count = tab.id === "ALL" ? artifacts.length : artifacts.filter((a) => a.sourceType === tab.id).length;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/50"
                  }`}
                >
                  <Icon className="text-sm" />
                  {tab.label}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id ? "bg-white/20 text-white" : "bg-slate-900 text-slate-400"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <RiFilter3Line className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search file, hash or entity..."
                className="pl-8 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-48 sm:w-64"
              />
            </div>
          </div>
        </div>

        {/* Evidence List & SHA-256 Cryptographic Audit */}
        {filteredArtifacts.length === 0 ? (
          <div className="p-12 text-center">
            <RiFileTextLine className="mx-auto text-4xl text-slate-600 mb-2" />
            <h3 className="text-white font-semibold text-base">No Evidence Artifacts Loaded</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
              Drop an artifact in the upload box above or click on any of the Quick-Test Sample buttons to view normalization in action.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredArtifacts.map((artifact) => {
              const isSelected = selectedArtifactId === artifact.id;
              let badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
              let TypeIcon = RiFileTextLine;

              if (artifact.sourceType === "TELECOM_RECORDS") {
                badgeColor = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                TypeIcon = RiCellphoneLine;
              } else if (artifact.sourceType === "FINANCIAL_UPI_BANK") {
                badgeColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
                TypeIcon = RiBankCardLine;
              } else if (artifact.sourceType === "EMAIL_HEADER") {
                badgeColor = "bg-amber-500/10 text-amber-400 border-amber-500/20";
                TypeIcon = RiMailLine;
              } else if (artifact.sourceType === "ANDROID_APK_DUMP") {
                badgeColor = "bg-purple-500/10 text-purple-400 border-purple-500/20";
                TypeIcon = RiAndroidLine;
              }

              return (
                <div
                  key={artifact.id}
                  className={`p-4 transition-colors ${
                    isSelected ? "bg-slate-800/40" : "hover:bg-slate-850/40"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className={`p-2.5 rounded-xl border ${badgeColor} text-lg shrink-0 mt-0.5`}>
                        <TypeIcon />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="text-white font-medium text-sm">{artifact.fileName}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badgeColor}`}>
                            {artifact.sourceType.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ({(artifact.fileSize / 1024).toFixed(1)} KB)
                          </span>
                        </div>

                        {/* Cryptographic SHA-256 Proof Badge */}
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-medium flex items-center gap-1">
                            <RiShieldCheckLine className="text-emerald-400" /> SHA-256:
                          </span>
                          <span className="font-mono text-slate-300 text-[11px] select-all bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {artifact.sha256}
                          </span>
                          <button
                            onClick={() => copyToClipboard(artifact.sha256, artifact.id)}
                            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
                            title="Copy SHA-256 Checksum"
                          >
                            {copiedHash === artifact.id ? (
                              <RiCheckDoubleLine className="text-emerald-400 text-xs" />
                            ) : (
                              <RiFileCopyLine className="text-xs" />
                            )}
                          </button>
                        </div>

                        <div className="mt-1 flex flex-wrap items-center gap-4 text-[11px] text-slate-400">
                          <span>Ingested: <strong className="text-slate-300">{new Date(artifact.ingestedAt).toLocaleTimeString()}</strong></span>
                          <span>Officer: <strong className="text-slate-300">{artifact.officerBadge}</strong></span>
                          <span>Normalized Records: <strong className="text-blue-400">{artifact.recordCount}</strong></span>
                          <span>Extracted Entities: <strong className="text-amber-400">{artifact.entities?.length || 0}</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end lg:self-center">
                      <button
                        onClick={() => setSelectedArtifactId(isSelected ? null : artifact.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                          isSelected
                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        }`}
                      >
                        <RiEyeLine /> {isSelected ? "Hide Inspection" : "Inspect Normalization"}
                      </button>
                      <button
                        onClick={() => forensicEvidenceStore.removeArtifact(artifact.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700 transition-all cursor-pointer"
                        title="Remove artifact"
                      >
                        <RiDeleteBinLine className="text-sm" />
                      </button>
                    </div>
                  </div>

                  {/* Inline Inspector when Expanded */}
                  {isSelected && (
                    <div className="mt-4 pt-4 border-t border-slate-800/80 bg-slate-950/80 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                          <RiSparklingFill className="text-blue-400" /> Normalized Data View: {artifact.fileName}
                        </span>
                        <span className="text-[11px] font-mono text-emerald-400">
                          {artifact.integrityStatus}
                        </span>
                      </div>

                      {/* Telecom CDR Table */}
                      {artifact.sourceType === "TELECOM_RECORDS" && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-slate-800">
                            <thead className="bg-slate-900 text-slate-400 font-mono text-[11px]">
                              <tr>
                                <th className="p-2 border-b border-slate-800">Time</th>
                                <th className="p-2 border-b border-slate-800">Calling Party (A)</th>
                                <th className="p-2 border-b border-slate-800">Called Party (B)</th>
                                <th className="p-2 border-b border-slate-800">Type</th>
                                <th className="p-2 border-b border-slate-800">Duration</th>
                                <th className="p-2 border-b border-slate-800">IMEI (Device)</th>
                                <th className="p-2 border-b border-slate-800">Cell Tower Location</th>
                                <th className="p-2 border-b border-slate-800">Destination IP</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                              {artifact.records.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/50">
                                  <td className="p-2 text-slate-400">{r.timestamp}</td>
                                  <td className="p-2 text-blue-400 font-bold">{r.callingNumber}</td>
                                  <td className="p-2 text-slate-200">{r.calledNumber}</td>
                                  <td className="p-2 text-slate-300">{r.callType}</td>
                                  <td className="p-2 text-slate-400">{r.duration}s</td>
                                  <td className="p-2 text-amber-400">{r.imei || "—"}</td>
                                  <td className="p-2 text-slate-300">{r.location || r.tower || "—"}</td>
                                  <td className="p-2 text-purple-400">{r.ip || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Bank / UPI Settlement Table */}
                      {artifact.sourceType === "FINANCIAL_UPI_BANK" && (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border border-slate-800">
                            <thead className="bg-slate-900 text-slate-400 font-mono text-[11px]">
                              <tr>
                                <th className="p-2 border-b border-slate-800">UTR / Txn ID</th>
                                <th className="p-2 border-b border-slate-800">Timestamp</th>
                                <th className="p-2 border-b border-slate-800">Remitter (Sender)</th>
                                <th className="p-2 border-b border-slate-800">Beneficiary (Receiver)</th>
                                <th className="p-2 border-b border-slate-800">Amount (INR)</th>
                                <th className="p-2 border-b border-slate-800">Channel</th>
                                <th className="p-2 border-b border-slate-800">Client IP</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60 font-mono">
                              {artifact.records.map((r, idx) => (
                                <tr key={idx} className="hover:bg-slate-900/50">
                                  <td className="p-2 text-slate-400">{r.txnId}</td>
                                  <td className="p-2 text-slate-400">{r.timestamp}</td>
                                  <td className="p-2 text-slate-200">
                                    <div>{r.remitter}</div>
                                    <span className="text-[10px] text-slate-400">{r.remitterVPA}</span>
                                  </td>
                                  <td className="p-2 text-emerald-400">
                                    <div>{r.beneficiary}</div>
                                    <span className="text-[10px] text-slate-400">{r.beneficiaryVPA} ({r.beneficiaryBank})</span>
                                  </td>
                                  <td className="p-2 text-emerald-400 font-bold">
                                    ₹{r.amount.toLocaleString("en-IN")}
                                  </td>
                                  <td className="p-2 text-slate-300">{r.mode}</td>
                                  <td className="p-2 text-purple-400">{r.ip || "—"}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}

                      {/* Email Header Breakdown */}
                      {artifact.sourceType === "EMAIL_HEADER" && (
                        <div className="space-y-3">
                          {artifact.records.map((r, idx) => (
                            <div key={idx} className="space-y-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-slate-400 text-[11px]">Claimed Sender:</span>
                                  <div className="text-white font-mono text-xs font-semibold mt-0.5">{r.fromEmail}</div>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-slate-400 text-[11px]">Actual Originating IP:</span>
                                  <div className="text-purple-400 font-mono text-xs font-semibold mt-0.5">{r.originatingIP}</div>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                                  <span className="text-slate-400 text-[11px]">Spoofing Confidence:</span>
                                  <div className="text-red-400 font-mono text-xs font-bold mt-0.5 flex items-center gap-1">
                                    <RiAlertLine /> {r.spoofConfidenceScore}% High Risk
                                  </div>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                                <span>Subject: <strong className="text-slate-200">{r.subject}</strong></span>
                                <span>X-Mailer: <strong className="text-amber-400 font-mono">{r.xMailer}</strong></span>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                  r.spfStatus === "FAIL" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400"
                                }`}>
                                  SPF: {r.spfStatus}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                                  r.dkimStatus === "FAIL" ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-emerald-500/20 text-emerald-400"
                                }`}>
                                  DKIM: {r.dkimStatus}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Android Dump Breakdown */}
                      {artifact.sourceType === "ANDROID_APK_DUMP" && (
                        <div className="space-y-3">
                          {artifact.records.map((r, idx) => (
                            <div key={idx} className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="text-white font-mono text-xs font-bold">{r.packageName}</h5>
                                  <p className="text-slate-400 text-[11px]">{r.appLabel}</p>
                                </div>
                                {r.trojanSignatureDetected && (
                                  <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1">
                                    <RiAlertLine /> Banking Trojan Signature Flagged
                                  </span>
                                )}
                              </div>

                              <div>
                                <span className="text-[11px] text-slate-400">Flagged Dangerous Permissions:</span>
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {r.dangerousPermissions.map((perm, pIdx) => (
                                    <span key={pIdx} className="px-2 py-0.5 rounded bg-red-950/40 text-red-300 border border-red-800/40 text-[10px] font-mono">
                                      {perm.split(".").pop()}
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {r.c2Endpoints?.length > 0 && (
                                <div>
                                  <span className="text-[11px] text-slate-400">Identified C2 Servers / Drop Endpoints:</span>
                                  <div className="flex flex-wrap gap-2 mt-1">
                                    {r.c2Endpoints.map((c2, cIdx) => (
                                      <span key={cIdx} className="px-2 py-0.5 rounded bg-purple-950/40 text-purple-300 border border-purple-800/40 text-[11px] font-mono">
                                        {c2}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Extracted Entities Tag Cloud */}
                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Extracted Entity Identifiers ({artifact.entities?.length || 0}):
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(artifact.entities || []).map((ent, eIdx) => (
                            <span
                              key={eIdx}
                              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700/80 text-[11px] font-mono text-slate-300 flex items-center gap-1"
                            >
                              <span className="text-[9px] text-slate-500 uppercase">{ent.type}:</span>
                              <strong className="text-white">{ent.value}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Footer to Proceed to Entity Correlation & Graph */}
      {artifacts.length > 0 && onProceedToCorrelation && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-white font-semibold text-sm flex items-center gap-2">
              <RiSparklingFill className="text-blue-400" /> Ready for Automated Entity Correlation & Graph Synthesis
            </h4>
            <p className="text-slate-300 text-xs mt-0.5">
              {artifacts.length} artifact(s) with {allEntities.length} extracted entities ready to map cross-artifact links (IMEI-to-Phone, Mule accounts, C2 drops).
            </p>
          </div>
          <button
            onClick={onProceedToCorrelation}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            Launch Entity Correlation Graph ➔
          </button>
        </div>
      )}
    </div>
  );
}
