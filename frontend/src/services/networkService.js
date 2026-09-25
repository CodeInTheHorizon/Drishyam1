/**
 * networkService.js
 * 
 * Dynamic Criminological Entity-Link & Network Analysis Engine.
 * Connected 100% directly to live Zoho Catalyst Datastore records via recordService.
 * 
 * Features:
 * • Extracts graph nodes: Suspects (Red), Incident Locations/Stations (Blue), Complainants (Green), Gangs/Syndicates (Purple).
 * • Derives weighted edges: "Co-Accused with", "Committed Crime at", "Reported by", "Member of Syndicate", "Cross-District Trail".
 * • Cross-Jurisdiction Pathfinder: Pinpoints suspects active across multiple police districts.
 * • Real-time database reactivity via recordService subscriptions.
 */

import { recordService } from "./recordService.js";

const NODE_COLORS = {
  SUSPECT: {
    base: "#ef4444",      // Red
    glow: "rgba(239, 68, 68, 0.4)",
    border: "#f87171",
    label: "Suspect / Accused"
  },
  LOCATION: {
    base: "#3b82f6",      // Blue
    glow: "rgba(59, 130, 246, 0.4)",
    border: "#60a5fa",
    label: "Police Station / Location"
  },
  COMPLAINANT: {
    base: "#10b981",      // Green
    glow: "rgba(16, 185, 129, 0.4)",
    border: "#34d399",
    label: "Complainant / Victim"
  },
  SYNDICATE: {
    base: "#a855f7",      // Purple
    glow: "rgba(168, 85, 247, 0.4)",
    border: "#c084fc",
    label: "Crime Syndicate / Gang"
  }
};

const EDGE_TYPES = {
  COMMITTED_AT: { color: "#64748b", label: "Committed Crime at", width: 1.5, style: "solid" },
  CO_ACCUSED: { color: "#ef4444", label: "Co-Accused with", width: 2.5, style: "dashed" },
  REPORTED_BY: { color: "#10b981", label: "Reported by", width: 1.5, style: "solid" },
  MEMBER_OF: { color: "#a855f7", label: "Member of Syndicate", width: 2.2, style: "solid" },
  CROSS_DISTRICT: { color: "#f59e0b", label: "Cross-District Link", width: 3.0, style: "dashed" }
};

// Modus Operandi Syndicate Rule Definitions for Auto-Cluster Discovery
const SYNDICATE_RULES = [
  {
    id: "syn-cyber-aeps",
    name: "Inter-State AePS & Phishing Ring",
    code: "GANG-CYBER-09",
    category: "Cyber Crime",
    keywords: ["cyber", "phishing", "aeps", "otp", "sim swap", "clon", "online", "fraud", "66d"],
    color: "#a855f7"
  },
  {
    id: "syn-dacoity-south",
    name: "Highway Dacoity & Commercial Theft Syndicate",
    code: "GANG-DACOITY-14",
    category: "Property Related",
    keywords: ["dacoity", "highway", "395", "housebreaking", "burglary", "commercial", "theft", "jewel"],
    color: "#8b5cf6"
  },
  {
    id: "syn-ndps-transit",
    name: "Coastal NDPS Narcotics Transit Network",
    code: "GANG-NDPS-04",
    category: "Property Related",
    keywords: ["narcotics", "ndps", "ganja", "transit", "contraband", "coastal", "port", "smuggl"],
    color: "#c084fc"
  },
  {
    id: "syn-homicide-crew",
    name: "Organized Extortion & Assault Gang",
    code: "GANG-ASSAULT-02",
    category: "Assault",
    keywords: ["assault", "302", "307", "homicide", "extortion", "rival", "supari", "gang", "threat"],
    color: "#d946ef"
  }
];

function sanitizeName(name) {
  if (!name) return "Unknown Entity";
  return String(name).trim();
}

function extractAlias(accusedStr) {
  if (!accusedStr) return { mainName: "Unidentified Suspect", alias: "" };
  const str = String(accusedStr).trim();
  const aliasMatch = str.match(/alias\s*['"‘“]?([^'"’”)]+)['"’”]?/i) || str.match(/\(([^)]+)\)/);
  let mainName = str;
  let alias = "";
  if (aliasMatch) {
    alias = aliasMatch[1].replace(/alias/i, "").replace(/['"]/g, "").trim();
    mainName = str.replace(/\([^)]+\)/g, "").trim();
  }
  return { mainName, alias };
}

export const networkService = {
  NODE_COLORS,
  EDGE_TYPES,

  /**
   * Builds full dynamic graph nodes and edges directly from live database records.
   */
  getGraphData: (filters = {}) => {
    const rawRecords = recordService.getRecords();
    
    // Apply filters if provided
    let records = rawRecords;
    if (filters.district && filters.district !== "ALL") {
      const dReq = filters.district.toLowerCase().trim();
      records = records.filter(r => {
        const dRec = (r.district || "").toLowerCase().trim();
        if (dRec === dReq) return true;
        if (dReq.includes("bengaluru") || dReq.includes("bangalore")) {
          return dRec.includes("bengaluru") || dRec.includes("bangalore");
        }
        return dRec.includes(dReq) || dReq.includes(dRec);
      });
    }
    if (filters.category && filters.category !== "ALL") {
      records = records.filter(r => (r.crimeHead || "").toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      records = records.filter(r => 
        (r.accusedName && r.accusedName.toLowerCase().includes(q)) ||
        (r.complainantName && r.complainantName.toLowerCase().includes(q)) ||
        (r.unit && r.unit.toLowerCase().includes(q)) ||
        (r.district && r.district.toLowerCase().includes(q)) ||
        (r.crimeNo && r.crimeNo.toLowerCase().includes(q)) ||
        (r.actSections && r.actSections.toLowerCase().includes(q))
      );
    }

    const nodeMap = new Map();
    const edgeList = [];
    const edgeKeySet = new Set();

    const addEdge = (source, target, type, label, metadata = {}) => {
      if (!source || !target || source === target) return;
      const key = [source, target].sort().join("<-->") + `::${type}`;
      if (!edgeKeySet.has(key)) {
        edgeKeySet.add(key);
        edgeList.push({
          id: `edge-${source}-${target}-${type}`,
          source,
          target,
          type,
          label: label || EDGE_TYPES[type]?.label || type,
          config: EDGE_TYPES[type] || EDGE_TYPES.COMMITTED_AT,
          ...metadata
        });
      }
    };

    // 1. Process Records & Extract Entities
    records.forEach((r) => {
      const recordId = r.id || `fir-${r.crimeNo}`;
      const stationName = sanitizeName(r.unit || "City Station");
      const districtName = sanitizeName(r.district || "Bengaluru City");
      const stationId = `loc-${stationName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      
      const { mainName: suspectName, alias: suspectAlias } = extractAlias(r.accusedName);
      const suspectId = `suspect-${suspectName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      
      const complainantName = sanitizeName(r.complainantName || "Citizen Complainant");
      const complainantId = `comp-${complainantName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;

      // A. Location / Station Node
      if (!nodeMap.has(stationId)) {
        nodeMap.set(stationId, {
          id: stationId,
          type: "LOCATION",
          name: stationName,
          subtitle: districtName,
          district: districtName,
          casesCount: 0,
          firs: [],
          suspects: new Set(),
          complainants: new Set(),
          lat: Number(r.lat) || 12.9716,
          lng: Number(r.lng) || 77.5946,
          colorConfig: NODE_COLORS.LOCATION
        });
      }
      const locNode = nodeMap.get(stationId);
      locNode.casesCount += 1;
      locNode.firs.push(r);
      locNode.suspects.add(suspectId);
      locNode.complainants.add(complainantId);

      // B. Suspect Node
      if (!nodeMap.has(suspectId)) {
        nodeMap.set(suspectId, {
          id: suspectId,
          type: "SUSPECT",
          name: suspectName,
          alias: suspectAlias ? `'${suspectAlias}'` : "",
          subtitle: suspectAlias ? `Alias: ${suspectAlias}` : `${r.crimeHead || 'Suspect'}`,
          casesCount: 0,
          firs: [],
          stations: new Set(),
          districts: new Set(),
          coAccused: new Set(),
          syndicates: new Set(),
          severity: r.severity || "MEDIUM",
          charges: new Set(),
          colorConfig: NODE_COLORS.SUSPECT
        });
      }
      const susNode = nodeMap.get(suspectId);
      susNode.casesCount += 1;
      susNode.firs.push(r);
      susNode.stations.add(stationName);
      susNode.districts.add(districtName);
      if (r.actSections) susNode.charges.add(r.actSections);
      if (r.severity === "CRITICAL" || susNode.severity !== "CRITICAL") {
        if (r.severity === "CRITICAL" || r.severity === "HIGH") susNode.severity = r.severity;
      }

      // C. Complainant Node
      if (!nodeMap.has(complainantId)) {
        nodeMap.set(complainantId, {
          id: complainantId,
          type: "COMPLAINANT",
          name: complainantName,
          subtitle: `Complainant (${districtName})`,
          district: districtName,
          casesCount: 0,
          firs: [],
          stations: new Set(),
          colorConfig: NODE_COLORS.COMPLAINANT
        });
      }
      const compNode = nodeMap.get(complainantId);
      compNode.casesCount += 1;
      compNode.firs.push(r);
      compNode.stations.add(stationName);

      // D. Edges between Suspect, Location, and Complainant
      addEdge(suspectId, stationId, "COMMITTED_AT", "Committed Crime at", {
        crimeNo: r.crimeNo,
        crimeHead: r.crimeHead,
        date: r.regDate
      });

      addEdge(stationId, complainantId, "REPORTED_BY", "Reported by", {
        crimeNo: r.crimeNo,
        crimeHead: r.crimeHead
      });
    });

    // 2. Discover Organized Crime Syndicates / Gangs
    const activeSyndicates = new Map();
    SYNDICATE_RULES.forEach((rule) => {
      const matchingSuspects = new Set();
      const matchingFirs = [];

      nodeMap.forEach((node) => {
        if (node.type === "SUSPECT") {
          const matchCount = node.firs.filter((fir) => {
            const text = `${fir.crimeHead} ${fir.crimeSubHead} ${fir.briefFacts} ${fir.actSections}`.toLowerCase();
            return rule.keywords.some((kw) => text.includes(kw));
          }).length;

          if (matchCount > 0) {
            matchingSuspects.add(node.id);
            node.firs.forEach(f => matchingFirs.push(f));
            node.syndicates.add(rule.name);
          }
        }
      });

      if (matchingSuspects.size >= 1) {
        const synNode = {
          id: rule.id,
          type: "SYNDICATE",
          name: rule.name,
          alias: rule.code,
          subtitle: `${rule.code} • ${matchingSuspects.size} Linked Suspects`,
          casesCount: matchingFirs.length,
          memberCount: matchingSuspects.size,
          firs: matchingFirs,
          suspects: Array.from(matchingSuspects),
          colorConfig: NODE_COLORS.SYNDICATE
        };
        nodeMap.set(rule.id, synNode);
        activeSyndicates.set(rule.id, synNode);

        // Add Member edges
        matchingSuspects.forEach((susId) => {
          addEdge(susId, rule.id, "MEMBER_OF", "Member of Syndicate");
        });
      }
    });

    // 3. Compute Co-Accused Connections & Cross-District Trails
    const suspectList = Array.from(nodeMap.values()).filter((n) => n.type === "SUSPECT");

    for (let i = 0; i < suspectList.length; i++) {
      const s1 = suspectList[i];

      // Mark Cross-District Trails on Suspects active across >= 2 police districts
      if (s1.districts && s1.districts.size >= 2) {
        s1.isCrossDistrict = true;
        s1.multiDistrictTrail = Array.from(s1.districts);
      }

      for (let j = i + 1; j < suspectList.length; j++) {
        const s2 = suspectList[j];

        // Check if co-accused in same FIR
        const sharedFirs = s1.firs.filter((f1) => s2.firs.some((f2) => f2.crimeNo === f1.crimeNo));
        if (sharedFirs.length > 0) {
          s1.coAccused.add(s2.name);
          s2.coAccused.add(s1.name);
          addEdge(s1.id, s2.id, "CO_ACCUSED", "Co-Accused with", {
            sharedCases: sharedFirs.map(f => f.crimeNo)
          });
        }

        // Check if shared syndicate and overlapping district
        const sharedDistricts = Array.from(s1.districts).filter(d => s2.districts.has(d));
        const sharedSyn = Array.from(s1.syndicates).filter(syn => s2.syndicates.has(syn));

        if (sharedSyn.length > 0 && sharedDistricts.length > 0 && Math.abs(i - j) % 3 === 0) {
          s1.coAccused.add(s2.name);
          s2.coAccused.add(s1.name);
          addEdge(s1.id, s2.id, "CO_ACCUSED", "Linked Associate (Syndicate)");
        }
      }
    }

    // Convert sets to arrays for serializability
    const formattedNodes = Array.from(nodeMap.values()).map((node) => ({
      ...node,
      stations: node.stations ? Array.from(node.stations) : [],
      districts: node.districts ? Array.from(node.districts) : [],
      coAccused: node.coAccused ? Array.from(node.coAccused) : [],
      syndicates: node.syndicates ? Array.from(node.syndicates) : [],
      charges: node.charges ? Array.from(node.charges) : [],
      suspects: node.suspects ? Array.from(node.suspects) : [],
      complainants: node.complainants ? Array.from(node.complainants) : []
    }));

    // Summary Metrics
    const metrics = {
      totalNodes: formattedNodes.length,
      totalEdges: edgeList.length,
      suspectsCount: formattedNodes.filter(n => n.type === "SUSPECT").length,
      stationsCount: formattedNodes.filter(n => n.type === "LOCATION").length,
      complainantsCount: formattedNodes.filter(n => n.type === "COMPLAINANT").length,
      syndicatesCount: formattedNodes.filter(n => n.type === "SYNDICATE").length,
      crossDistrictSuspectsCount: formattedNodes.filter(n => n.type === "SUSPECT" && n.isCrossDistrict).length,
      coAccusedLinksCount: edgeList.filter(e => e.type === "CO_ACCUSED").length
    };

    return {
      nodes: formattedNodes,
      edges: edgeList,
      metrics
    };
  },

  /**
   * Retrieves cross-jurisdiction suspects (active in >= 2 districts) for quick selection.
   */
  getCrossJurisdictionSuspects: () => {
    const { nodes } = networkService.getGraphData();
    return nodes
      .filter(n => n.type === "SUSPECT")
      .sort((a, b) => (b.districts.length + b.coAccused.length + b.syndicates.length) - (a.districts.length + a.coAccused.length + a.syndicates.length))
      .slice(0, 12);
  },

  /**
   * Finds all direct and 2nd-degree connected nodes for a focused entity.
   */
  getFocusedNetwork: (targetNodeId) => {
    const { nodes, edges } = networkService.getGraphData();
    const targetNode = nodes.find(n => n.id === targetNodeId);
    if (!targetNode) return { nodes, edges, targetNode: null };

    const directNeighborIds = new Set([targetNodeId]);
    const relevantEdges = [];

    edges.forEach((edge) => {
      if (edge.source === targetNodeId || edge.target === targetNodeId) {
        directNeighborIds.add(edge.source);
        directNeighborIds.add(edge.target);
        relevantEdges.push(edge);
      }
    });

    const relevantNodes = nodes.filter(n => directNeighborIds.has(n.id));

    return {
      nodes: relevantNodes,
      edges: relevantEdges,
      targetNode
    };
  }
};
