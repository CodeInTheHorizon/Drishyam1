/**
 * crimeService.js
 * 
 * GIS Crime Map Data Service connected directly to recordService (Zoho Catalyst Datastore).
 * Transforms live FIR records into map pins, district heatmaps, and spatial intelligence.
 */

import { recordService } from "./recordService";

const districtsList = [
  "Bengaluru City",
  "Mysuru City",
  "Mangaluru City",
  "Hubballi-Dharwad",
  "Belagavi",
  "Kalaburagi",
  "Shivamogga",
  "Udupi",
  "Davanagere",
  "Tumakuru",
  "Chikkamagaluru",
  "Bidar",
  "Mandya",
  "Dakshina Kannada",
  "Hassan",
  "Uttara Kannada"
];

const categoriesList = [
  "Theft",
  "Assault",
  "Murder",
  "Property Related",
  "Cyber Crime"
];

const severitiesList = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const statusesList = [
  "Under Investigation",
  "Suspect Apprehended",
  "Charge-sheet Submitted",
  "Case Closed / Completed"
];

const districtCoordsMap = [
  { keywords: ["bengaluru", "bangalore"], lat: 12.9716, lng: 77.5946, name: "Bengaluru City" },
  { keywords: ["mysuru", "mysore"], lat: 12.2958, lng: 76.6394, name: "Mysuru City" },
  { keywords: ["mangaluru", "mangalore", "dakshina kannada"], lat: 12.9141, lng: 74.8560, name: "Mangaluru City" },
  { keywords: ["hubballi", "hubli", "dharwad"], lat: 15.3647, lng: 75.1240, name: "Hubballi-Dharwad" },
  { keywords: ["belagavi", "belgaum"], lat: 15.8497, lng: 74.4977, name: "Belagavi" },
  { keywords: ["kalaburagi", "gulbarga"], lat: 17.3291, lng: 76.8343, name: "Kalaburagi" },
  { keywords: ["shivamogga", "shimoga"], lat: 13.9299, lng: 75.5681, name: "Shivamogga" },
  { keywords: ["udupi"], lat: 13.3409, lng: 74.7421, name: "Udupi" },
  { keywords: ["davanagere", "davangere"], lat: 14.4644, lng: 75.9218, name: "Davanagere" },
  { keywords: ["tumakuru", "tumkur"], lat: 13.3392, lng: 77.1140, name: "Tumakuru" },
  { keywords: ["chikkamagaluru", "chikmagalur"], lat: 13.3161, lng: 75.7720, name: "Chikkamagaluru" },
  { keywords: ["bidar"], lat: 17.9104, lng: 77.5186, name: "Bidar" },
  { keywords: ["mandya"], lat: 12.5218, lng: 76.8973, name: "Mandya" },
  { keywords: ["hassan"], lat: 13.0070, lng: 76.1030, name: "Hassan" },
  { keywords: ["uttara kannada", "karwar"], lat: 14.7900, lng: 74.6800, name: "Uttara Kannada" }
];

export const getDistrictCoordinates = (districtName, itemLat, itemLng) => {
  if (itemLat && itemLng && Number(itemLat) !== 12.9716 && Number(itemLng) !== 77.5946) {
    return { lat: Number(itemLat), lng: Number(itemLng) };
  }
  if (!districtName) return { lat: 12.9716, lng: 77.5946 };
  const dLower = String(districtName).toLowerCase();
  for (const entry of districtCoordsMap) {
    if (entry.keywords.some(k => dLower.includes(k))) {
      return { lat: entry.lat, lng: entry.lng };
    }
  }
  return { lat: Number(itemLat) || 12.9716, lng: Number(itemLng) || 77.5946 };
};

const getLiveIncidents = () => {
  const firs = recordService.getRecords();

  return firs.map((r) => {
    const center = getDistrictCoordinates(r.district, r.lat, r.lng);
    
    return {
      id: r.id || r.ROWID || `fir-${r.crimeNo}`,
      caseNo: r.caseNo || r.crimeNo,
      crimeNo: r.crimeNo,
      category: r.crimeHead || r.CrimeCategory || "Property Offences",
      severity: r.severity || r.Severity || "MEDIUM",
      status: r.status || r.Status || "Under Investigation",
      district: r.district || r.District || "Bengaluru City",
      unit: r.unit || r.PoliceStation || "City Station",
      date: r.regDate || r.CrimeRegisteredDate || new Date().toISOString().split("T")[0],
      lat: Number(r.lat || r.latiutude) || center.lat,
      lng: Number(r.lng || r.longitude) || center.lng,
      briefFacts: r.briefFacts || r.BriefFacts || "Incident recorded in CCTNS Datastore.",
      assignedOfficer: {
        name: r.allottedOfficerName || r.OfficerName || "Unassigned",
        kgid: r.allottedOfficerKgid || "KSP-0000"
      },
      districtCenter: center
    };
  });
};

export const crimeService = {
  getDistricts: () => districtsList,
  getCategories: () => categoriesList,
  getSeverities: () => severitiesList,
  getStatuses: () => statusesList,

  getIncidents: (filters = {}) => {
    let results = getLiveIncidents();

    if (filters.district) {
      results = results.filter((inc) => inc.district === filters.district);
    }
    if (filters.unit) {
      results = results.filter((inc) => inc.unit.toLowerCase().includes(filters.unit.toLowerCase()));
    }
    if (filters.category) {
      results = results.filter((inc) => inc.category === filters.category);
    }
    if (filters.severity) {
      results = results.filter((inc) => inc.severity === filters.severity);
    }
    if (filters.status) {
      results = results.filter((inc) => inc.status === filters.status);
    }
    if (filters.startDate) {
      results = results.filter((inc) => new Date(inc.date) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      results = results.filter((inc) => new Date(inc.date) <= new Date(filters.endDate));
    }

    return results;
  },

  getDistrictMetrics: (districtName, filteredIncidents) => {
    const live = getLiveIncidents();
    const pool = districtName
      ? live.filter((inc) => inc.district === districtName)
      : filteredIncidents || live;

    const total = pool.length;
    const active = pool.filter((inc) => inc.status !== "Case Closed / Completed").length;
    const chargesheeted = pool.filter((inc) => inc.status === "Case Closed / Completed").length;

    const catDistribution = {};
    categoriesList.forEach((cat) => {
      catDistribution[cat] = pool.filter((inc) => inc.category === cat).length;
    });

    const sevBreakdown = {};
    severitiesList.forEach((sev) => {
      sevBreakdown[sev] = pool.filter((inc) => inc.severity === sev).length;
    });

    const uniqueOfficers = new Set(pool.map((inc) => inc.assignedOfficer.kgid));
    const officersCount = Math.max(1, uniqueOfficers.size);

    const sortedIncidents = [...pool].sort((a, b) => new Date(b.date) - new Date(a.date));
    const recentIncidents = sortedIncidents.slice(0, 3);

    return {
      name: districtName || "Karnataka State (All Filters)",
      total,
      active,
      chargesheeted,
      catDistribution,
      sevBreakdown,
      officersCount,
      recentIncidents
    };
  },

  getHotspotDistricts: (filteredIncidents) => {
    const pool = filteredIncidents || getLiveIncidents();
    const counts = {};
    districtsList.forEach((d) => {
      counts[d] = pool.filter((inc) => inc.district === d).length;
    });

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }
};
