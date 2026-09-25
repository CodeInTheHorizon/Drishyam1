import React, { useState, useEffect, useMemo } from "react";
import { 
  RiNodeTree, 
  RiRouteLine, 
  RiShieldUserLine, 
  RiTeamLine, 
  RiBuilding2Line,
  RiRefreshLine,
  RiDownload2Line,
  RiSparklingFill
} from "react-icons/ri";
import { networkService } from "../../services/networkService";
import { recordService } from "../../services/recordService";
import { crimeService } from "../../services/crimeService";
import NetworkFiltersToolbar from "../../components/network/NetworkFiltersToolbar";
import CrossJurisdictionFinder from "../../components/network/CrossJurisdictionFinder";
import NetworkGraphCanvas from "../../components/network/NetworkGraphCanvas";
import NodeDetailsDossier from "../../components/network/NodeDetailsDossier";

export default function NetworkAnalysis() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("Bengaluru City");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isSimulationActive, setIsSimulationActive] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  const [activeNodeTypes, setActiveNodeTypes] = useState({
    SUSPECT: true,
    LOCATION: true,
    COMPLAINANT: true,
    SYNDICATE: true
  });

  // State to trigger re-renders on database sync
  const [dbVersion, setDbVersion] = useState(0);

  // Subscribe to real-time database changes from recordService
  useEffect(() => {
    const unsubscribe = recordService.subscribe(() => {
      setDbVersion((v) => v + 1);
    });
    return () => unsubscribe();
  }, []);

  const districts = useMemo(() => crimeService.getDistricts(), []);
  const categories = useMemo(() => crimeService.getCategories(), []);

  // Compute live graph data from database
  const { allNodes, allEdges, metrics, crossDistrictSuspects } = useMemo(() => {
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
  }, [selectedDistrict, selectedCategory, searchTerm, dbVersion]);

  // Filter nodes based on active entity layer toggles
  const filteredNodes = useMemo(() => {
    return allNodes.filter((n) => activeNodeTypes[n.type]);
  }, [allNodes, activeNodeTypes]);

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
  };

  const handleSelectSuspect = (suspectId) => {
    setSelectedNodeId(suspectId);
    setZoomLevel(1.3);
  };

  return (
    <div 
      className="flex flex-col gap-6 animate-in fade-in duration-300 pb-12"
      style={{ display: "flex", flexDirection: "column", gap: "24px" }}
    >
      {/* Page Header Banner */}
      <div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/85 border border-slate-700/60 rounded-md backdrop-blur-md shadow-xl relative overflow-hidden"
        style={{ padding: "22px 24px" }}
      >
        <div className="relative z-10">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <RiNodeTree className="text-blue-400 text-2xl" />
            <span>Criminological Link & Network Analysis</span>
          </h1>

          <p className="text-xs text-slate-300 mt-1 max-w-2xl font-sans">
            Cross-jurisdictional link matrix and syndicate mapping across Karnataka police stations.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2 relative z-10">
          <button
            onClick={handleResetView}
            className="flex items-center gap-2 text-cyan-400 hover:text-white transition-all duration-200 ease-in-out cursor-pointer group font-mono text-xs active:scale-95 py-1.5 px-3 rounded hover:bg-slate-800/60"
            title="Reset Matrix View"
          >
            <RiRefreshLine className="text-sm text-cyan-400 group-hover:rotate-180 transition-transform duration-300 ease-in-out" />
            <span className="font-bold tracking-wider uppercase text-[11px]">Reset Matrix</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Total Entities</span>
            <RiNodeTree className="text-blue-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{metrics.totalNodes}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">In Active Scope</span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Suspects</span>
            <RiShieldUserLine className="text-red-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-red-400 font-mono">{metrics.suspectsCount}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">Accused Entities</span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Multi-District</span>
            <RiRouteLine className="text-amber-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-amber-300 font-mono">{metrics.crossDistrictSuspectsCount}</p>
          <span className="text-[9px] text-amber-400/90 font-medium font-sans mt-0.5">Cross-Jurisdiction</span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Crime Rings</span>
            <RiTeamLine className="text-purple-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-purple-300 font-mono">{metrics.syndicatesCount}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">Active Syndicates</span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Co-Accused</span>
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
          </div>
          <p className="text-2xl font-extrabold text-white font-mono">{metrics.coAccusedLinksCount}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">Shared Offences</span>
        </div>

        <div 
          className="bg-slate-900/85 border border-slate-700/60 rounded-md shadow-md flex flex-col justify-between"
          style={{ padding: "18px 20px" }}
        >
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider">Stations</span>
            <RiBuilding2Line className="text-blue-400 text-base" />
          </div>
          <p className="text-2xl font-extrabold text-blue-400 font-mono">{metrics.stationsCount}</p>
          <span className="text-[9px] text-slate-400 font-sans mt-0.5">Precinct Nodes</span>
        </div>
      </div>

      {/* Cross-Jurisdiction Connection Finder Banner */}
      <CrossJurisdictionFinder
        crossDistrictSuspects={crossDistrictSuspects}
        selectedSuspectId={selectedNodeId}
        onSelectSuspect={handleSelectSuspect}
      />

      {/* Filter & Physics Toolbar */}
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

      {/* Main Interactive Force-Directed Network Graph */}
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
        />

        {/* Selected Entity Dossier Flyout Panel */}
        <NodeDetailsDossier
          node={selectedNode}
          onClose={() => setSelectedNodeId(null)}
          onFocusNode={handleSelectSuspect}
        />
      </div>
    </div>
  );
}
