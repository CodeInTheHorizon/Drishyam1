/**
 * crimeService.js
 * 
 * GIS Crime Map Data Service connected directly to recordService (Zoho Catalyst Datastore).
 * Transforms live FIR records into map pins, district heatmaps, and spatial intelligence.
 */

import { recordService } from "./recordService";

const districtsList = [
  "Bhopal",
  "Indore",
  "Jabalpur",
  "Gwalior",
  "Ujjain",
  "Sagar",
  "Rewa",
  "Satna",
  "Chhindwara",
  "Ratlam",
  "Dewas",
  "Dhar",
  "Datia",
  "Guna",
  "Harda",
  "Hoshangabad",
  "Katni",
  "Mandla",
  "Mandsaur",
  "Morena",
  "Narsinghpur",
  "Neemuch",
  "Panna",
  "Raisen",
  "Rajgarh",
  "Sehore",
  "Seoni",
  "Shahdol",
  "Shajapur",
  "Sheopur",
  "Shivpuri",
  "Sidhi",
  "Tikamgarh",
  "Umaria",
  "Vidisha",
  "Anuppur",
  "Ashoknagar",
  "Balaghat",
  "Barwani",
  "Betul",
  "Bhind",
  "Burhanpur",
  "Chhatarpur",
  "Damoh",
  "Dindori",
  "Jhabua",
  "East Nimar",
  "West Nimar"
];

const categoriesList = [
  "CDR / IPDR",
  "Bank / UPI Logs",
  "Email Headers",
  "Chat Exports",
  "Android / APK Logs"
];

const severitiesList = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
const statusesList = [
  "Under Investigation",
  "Suspect Apprehended",
  "Charge-sheet Submitted",
  "Case Closed / Completed"
];

const districtCoordsMap = [
  { keywords: ["bhopal"], lat: 23.2599, lng: 77.4126, name: "Bhopal" },
  { keywords: ["indore"], lat: 22.7196, lng: 75.8577, name: "Indore" },
  { keywords: ["jabalpur"], lat: 23.1815, lng: 79.9864, name: "Jabalpur" },
  { keywords: ["gwalior"], lat: 26.2183, lng: 78.1828, name: "Gwalior" },
  { keywords: ["ujjain"], lat: 23.1765, lng: 75.7885, name: "Ujjain" },
  { keywords: ["sagar"], lat: 23.8388, lng: 78.7378, name: "Sagar" },
  { keywords: ["rewa"], lat: 24.5362, lng: 81.3037, name: "Rewa" },
  { keywords: ["satna"], lat: 24.6005, lng: 80.8322, name: "Satna" },
  { keywords: ["chhindwara"], lat: 22.0574, lng: 78.9382, name: "Chhindwara" },
  { keywords: ["ratlam"], lat: 23.3315, lng: 75.0367, name: "Ratlam" },
  { keywords: ["dewas"], lat: 22.9676, lng: 76.0534, name: "Dewas" },
  { keywords: ["dhar"], lat: 22.5978, lng: 75.2954, name: "Dhar" },
  { keywords: ["datia"], lat: 25.6653, lng: 78.4609, name: "Datia" },
  { keywords: ["guna"], lat: 24.6469, lng: 77.3060, name: "Guna" },
  { keywords: ["harda"], lat: 22.3445, lng: 77.0933, name: "Harda" },
  { keywords: ["hoshangabad", "narmadapuram"], lat: 22.7519, lng: 77.7289, name: "Hoshangabad" },
  { keywords: ["katni"], lat: 23.8343, lng: 80.3957, name: "Katni" },
  { keywords: ["mandla"], lat: 22.5986, lng: 80.3712, name: "Mandla" },
  { keywords: ["mandsaur"], lat: 24.0722, lng: 75.0683, name: "Mandsaur" },
  { keywords: ["morena"], lat: 26.4948, lng: 77.9940, name: "Morena" },
  { keywords: ["narsinghpur"], lat: 22.9472, lng: 79.1970, name: "Narsinghpur" },
  { keywords: ["neemuch"], lat: 24.4764, lng: 74.8722, name: "Neemuch" },
  { keywords: ["panna"], lat: 24.7208, lng: 80.1983, name: "Panna" },
  { keywords: ["raisen"], lat: 23.3315, lng: 77.7810, name: "Raisen" },
  { keywords: ["rajgarh"], lat: 24.0062, lng: 76.7295, name: "Rajgarh" },
  { keywords: ["sehore"], lat: 23.2032, lng: 77.0844, name: "Sehore" },
  { keywords: ["seoni"], lat: 22.0869, lng: 79.5435, name: "Seoni" },
  { keywords: ["shahdol"], lat: 23.2856, lng: 81.3539, name: "Shahdol" },
  { keywords: ["shajapur"], lat: 23.4269, lng: 76.2777, name: "Shajapur" },
  { keywords: ["sheopur"], lat: 25.6685, lng: 76.6974, name: "Sheopur" },
  { keywords: ["shivpuri"], lat: 25.4316, lng: 77.6649, name: "Shivpuri" },
  { keywords: ["sidhi"], lat: 24.4034, lng: 81.8774, name: "Sidhi" },
  { keywords: ["tikamgarh"], lat: 24.7447, lng: 78.8311, name: "Tikamgarh" },
  { keywords: ["umaria"], lat: 23.5245, lng: 80.8358, name: "Umaria" },
  { keywords: ["vidisha"], lat: 23.5251, lng: 77.8081, name: "Vidisha" },
  { keywords: ["anuppur"], lat: 23.1037, lng: 81.6917, name: "Anuppur" },
  { keywords: ["ashoknagar"], lat: 24.5772, lng: 77.7289, name: "Ashoknagar" },
  { keywords: ["balaghat"], lat: 21.8129, lng: 80.1838, name: "Balaghat" },
  { keywords: ["barwani"], lat: 22.0366, lng: 74.9030, name: "Barwani" },
  { keywords: ["betul"], lat: 21.9013, lng: 77.9015, name: "Betul" },
  { keywords: ["bhind"], lat: 26.5645, lng: 78.7844, name: "Bhind" },
  { keywords: ["burhanpur"], lat: 21.3145, lng: 76.2163, name: "Burhanpur" },
  { keywords: ["chhatarpur"], lat: 24.9164, lng: 79.5811, name: "Chhatarpur" },
  { keywords: ["damoh"], lat: 23.8382, lng: 79.4422, name: "Damoh" },
  { keywords: ["dindori"], lat: 22.9463, lng: 81.0772, name: "Dindori" },
  { keywords: ["jhabua"], lat: 22.7699, lng: 74.5946, name: "Jhabua" },
  { keywords: ["khandwa", "east nimar"], lat: 21.8314, lng: 76.3498, name: "East Nimar" },
  { keywords: ["khargone", "west nimar"], lat: 21.8234, lng: 75.6094, name: "West Nimar" }
];

export const getDistrictCoordinates = (districtName, itemLat, itemLng) => {
  if (itemLat && itemLng && Number(itemLat) !== 12.9716 && Number(itemLng) !== 77.5946 && Number(itemLat) !== 23.2599 && Number(itemLng) !== 77.4126) {
    return { lat: Number(itemLat), lng: Number(itemLng) };
  }
  if (!districtName) return { lat: 23.2599, lng: 77.4126 };
  const dLower = String(districtName).toLowerCase();
  for (const entry of districtCoordsMap) {
    if (entry.keywords.some(k => dLower.includes(k))) {
      return { lat: entry.lat, lng: entry.lng };
    }
  }
  return { lat: Number(itemLat) || 23.2599, lng: Number(itemLng) || 77.4126 };
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
      district: r.district || r.District || "Bhopal",
      unit: r.unit || r.PoliceStation || "City Station",
      date: r.regDate || r.CrimeRegisteredDate || new Date().toISOString().split("T")[0],
      lat: Number(r.lat || r.latiutude) || center.lat,
      lng: Number(r.lng || r.longitude) || center.lng,
      briefFacts: r.briefFacts || r.BriefFacts || "Incident recorded in CCTNS Datastore.",
      assignedOfficer: {
        name: r.allottedOfficerName || r.OfficerName || "Unassigned",
        kgid: r.allottedOfficerKgid || "MPP-0000"
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
      name: districtName || "Madhya Pradesh State (All Filters)",
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
