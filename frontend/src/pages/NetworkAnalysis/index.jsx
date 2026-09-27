import React, { useState, useEffect, useMemo } from "react";
import { 
  RiNodeTree, 
  RiRouteLine, 
  RiShieldUserLine, 
  RiTeamLine, 
  RiBuilding2Line,
  RiRefreshLine,
  RiDownload2Line,
  RiSparklingFill,
  RiSearchLine,
  RiPlayLine,
  RiPauseLine,
  RiFocus3Line,
  RiAlertFill,
  RiMoneyDollarCircleLine,
  RiSmartphoneLine,
  RiServerLine,
  RiShieldCheckLine
} from "react-icons/ri";
import { networkService } from "../../services/networkService";
import { recordService } from "../../services/recordService";
import { crimeService } from "../../services/crimeService";
import { getArtifactCorrelationGraph } from "../../services/forensicCorrelationService";
import { forensicEvidenceStore } from "../../services/forensicParserService";
import NetworkFiltersToolbar from "../../components/network/NetworkFiltersToolbar";
import ForensicFiltersToolbar from "../../components/network/ForensicFiltersToolbar";
import CrossJurisdictionFinder from "../../components/network/CrossJurisdictionFinder";
import NetworkGraphCanvas from "../../components/network/NetworkGraphCanvas";
import NodeDetailsDossier from "../../components/network/NodeDetailsDossier";
import CyberSeizureBriefModal from "../../components/forensics/CyberSeizureBriefModal";
import { generateOnePageSeizureBrief } from "../../services/forensicBriefService";
import { RiShieldFlashLine, RiArrowRightUpLine, RiFileTextLine } from "react-icons/ri";
import { Link } from "react-router-dom";

export default function NetworkAnalysis() {
  const [analysisMode, setAnalysisMode] = useState("FORENSIC"); // "FORENSIC" or "CCTNS"
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("Bhopal");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedScope, setSelectedScope] = useState("ALL"); // "ALL", "FINANCIAL", "TELECOM", "CYBER"
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("ALL"); // "ALL", "CRITICAL", "HIGH", "LOW"
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isSimulationActive, setIsSimulationActive] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isBriefModalOpen, setIsBriefModalOpen] = useState(false);

  const [activeNodeTypes, setActiveNodeTypes] = useState({
    SUSPECT: true,
    LOCATION: true,
    COMPLAINANT: true,
    SYNDICATE: true,
    VICTIM: true,
    L1_MULE: true,
    L2_MULE: true,
    CASHOUT: true,
    PHONE: true,
    IMEI: true,
    C2_SERVER: true,
    MALWARE_APK: true,
    EMAIL_SPOOF: true
  });

  // State to trigger re-renders on in-memory evidence updates
  const [dbVersion, setDbVersion] = useState(0);
  const [forensicArtifactsCount, setForensicArtifactsCount] = useState(0);

  // Subscribe to real-time changes
  useEffect(() => {
    const unsubRecords = recordService.subscribe(() => {
      setDbVersion((v) => v + 1);
    });

    setForensicArtifactsCount(forensicEvidenceStore.getArtifacts().length);
    const unsubForensics = forensicEvidenceStore.subscribe((updated) => {
      setForensicArtifactsCount(updated.length);
      setDbVersion((v) => v + 1);
    });

    return () => {
      unsubRecords();
      unsubForensics();
    };
  }, []);

  const districts = useMemo(() => crimeService.getDistricts(), []);
  const categories = useMemo(() => crimeService.getCategories(), []);

  // Compute live graph data based on active analysis mode
  const { allNodes, allEdges, metrics, crossDistrictSuspects } = useMemo(() => {
    if (analysisMode === "FORENSIC") {
      const forensicData = getArtifactCorrelationGraph();
      return {
        allNodes: forensicData.nodes,
        allEdges: forensicData.edges,
        metrics: {
          totalNodes: forensicData.metrics.totalNodes,
          suspectsCount: forensicData.metrics.muleNodesCount,
          crossDistrictSuspectsCount: forensicData.metrics.cashoutNodesCount,
          syndicatesCount: forensicData.metrics.sharedDevicesCount,
          stationsCount: forensicData.metrics.c2ServersCount,
          criticalCount: forensicData.metrics.criticalRiskNodesCount,
          totalConnections: forensicData.metrics.totalEdges
        },
        crossDistrictSuspects: []
      };
    }

    // Default CCTNS mode
    const data = networkService.getGraphData({
      district: selectedDistrict,
      category: selectedCategory,
      search: searchTerm
    });

    const crossSuspects = networkService.getCrossJurisdictionSuspects();

    return {
      allNodes: data.nodes,
      allEdges: data.edges,
      metrics: data.metrics,
      crossDistrictSuspects: crossSuspects
    };
  }, [analysisMode, selectedDistrict, selectedCategory, searchTerm, dbVersion]);

  const briefData = useMemo(() => {
    return generateOnePageSeizureBrief("FIR/MP/2026/08879", "Inspector R. K. Sharma", "MPP-2026-IO");
  }, [allNodes, allEdges]);

  // Filter nodes based on active entity layer toggles, scope, risk, & search term
  const filteredNodes = useMemo(() => {
    return allNodes.filter((n) => {
      // 1. Layer toggle
      if (!activeNodeTypes[n.type]) return false;

      // 2. Scope filter (in Forensic mode)
      if (analysisMode === "FORENSIC" && selectedScope !== "ALL") {
        if (selectedScope === "FINANCIAL") {
          if (!["VICTIM", "L1_MULE", "L2_MULE", "CASHOUT"].includes(n.type)) return false;
        } else if (selectedScope === "TELECOM") {
          if (!["PHONE", "IMEI"].includes(n.type)) return false;
        } else if (selectedScope === "CYBER") {
          if (!["C2_SERVER", "MALWARE_APK", "EMAIL_SPOOF"].includes(n.type)) return false;
        }
      }

      // 3. Risk filter (in Forensic mode)
      if (analysisMode === "FORENSIC" && selectedRiskFilter !== "ALL") {
        const score = n.riskScore || 0;
        if (selectedRiskFilter === "CRITICAL" && score < 80) return false;
        if (selectedRiskFilter === "HIGH" && score < 65) return false;
        if (selectedRiskFilter === "LOW" && score > 40) return false;
      }

      // 4. Search query
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchName = (n.name || "").toLowerCase().includes(q);
        const matchSub = (n.subtitle || "").toLowerCase().includes(q);
        const matchDetails = JSON.stringify(n.details || {}).toLowerCase().includes(q);
        return matchName || matchSub || matchDetails;
      }

      return true;
    });
  }, [allNodes, activeNodeTypes, searchTerm, analysisMode, selectedScope, selectedRiskFilter]);

  // Filter edges connected only to visible nodes
  const filteredEdges = useMemo(() => {
    const visibleNodeIds = new Set(filteredNodes.map((n) => n.id));
    return allEdges.filter(
      (e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)
    );
  }, [allEdges, filteredNodes]);

  // Selected node entity for the dossier drawer
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return allNodes.find((n) => n.id === selectedNodeId) || null;
  }, [selectedNodeId, allNodes]);

  const toggleNodeType = (typeKey) => {
    setActiveNodeTypes((prev) => ({
      ...prev,
      [typeKey]: !prev[typeKey]
    }));
  };

  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    setSelectedNodeId(null);
    setSearchTerm("");
    setSelectedScope("ALL");
    setSelectedRiskFilter("ALL");
  };

  const handleSelectSuspect = (suspectId) => {
    setSelectedNodeId(suspectId);
    setZoomLevel(1.3);
  };

  return (
    <div 
      className="flex flex-col gap-6 animate-in fade-in duration-300 pb-12 font-sans"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Page Header Banner */}
      <div 
        className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/90 border border-slate-700/60 rounded-xl backdrop-blur-md shadow-xl relative overflow-hidden p-5"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
              <RiSparklingFill className="text-amber-400" />
              {analysisMode === "FORENSIC" ? "Feature 2: Automated Entity Correlator" : "CCTNS State Crime Registry"}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <RiShieldCheckLine /> Directional Mule Visualizer
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            {analysisMode === "FORENSIC" ? (
              <>
                <RiShieldFlashLine className="text-amber-400 text-2xl" />
                <span>Entity Correlation & Directional Mule Graph Engine</span>
              </>
            ) : (
              <>
                <RiNodeTree className="text-blue-400 text-2xl" />
                <span>Criminological Suspect & Syndicate Link Matrix</span>
              </>
            )}
          </h1>

          <p className="text-xs text-slate-300 mt-1 max-w-2xl font-sans">
            {analysisMode === "FORENSIC"
              ? "Synthesizes directional fund flows (Victim ➔ L1 Mule ➔ L2 Mule ➔ Cashout ATM/Crypto), shared IMEIs across SIMs, and Trojan APK to C2 exfiltration trails from ingested artifacts."
              : "Cross-jurisdictional link matrix and syndicate mapping across Madhya Pradesh police stations."}
          </p>
        </div>

        {/* Mode Switcher: Forensic Correlator vs CCTNS Crime Network */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <div className="flex items-center p-1 bg-slate-950/80 border border-slate-700/80 rounded-xl shadow-inner">
            <button
              onClick={() => setAnalysisMode("FORENSIC")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                analysisMode === "FORENSIC"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <RiShieldFlashLine className="text-amber-400 text-sm" />
              <span>Artifact & Mule Flow</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                analysisMode === "FORENSIC" ? "bg-white/20 text-white" : "bg-slate-800 text-slate-400"
              }`}>
                {forensicArtifactsCount}
              </span>
            </button>

            <button
              onClick={() => setAnalysisMode("CCTNS")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                analysisMode === "CCTNS"
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <RiBuilding2Line className="text-blue-400 text-sm" />
              <span>CCTNS Crime Network</span>
            </button>
          </div>

          <button
            onClick={handleResetView}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-white transition-all cursor-pointer font-mono text-xs py-2 px-3 rounded-lg border border-slate-700/80 bg-slate-800/60 hover:bg-slate-700"
            title="Recenter & Reset View"
          >
            <RiRefreshLine className="text-sm" />
            <span className="font-bold tracking-wider uppercase text-[11px]">Center View</span>
          </button>

          {analysisMode === "FORENSIC" && allNodes.length > 0 && (
            <button
              onClick={() => setIsBriefModalOpen(true)}
              className="flex items-center gap-1.5 text-white bg-emerald-600 hover:bg-emerald-500 transition-all cursor-pointer font-mono text-xs py-2 px-3 rounded-lg shadow-md shadow-emerald-600/30 font-bold"
              title="Generate Section 91 CrPC One-Page Seizure Brief & Timeline report"
            >
              <RiFileTextLine className="text-sm" />
              <span className="tracking-wider uppercase text-[11px]">1-Page Seizure Brief</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">
              {analysisMode === "FORENSIC" ? "Extracted Entities" : "Total Entities"}
            </span>
            <RiNodeTree className="text-blue-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{metrics.totalNodes}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">
            {analysisMode === "FORENSIC" ? "Cross-Correlated" : "In Active Scope"}
          </span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">
              {analysisMode === "FORENSIC" ? "Mule Layers (L1/L2)" : "Suspects"}
            </span>
            <RiShieldUserLine className="text-amber-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-amber-400 font-mono">{metrics.suspectsCount}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">
            {analysisMode === "FORENSIC" ? "Intermediary Nodes" : "Accused Entities"}
          </span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">
              {analysisMode === "FORENSIC" ? "Cash-Out Points" : "Multi-District"}
            </span>
            <RiMoneyDollarCircleLine className="text-red-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-red-400 font-mono">{metrics.crossDistrictSuspectsCount}</p>
          <span className="text-[9px] text-red-400/90 font-medium font-sans mt-0.5">
            {analysisMode === "FORENSIC" ? "ATM / Crypto Escrow" : "Cross-Jurisdiction"}
          </span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">
              {analysisMode === "FORENSIC" ? "Shared Hardware" : "Crime Rings"}
            </span>
            <RiSmartphoneLine className="text-purple-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-purple-300 font-mono">{metrics.syndicatesCount}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">
            {analysisMode === "FORENSIC" ? "IMEI SIM Swaps" : "Active Syndicates"}
          </span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">
              {analysisMode === "FORENSIC" ? "C2 / Proxy IPs" : "Co-Accused"}
            </span>
            <RiServerLine className="text-rose-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-rose-400 font-mono">{metrics.stationsCount}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">
            {analysisMode === "FORENSIC" ? "Command Endpoints" : "Shared Offences"}
          </span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">
              {analysisMode === "FORENSIC" ? "Critical Risk" : "Stations"}
            </span>
            <RiAlertFill className="text-red-500 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-red-500 font-mono">
            {analysisMode === "FORENSIC" ? (metrics.criticalCount || 0) : metrics.stationsCount}
          </p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">
            {analysisMode === "FORENSIC" ? "Risk Score ≥ 80%" : "Precinct Nodes"}
          </span>
        </div>
      </div>

      {/* Forensic Empty State Banner if 0 artifacts */}
      {analysisMode === "FORENSIC" && allNodes.length === 0 && (
        <div className="p-8 rounded-xl bg-slate-900/90 border border-slate-800 text-center space-y-3">
          <RiShieldFlashLine className="mx-auto text-4xl text-amber-400 mb-1" />
          <h3 className="text-white font-bold text-base">No Digital Artifacts Active in Triage Memory</h3>
          <p className="text-slate-400 text-xs max-w-md mx-auto">
            Upload CDR/IPDR telecom logs, UPI settlement sheets, .eml headers or Android APK dumps in the Digital Forensic Triage section to automatically synthesize the directional mule graph.
          </p>
          <div className="pt-2">
            <Link
              to="/forensics"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              <span>Go to Digital Forensic Triage</span>
              <RiArrowRightUpLine />
            </Link>
          </div>
        </div>
      )}

      {/* Forensic Filters & Physics Toolbar (in Forensic Mode) */}
      {analysisMode === "FORENSIC" && allNodes.length > 0 && (
        <ForensicFiltersToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedScope={selectedScope}
          setSelectedScope={setSelectedScope}
          selectedRiskFilter={selectedRiskFilter}
          setSelectedRiskFilter={setSelectedRiskFilter}
          activeNodeTypes={activeNodeTypes}
          toggleNodeType={toggleNodeType}
          isSimulationActive={isSimulationActive}
          setIsSimulationActive={setIsSimulationActive}
          onResetView={handleResetView}
          totalEntitiesCount={allNodes.length}
        />
      )}

      {/* Cross-Jurisdiction Connection Finder Banner (Only in CCTNS mode) */}
      {analysisMode === "CCTNS" && (
        <CrossJurisdictionFinder
          crossDistrictSuspects={crossDistrictSuspects}
          selectedSuspectId={selectedNodeId}
          onSelectSuspect={handleSelectSuspect}
        />
      )}

      {/* Filter & Physics Toolbar (in CCTNS mode) */}
      {analysisMode === "CCTNS" && (
        <NetworkFiltersToolbar
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedDistrict={selectedDistrict}
          setSelectedDistrict={setSelectedDistrict}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          activeNodeTypes={activeNodeTypes}
          toggleNodeType={toggleNodeType}
          isSimulationActive={isSimulationActive}
          setIsSimulationActive={setIsSimulationActive}
          onResetView={handleResetView}
          districts={districts}
          categories={categories}
        />
      )}

      {/* Main Interactive Force-Directed Network Graph */}
      {(analysisMode === "CCTNS" || allNodes.length > 0) && (
        <div className="relative">
          <NetworkGraphCanvas
            nodes={filteredNodes}
            edges={filteredEdges}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
            isSimulationActive={isSimulationActive}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            panOffset={panOffset}
            setPanOffset={setPanOffset}
            analysisMode={analysisMode}
          />

          {/* Selected Entity Dossier Flyout Panel */}
          <NodeDetailsDossier
            node={selectedNode}
            onClose={() => setSelectedNodeId(null)}
            onFocusNode={handleSelectSuspect}
          />
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
