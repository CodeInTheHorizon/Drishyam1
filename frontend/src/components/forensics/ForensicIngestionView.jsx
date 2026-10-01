import React, { useState, useEffect, useRef, useMemo } from "react";
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
  RiCloseLine,
  RiBuilding2Line,
  RiRefreshLine,
  RiNodeTree,
  RiFlashlightLine,
  RiArrowDownLine,
  RiArrowUpLine,
  RiSkipDownLine,
  RiSkipUpLine,
  RiArrowLeftSLine,
  RiArrowRightSLine
} from "react-icons/ri";
import {
  ingestAndNormalizeArtifact,
  forensicEvidenceStore
} from "../../services/forensicParserService";
import { generateOnePageSeizureBrief } from "../../services/forensicBriefService";
import CyberSeizureBriefModal from "./CyberSeizureBriefModal";
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
  const [searchResultInfo, setSearchResultInfo] = useState(null);
  const [isSearching2M, setIsSearching2M] = useState(false);
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);
  const [isBenchmarking, setIsBenchmarking] = useState(false);
  const [chunkOffset, setChunkOffset] = useState(0);
  const [chunkLimit] = useState(100);
  const [pagedRecords, setPagedRecords] = useState(null);
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const [jumpRowInput, setJumpRowInput] = useState("");
  const tableTopRef = useRef(null);
  const fileInputRef = useRef(null);

  const briefData = useMemo(() => {
    return generateOnePageSeizureBrief(
      "FIR/MP/2026/08879", 
      user?.name || "Inspector R. K. Sharma", 
      user?.badgeNumber || user?.employeeId || "MPP-2026-IO"
    );
  }, [artifacts, user]);

  useEffect(() => {
    // Strictly purge legacy browser localStorage
    try {
      localStorage.removeItem("cctns_forensic_artifacts_v1");
    } catch {}

    setArtifacts(forensicEvidenceStore.getArtifacts());

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
      setStatusMessage(`Successfully verified, SHA-256 signed, and normalized ${files.length} artifact(s) in active triage memory.`);
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      console.error("Ingestion failed:", err);
      setStatusMessage(`Ingestion Error: ${err.message}`);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleBenchmark2M = async () => {
    setIsBenchmarking(true);
    setStatusMessage("⚡ Streaming & indexing 2,000,000 transaction records (VoidHacks8_MuleAccount_2M_Transactions.csv)...");
    try {
      const artifact = await forensicEvidenceStore.ingest2MBenchmark();
      setStatusMessage(`⚡ Complete! Ingested & indexed 2,000,000 records in ${artifact.summary.executionTimeSec}s (${artifact.summary.ingestionVelocity}) | SHA-256: ${artifact.sha256}`);
      setSelectedArtifactId(artifact.id);
      setPagedRecords(artifact.records.slice(0, 100));
      setChunkOffset(0);
    } catch (err) {
      console.error(err);
      setStatusMessage(`Benchmark Error: ${err.message}`);
    } finally {
      setIsBenchmarking(false);
    }
  };

  const load2MChunk = async (offset, limit = 100) => {
    setIsLoadingChunk(true);
    try {
      const res = await fetch(`/api/forensics/records?offset=${offset}&limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPagedRecords(json.data.records);
        setChunkOffset(json.data.offset);
        if (tableTopRef.current) {
          tableTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } catch (err) {
      console.error("Failed to fetch 2M chunk:", err);
      setStatusMessage(`Error loading records at offset ${offset}: ${err.message}`);
    } finally {
      setIsLoadingChunk(false);
    }
  };

  const handleJumpToFirst = () => {
    load2MChunk(0, chunkLimit);
  };

  const handleJumpToLast = () => {
    load2MChunk(1999900, chunkLimit);
  };

  const handleNextPage = () => {
    const nextOffset = Math.min(chunkOffset + chunkLimit, 1999900);
    load2MChunk(nextOffset, chunkLimit);
  };

  const handlePrevPage = () => {
    const prevOffset = Math.max(chunkOffset - chunkLimit, 0);
    load2MChunk(prevOffset, chunkLimit);
  };

  const handleJumpToRow = (e) => {
    e.preventDefault();
    const target = parseInt(jumpRowInput.replace(/[^0-9]/g, ""), 10);
    if (!isNaN(target) && target >= 1 && target <= 2000000) {
      const offset = Math.max(0, Math.min(target - 1, 1999900));
      load2MChunk(offset, chunkLimit);
      setJumpRowInput("");
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(id);
    setTimeout(() => setCopiedHash(null), 2500);
  };

  const handleSearch2M = async (query) => {
    if (!query || !query.trim()) {
      setSearchResultInfo(null);
      load2MChunk(chunkOffset, chunkLimit);
      return;
    }
    setIsSearching2M(true);
    try {
      const res = await fetch(`/api/forensics/records?search=${encodeURIComponent(query.trim())}&limit=100`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        setPagedRecords(json.data.records);
        setSearchResultInfo({
          isSearch: true,
          query: query.trim(),
          count: json.data.count
        });
        if (tableTopRef.current) {
          tableTopRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }
    } catch (err) {
      console.error("2M Search error:", err);
      setStatusMessage(`Search Error: ${err.message}`);
    } finally {
      setIsSearching2M(false);
    }
  };

  // Debounced search for 2,000,000 big-data transactions
  useEffect(() => {
    const trimmed = searchFilter.trim();
    const has2MArtifact = artifacts.some((a) => a.isLargeDataset);

    if (!trimmed) {
      if (searchResultInfo?.isSearch) {
        setSearchResultInfo(null);
        load2MChunk(chunkOffset, chunkLimit);
      }
      return;
    }

    if (has2MArtifact && trimmed.length >= 2) {
      const timer = setTimeout(() => {
        handleSearch2M(trimmed);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [searchFilter, artifacts]);

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(artifacts, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `forensic_normalized_evidence_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Filtered artifacts: comprehensively checks file name, sha256, source type, officer,
  // extracted entities (IMEI, Phone, VPA, IP), in-memory records, and keeps 2M dataset searchable
  const filteredArtifacts = artifacts.filter((art) => {
    if (activeTab !== "ALL" && art.sourceType !== activeTab) return false;
    if (searchFilter && searchFilter.trim()) {
      const q = searchFilter.toLowerCase().trim();
      const matchName = art.fileName?.toLowerCase().includes(q);
      const matchHash = art.sha256?.toLowerCase().includes(q);
      const matchType = art.sourceType?.toLowerCase().includes(q);
      const matchOfficer = art.officerBadge?.toLowerCase().includes(q);

      // Match extracted entities (value or type)
      const matchEntities = art.entities?.some((e) =>
        e.value?.toLowerCase().includes(q) || e.type?.toLowerCase().includes(q)
      );

      // Match in-memory records (e.g. account numbers, txnId, narration, etc.)
      const matchRecords = art.records?.some((r) => {
        if (!r) return false;
        return Object.values(r).some((val) => {
          if (typeof val === "string") return val.toLowerCase().includes(q);
          if (typeof val === "number") return val.toString().includes(q);
          return false;
        });
      });

      // Keep 2M big-data dataset available so streaming search runs over all 2,000,000 records
      const is2M = art.isLargeDataset;

      return matchName || matchHash || matchType || matchOfficer || matchEntities || matchRecords || is2M;
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
                  onClick={onProceedToCorrelation}
                  className="px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
                  title="Visualize entity relationships and money trail flow in network graph"
                >
                  <RiNodeTree className="text-base" />
                  <span>View Network Graph</span>
                </button>
                <button
                  onClick={() => setIsBriefModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer"
                  title="Generate standardized Section 91 CrPC One-Page Seizure Brief & Timeline report"
                >
                  <RiFileTextLine className="text-base" />
                  <span>1-Page Seizure Brief (Sec 91)</span>
                </button>
                <button
                  onClick={handleExportJSON}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-sm font-medium flex items-center gap-2 transition-all cursor-pointer"
                  title="Export all normalized evidence in standardized JSON"
                >
                  <RiDownload2Line /> Export Normalized JSON
                </button>
                <button
                  onClick={handleBenchmark2M}
                  disabled={isBenchmarking}
                  className="px-3.5 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold flex items-center gap-1.5 shadow-lg shadow-amber-600/25 transition-all cursor-pointer disabled:opacity-50"
                  title="Stream and index VoidHacks8_MuleAccount_2M_Transactions.csv (2,000,000 rows in ~2s)"
                >
                  <RiFlashlightLine className={isBenchmarking ? "animate-spin" : ""} />
                  {isBenchmarking ? "Indexing 2M Records..." : "⚡ 2M Records Benchmark (2.6s)"}
                </button>
                <button
                  onClick={() => {
                    setSelectedArtifactId(null);
                    forensicEvidenceStore.clearAll();
                  }}
                  className="px-3 py-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-sm font-medium flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Clear all currently loaded evidence"
                >
                  <RiDeleteBinLine /> Clear Active Session
                </button>
              </>
            )}
            {artifacts.length === 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleBenchmark2M}
                  disabled={isBenchmarking}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RiFlashlightLine className={isBenchmarking ? "animate-spin text-base" : "text-base"} />
                  {isBenchmarking ? "Indexing 2,000,000 Records..." : "⚡ Ingest 2M Records (Benchmark File)"}
                </button>
              </div>
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

          {/* Volatile Triage Sandbox Status Box */}
          <div className="bg-slate-950/70 border border-slate-800/80 rounded-xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <RiShieldCheckLine className="text-emerald-400" /> Triage Architecture
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                  ZERO-RESIDUE RUNTIME
                </span>
              </div>
              <p className="text-slate-400 text-xs mb-4">
                To honor schema datatype constraints (int, bool, varchar) and guarantee forensic zero-residue, files are parsed on-the-fly in volatile session memory:
              </p>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                    <RiBuilding2Line className="text-blue-400 text-sm" /> Database Storage
                  </span>
                  <span className="text-amber-400 font-bold">Bypassed (Zero DB Write)</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                    <RiFileTextLine className="text-red-400 text-sm" /> Browser LocalStorage
                  </span>
                  <span className="text-red-400 font-bold">Purged & Disabled</span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                    <RiShieldCheckLine className="text-emerald-400 text-sm" /> Triage Processing
                  </span>
                  <span className="text-emerald-400 font-bold">Live In-Memory</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
              <span className="text-xs text-slate-400">Session Artifacts:</span>
              <span className="text-xs font-mono font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {artifacts.length} Active in Memory
              </span>
            </div>
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
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (searchFilter.trim() && artifacts.some((a) => a.isLargeDataset)) {
                  handleSearch2M(searchFilter.trim());
                }
              }}
              className="relative flex items-center"
            >
              <RiFilter3Line className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search Txn ID, Account, IFSC, IP, Narration, File..."
                className="pl-8 pr-16 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-200 text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 w-64 sm:w-80 transition-all shadow-inner"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {isSearching2M && (
                  <div className="w-3.5 h-3.5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" title="Searching 2,000,000 records..." />
                )}
                {searchFilter && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchFilter("");
                      setSearchResultInfo(null);
                      if (selectedArtifact?.isLargeDataset) {
                        load2MChunk(0, chunkLimit);
                      }
                    }}
                    className="text-slate-400 hover:text-white p-0.5 rounded cursor-pointer"
                    title="Clear Search"
                  >
                    <RiCloseLine className="text-sm" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        {/* Evidence List & SHA-256 Cryptographic Audit */}
        {filteredArtifacts.length === 0 ? (
          <div className="p-12 text-center">
            <RiFileTextLine className="mx-auto text-4xl text-slate-600 mb-2" />
            <h3 className="text-white font-semibold text-base">No Evidence Artifacts Loaded</h3>
            <p className="text-slate-400 text-xs mt-1 max-w-md mx-auto">
              Drop an artifact in the upload box above or run the high-velocity 2,000,000 transaction stream benchmark directly.
            </p>
            <div className="mt-4 flex justify-center">
              <button
                onClick={handleBenchmark2M}
                disabled={isBenchmarking}
                className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer disabled:opacity-50"
              >
                <RiFlashlightLine className={isBenchmarking ? "animate-spin text-base" : "text-base"} />
                {isBenchmarking ? "Indexing 2,000,000 Records..." : "⚡ Ingest VoidHacks8 2M Benchmark Dataset"}
              </button>
            </div>
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
                      {artifact.sourceType === "TELECOM_RECORDS" && (() => {
                        const q = searchFilter.toLowerCase().trim();
                        const telecomRows = (artifact.records || []).filter((r) => {
                          if (!q) return true;
                          return (
                            (r.callingNumber && r.callingNumber.toLowerCase().includes(q)) ||
                            (r.calledNumber && r.calledNumber.toLowerCase().includes(q)) ||
                            (r.imei && r.imei.toLowerCase().includes(q)) ||
                            (r.callType && r.callType.toLowerCase().includes(q)) ||
                            (r.location && r.location.toLowerCase().includes(q)) ||
                            (r.tower && r.tower.toLowerCase().includes(q)) ||
                            (r.ip && r.ip.toLowerCase().includes(q))
                          );
                        });

                        return (
                          <div className="overflow-x-auto">
                            {q && (
                              <div className="p-2.5 bg-blue-500/10 border-b border-blue-500/20 text-xs text-blue-300 flex items-center justify-between">
                                <span>Showing <strong>{telecomRows.length}</strong> matching call log(s) for "{searchFilter}"</span>
                                <button onClick={() => setSearchFilter("")} className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer">Clear</button>
                              </div>
                            )}
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
                                {telecomRows.length === 0 ? (
                                  <tr>
                                    <td colSpan={8} className="p-8 text-center text-slate-400">
                                      <div className="flex flex-col items-center justify-center gap-2">
                                        <RiFilter3Line className="text-2xl text-slate-500" />
                                        <span>No telecom records matched <strong className="text-white">"{searchFilter}"</strong></span>
                                        <button onClick={() => setSearchFilter("")} className="mt-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700">Clear Search</button>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  telecomRows.map((r, idx) => (
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
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}

                      {/* Bank / UPI Settlement Table (Full 11-Column Evaluation Schema) */}
                       {artifact.sourceType === "FINANCIAL_UPI_BANK" && (() => {
                        const q = searchFilter.toLowerCase().trim();
                        let activeRows = [];
                        if (artifact.isLargeDataset) {
                          activeRows = pagedRecords || [];
                        } else {
                          const base = artifact.records || [];
                          if (!q) {
                            activeRows = base;
                          } else {
                            activeRows = base.filter((r) =>
                              Object.values(r).some((val) => {
                                if (typeof val === "string") return val.toLowerCase().includes(q);
                                if (typeof val === "number") return val.toString().includes(q);
                                return false;
                              })
                            );
                          }
                        }

                        return (
                          <div className="overflow-x-auto" ref={tableTopRef}>
                            {artifact.isLargeDataset && (
                              <div>
                                <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-xs flex flex-wrap items-center justify-between gap-3">
                                  <div className="flex items-center gap-2 text-amber-300 font-medium">
                                    <RiFlashlightLine className="text-amber-400 text-base" />
                                    <span>
                                      <strong>Big-Data Stream Verified:</strong> Ingested <strong>{artifact.recordCount.toLocaleString()}</strong> records in <strong>{artifact.summary.executionTimeSec}s</strong> ({artifact.summary.ingestionVelocity}).
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-3 text-[11px] font-mono text-slate-300">
                                    <span>Victims: <strong className="text-blue-400">{artifact.summary.victimNodesCount}</strong></span>
                                    <span>Mules: <strong className="text-amber-400">{artifact.summary.intermediateMulesCount}</strong></span>
                                    <span>Cashouts: <strong className="text-red-400">{artifact.summary.terminalCashoutsCount}</strong></span>
                                    <span>Volume: <strong className="text-emerald-400">₹{artifact.summary.totalVolumeINR.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</strong></span>
                                  </div>
                                </div>

                                {/* Search Result Banner or Standard Pagination */}
                                {searchResultInfo?.isSearch ? (
                                  <div className="p-3 bg-blue-500/15 border-b border-blue-500/30 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                                      <span className="text-blue-200 font-medium">
                                        Search Result: Found <strong>{searchResultInfo.count}</strong> matching transaction{searchResultInfo.count === 1 ? "" : "s"} for{" "}
                                        <strong className="text-white font-mono bg-blue-950/80 px-2 py-0.5 rounded border border-blue-400/40">
                                          "{searchResultInfo.query}"
                                        </strong>{" "}
                                        across 20,00,000 records
                                      </span>
                                      {isSearching2M && (
                                        <span className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                                          <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" /> Fetching...
                                        </span>
                                      )}
                                    </div>
                                    <button
                                      onClick={() => {
                                        setSearchFilter("");
                                        setSearchResultInfo(null);
                                        load2MChunk(0, chunkLimit);
                                      }}
                                      className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
                                    >
                                      <RiCloseLine className="text-sm" /> Clear Search & Return to All 20L Rows
                                    </button>
                                  </div>
                                ) : (
                                  /* 20 Lakh Records Navigation & Jump Bar */
                                  <div className="p-2.5 bg-slate-950/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                                    <div className="flex items-center gap-2">
                                      <span className="text-slate-400 text-[11px]">Viewing:</span>
                                      <span className="px-2 py-0.5 rounded bg-slate-850 text-white font-mono font-bold text-xs border border-slate-700">
                                        Row #{(chunkOffset + 1).toLocaleString()} – {Math.min(chunkOffset + (activeRows?.length || 100), 2000000).toLocaleString()} of 20,00,000
                                      </span>
                                      {isLoadingChunk && (
                                        <span className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                                          <div className="w-3 h-3 border border-amber-400 border-t-transparent rounded-full animate-spin" /> Fetching...
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      {/* First button */}
                                      <button
                                        onClick={handleJumpToFirst}
                                        disabled={chunkOffset === 0 || isLoadingChunk}
                                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono font-medium disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                                        title="Jump to Record #1 (Beginning)"
                                      >
                                        <RiSkipUpLine /> 1st Entry
                                      </button>
                                      {/* Prev button */}
                                      <button
                                        onClick={handlePrevPage}
                                        disabled={chunkOffset === 0 || isLoadingChunk}
                                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono disabled:opacity-40 transition-all flex items-center gap-0.5 cursor-pointer"
                                        title="Previous 100 Records"
                                      >
                                        <RiArrowLeftSLine /> Prev 100
                                      </button>
                                      {/* Next button */}
                                      <button
                                        onClick={handleNextPage}
                                        disabled={chunkOffset >= 1999900 || isLoadingChunk}
                                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono disabled:opacity-40 transition-all flex items-center gap-0.5 cursor-pointer"
                                        title="Next 100 Records"
                                      >
                                        Next 100 <RiArrowRightSLine />
                                      </button>
                                      {/* Last button */}
                                      <button
                                        onClick={handleJumpToLast}
                                        disabled={chunkOffset >= 1999900 || isLoadingChunk}
                                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-mono font-medium disabled:opacity-40 transition-all flex items-center gap-1 cursor-pointer"
                                        title="Jump to Record #2,000,000 (End)"
                                      >
                                        Last Entry (20 Lakh) <RiSkipDownLine />
                                      </button>

                                      {/* Jump to row input */}
                                      <form onSubmit={handleJumpToRow} className="flex items-center gap-1 ml-2">
                                        <input
                                          type="number"
                                          min="1"
                                          max="2000000"
                                          value={jumpRowInput}
                                          onChange={(e) => setJumpRowInput(e.target.value)}
                                          placeholder="Jump to Row #"
                                          className="w-28 px-2 py-1 rounded bg-slate-900 border border-slate-700 text-white text-xs font-mono placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                                        />
                                        <button
                                          type="submit"
                                          disabled={!jumpRowInput || isLoadingChunk}
                                          className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 text-white text-xs font-mono font-semibold cursor-pointer disabled:opacity-40"
                                        >
                                          Go
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            <table className="w-full text-left text-xs border border-slate-800">
                              <thead className="bg-slate-900 text-slate-400 font-mono text-[11px]">
                                <tr>
                                  <th className="p-2 border-b border-slate-800">Row #</th>
                                  <th className="p-2 border-b border-slate-800">Txn ID</th>
                                  <th className="p-2 border-b border-slate-800">Timestamp</th>
                                  <th className="p-2 border-b border-slate-800">Sender Account & IFSC</th>
                                  <th className="p-2 border-b border-slate-800">Receiver Account & IFSC</th>
                                  <th className="p-2 border-b border-slate-800">Amount (₹)</th>
                                  <th className="p-2 border-b border-slate-800">Mode</th>
                                  <th className="p-2 border-b border-slate-800">Narration</th>
                                  <th className="p-2 border-b border-slate-800">IP Address</th>
                                  <th className="p-2 border-b border-slate-800">Device Profile</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-mono">
                                {activeRows.length === 0 ? (
                                  <tr>
                                    <td colSpan={10} className="p-8 text-center text-slate-400">
                                      <div className="flex flex-col items-center justify-center gap-2">
                                        <RiFilter3Line className="text-2xl text-slate-500" />
                                        <span>No transactions matched <strong className="text-white font-mono">"{searchFilter}"</strong></span>
                                        <button
                                          onClick={() => {
                                            setSearchFilter("");
                                            setSearchResultInfo(null);
                                            if (artifact.isLargeDataset) load2MChunk(0, chunkLimit);
                                          }}
                                          className="mt-1 px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer border border-slate-700"
                                        >
                                          Clear Search
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  activeRows.map((r, idx) => {
                                    const rowNum = r.rowNumber || (chunkOffset + idx + 1);
                                    const hasScam = r.scamMarker !== null && r.scamMarker !== undefined;
                                    const isProxy = r.ipAnalysis?.isProxy;
                                    const isDeviceAnomaly = r.deviceAnalysis?.isAnomaly;

                                    return (
                                      <tr key={idx} className="hover:bg-slate-900/50">
                                        <td className="p-2 text-slate-500 font-mono text-[10px]">#{rowNum.toLocaleString()}</td>
                                        <td className="p-2 text-slate-400 font-bold">{r.txnId}</td>
                                        <td className="p-2 text-slate-400 text-[11px] whitespace-nowrap">{r.timestamp}</td>
                                        <td className="p-2 text-slate-200">
                                          <div className="font-semibold text-blue-300">{r.senderAccount || r.remitterAccount || r.remitter}</div>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                                            {r.senderIFSC ? `${r.senderIFSC} • ${r.senderBank}` : (r.senderBank || "Origin Bank")}
                                          </span>
                                        </td>
                                        <td className="p-2 text-emerald-400">
                                          <div className="font-semibold text-emerald-300">{r.receiverAccount || r.beneficiaryAccount || r.beneficiary}</div>
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/60">
                                            {r.receiverIFSC ? `${r.receiverIFSC} • ${r.receiverBank}` : (r.beneficiaryBank || "Beneficiary Bank")}
                                          </span>
                                        </td>
                                        <td className="p-2 text-emerald-400 font-bold whitespace-nowrap">
                                          ₹{(r.amount || 0).toLocaleString("en-IN")}
                                        </td>
                                        <td className="p-2">
                                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                            {r.paymentMode || r.mode || "UPI"}
                                          </span>
                                        </td>
                                        <td className="p-2 max-w-[200px]">
                                          <div className="text-slate-300 text-[11px] truncate" title={r.narration}>{r.narration || "—"}</div>
                                          {hasScam && (
                                            <span className="inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
                                              ⚠ {r.scamMarker.label}
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                          <div className="text-purple-400 text-[11px]">{r.ip || "—"}</div>
                                          {isProxy && (
                                            <span className="inline-block px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                              🛡 Proxy Anomaly
                                            </span>
                                          )}
                                        </td>
                                        <td className="p-2 whitespace-nowrap">
                                          <span className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                                            isDeviceAnomaly 
                                              ? "bg-purple-900/40 text-purple-300 border-purple-500/40 font-bold" 
                                              : "bg-slate-800 text-slate-400 border-slate-700"
                                          }`}>
                                            {r.deviceType || r.device || "Android"}
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}

                      {/* Email Header Breakdown */}
                      {artifact.sourceType === "EMAIL_HEADER" && (() => {
                        const q = searchFilter.toLowerCase().trim();
                        const emailRows = (artifact.records || []).filter((r) => {
                          if (!q) return true;
                          return (
                            (r.fromEmail && r.fromEmail.toLowerCase().includes(q)) ||
                            (r.originatingIP && r.originatingIP.toLowerCase().includes(q)) ||
                            (r.subject && r.subject.toLowerCase().includes(q)) ||
                            (r.xMailer && r.xMailer.toLowerCase().includes(q)) ||
                            (r.spfStatus && r.spfStatus.toLowerCase().includes(q)) ||
                            (r.dkimStatus && r.dkimStatus.toLowerCase().includes(q))
                          );
                        });

                        return (
                          <div className="space-y-3">
                            {q && (
                              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex items-center justify-between">
                                <span>Showing <strong>{emailRows.length}</strong> matching email header(s) for "{searchFilter}"</span>
                                <button onClick={() => setSearchFilter("")} className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer">Clear</button>
                              </div>
                            )}
                            {emailRows.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
                                No email headers matched "{searchFilter}"
                              </div>
                            ) : (
                              emailRows.map((r, idx) => (
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
                              ))
                            )}
                          </div>
                        );
                      })()}

                      {/* Android Dump Breakdown */}
                      {artifact.sourceType === "ANDROID_APK_DUMP" && (() => {
                        const q = searchFilter.toLowerCase().trim();
                        const androidRows = (artifact.records || []).filter((r) => {
                          if (!q) return true;
                          return (
                            (r.packageName && r.packageName.toLowerCase().includes(q)) ||
                            (r.appLabel && r.appLabel.toLowerCase().includes(q)) ||
                            (r.c2Endpoints && r.c2Endpoints.some((c) => c.toLowerCase().includes(q))) ||
                            (r.dangerousPermissions && r.dangerousPermissions.some((p) => p.toLowerCase().includes(q)))
                          );
                        });

                        return (
                          <div className="space-y-3">
                            {q && (
                              <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-xs text-blue-300 flex items-center justify-between">
                                <span>Showing <strong>{androidRows.length}</strong> matching APK entry/entries for "{searchFilter}"</span>
                                <button onClick={() => setSearchFilter("")} className="text-slate-400 hover:text-white text-[11px] underline cursor-pointer">Clear</button>
                              </div>
                            )}
                            {androidRows.length === 0 ? (
                              <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800">
                                No Android artifacts matched "{searchFilter}"
                              </div>
                            ) : (
                              androidRows.map((r, idx) => (
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
                              ))
                            )}
                          </div>
                        );
                      })()}

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
      {artifacts.length > 0 && (
        <div className="p-4 rounded-xl bg-gradient-to-r from-blue-900/40 via-indigo-900/30 to-purple-900/40 border border-blue-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="text-white font-semibold text-sm flex items-center gap-2">
              <RiSparklingFill className="text-blue-400" /> Ready for Automated Entity Correlation & Graph Synthesis
            </h4>
            <p className="text-slate-300 text-xs mt-0.5">
              {artifacts.length} artifact(s) with {allEntities.length} extracted entities ready to map cross-artifact links (IMEI-to-Phone, Mule accounts, C2 drops).
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsBriefModalOpen(true)}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-500/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <RiFileTextLine /> 1-Page Seizure Brief (Sec 91)
            </button>
            {onProceedToCorrelation && (
              <button
                onClick={onProceedToCorrelation}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/30 transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                Launch Entity Correlation Graph ➔
              </button>
            )}
          </div>
        </div>
      )}

      {/* Floating Single-Click Jump Button on Bottom-Right */}
      {selectedArtifact?.isLargeDataset && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-fadeIn">
          {/* Active Row Position Indicator */}
          <div className="px-3 py-1.5 rounded-full bg-slate-900/95 border border-amber-500/50 shadow-2xl backdrop-blur-md text-[11px] font-mono text-amber-300 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            {searchResultInfo?.isSearch ? (
              <span>
                Search: <strong>{searchResultInfo.count}</strong> match{searchResultInfo.count === 1 ? "" : "es"} for "{searchResultInfo.query}"
              </span>
            ) : (
              <span>
                Row: <strong>{(chunkOffset + 1).toLocaleString()}</strong> – <strong>{Math.min(chunkOffset + (pagedRecords?.length || 100), 2000000).toLocaleString()}</strong> of <strong>20,00,000</strong>
              </span>
            )}
          </div>

          {/* Master Jump Floating FAB */}
          {searchResultInfo?.isSearch ? (
            <button
              onClick={() => {
                setSearchFilter("");
                setSearchResultInfo(null);
                load2MChunk(0, chunkLimit);
              }}
              className="group px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs tracking-wider transition-all transform hover:scale-105 active:scale-95 cursor-pointer border bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 text-white border-blue-400/50 shadow-blue-600/40 ring-4 ring-blue-500/20"
              title="Click to Clear Search and restore all 20,00,000 records"
            >
              <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                <RiCloseLine className="text-xl" />
              </div>
              <div className="text-left">
                <div className="text-[10px] text-blue-200 uppercase font-mono">Search Filter Active</div>
                <div className="font-extrabold text-white text-xs">Clear Search (Full 20L) ✕</div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                if (chunkOffset >= 1999900) {
                  handleJumpToFirst();
                } else {
                  handleJumpToLast();
                }
              }}
              disabled={isLoadingChunk}
              className={`group px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 font-bold text-xs tracking-wider transition-all transform hover:scale-105 active:scale-95 cursor-pointer border ${
                chunkOffset >= 1999900
                  ? "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 text-white border-blue-400/50 shadow-blue-600/40 ring-4 ring-blue-500/20"
                  : "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-500 hover:from-amber-500 text-white border-amber-400/50 shadow-amber-600/40 ring-4 ring-amber-500/20"
              }`}
              title={chunkOffset >= 1999900 ? "Click to Jump directly back to 1st Entry (#1)" : "Click to Jump directly down to Last Entry (Row 20 Lakh)"}
            >
              {isLoadingChunk ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : chunkOffset >= 1999900 ? (
                <>
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                    <RiArrowUpLine className="animate-bounce" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-blue-200 uppercase font-mono">End of 20L Dataset</div>
                    <div className="font-extrabold text-white text-xs">Jump to 1st Entry (Top) ⤒</div>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white text-lg">
                    <RiArrowDownLine className="animate-bounce" />
                  </div>
                  <div className="text-left">
                    <div className="text-[10px] text-amber-200 uppercase font-mono">20,00,000 Records Total</div>
                    <div className="font-extrabold text-white text-xs">Jump to Last Entry (Bottom) ⤓</div>
                  </div>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Cyber Seizure Brief Modal */}
      <CyberSeizureBriefModal
        briefData={briefData}
        isOpen={isBriefModalOpen}
        onClose={() => setIsBriefModalOpen(false)}
      />
    </div>
  );
}
