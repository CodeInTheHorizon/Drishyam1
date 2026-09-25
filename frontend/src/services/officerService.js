// Live Officer Dossier Service connected to Zoho Catalyst Online Data Store (Employee table)

const OFFICER_PHOTOS = [
  "https://i.pinimg.com/1200x/27/0c/e1/270ce1193cbdc1cb9f4211e8e0eaf87d.jpg",
  "https://i.pinimg.com/1200x/3a/01/97/3a0197357a4ad3428b34eb8884cf4cea.jpg",
  "https://i.pinimg.com/736x/2c/11/3f/2c113fd9405b68fa8e59fbf22a17ed45.jpg",
  "https://i.pinimg.com/1200x/4a/00/0f/4a000f954bc84e713ce910bc90de34f9.jpg",
  "https://i.pinimg.com/736x/09/74/48/0974482cba0effe8a902070d27fcc952.jpg",
  "https://i.pinimg.com/1200x/18/1e/26/181e26c023cfd2c8eee90ebb99fbddfb.jpg",
  "https://i.pinimg.com/736x/a5/9f/3e/a59f3e2c45390d5ff9ba4291a77f1212.jpg",
  "https://i.pinimg.com/736x/80/7b/ec/807bec8232c15e4db104f32fa1887835.jpg"
];

const officersDatabase = {
  "KSP-8821": {
    badgeNumber: "KSP-8821",
    name: "Ramesh Gowda",
    rank: "PSI",
    unit: "Koramangala Police Station",
    station: "Bengaluru City",
    yearsOfService: 6,
    status: "On Duty",
    avatar: OFFICER_PHOTOS[0],
    ROWID: "KSP-8821",
    kpis: { totalCases: 5, activeCases: 2, closedCases: 3, chargesheetRate: 80, avgInvestigationTime: 28, detectionRate: 85 },
    workload: { highPriority: [], pending: [], hearings: [], recent: [] },
    summary: { strongArea: "Property Crimes & Burglary Detection", workloadStatus: "Optimal", rating: "4.8 / 5.0", aiRecommendation: "Highly effective at field operations.", lastUpdated: "Just now" }
  },
  "KSP-7455": {
    badgeNumber: "KSP-7455",
    name: "PSI Manjunath",
    rank: "PSI",
    unit: "Vidyaranyapuram Police Station",
    station: "Mysuru City",
    yearsOfService: 4,
    status: "On Duty",
    avatar: OFFICER_PHOTOS[1],
    ROWID: "KSP-7455",
    kpis: { totalCases: 4, activeCases: 1, closedCases: 3, chargesheetRate: 85, avgInvestigationTime: 30, detectionRate: 90 },
    workload: { highPriority: [], pending: [], hearings: [], recent: [] },
    summary: { strongArea: "Cyber Fraud & Online Cheating Tracking", workloadStatus: "Optimal", rating: "4.9 / 5.0", aiRecommendation: "Strong computer forensic expertise.", lastUpdated: "Just now" }
  },
  "KSP-6120": {
    badgeNumber: "KSP-6120",
    name: "Inspector Patil",
    rank: "PI",
    unit: "Kadri Police Station",
    station: "Mangaluru City",
    yearsOfService: 12,
    status: "On Duty",
    avatar: OFFICER_PHOTOS[2],
    ROWID: "KSP-6120",
    kpis: { totalCases: 3, activeCases: 0, closedCases: 3, chargesheetRate: 100, avgInvestigationTime: 20, detectionRate: 95 },
    workload: { highPriority: [], pending: [], hearings: [], recent: [] },
    summary: { strongArea: "Cyber Crime & Assault Tracking", workloadStatus: "Optimal", rating: "5.0 / 5.0", aiRecommendation: "Senior leadership profile.", lastUpdated: "Just now" }
  },
  "KSP-4933": {
    badgeNumber: "KSP-4933",
    name: "PSI Anjali",
    rank: "PSI",
    unit: "Camp Police Station",
    station: "Belagavi District",
    yearsOfService: 5,
    status: "On Duty",
    avatar: OFFICER_PHOTOS[3],
    ROWID: "KSP-4933",
    kpis: { totalCases: 2, activeCases: 1, closedCases: 1, chargesheetRate: 75, avgInvestigationTime: 35, detectionRate: 80 },
    workload: { highPriority: [], pending: [], hearings: [], recent: [] },
    summary: { strongArea: "SLL & Community Dispute Settlements", workloadStatus: "Optimal", rating: "4.7 / 5.0", aiRecommendation: "Excellent communal counseling records.", lastUpdated: "Just now" }
  },
  "KSP-3211": {
    badgeNumber: "KSP-3211",
    name: "PSI Sandeep",
    rank: "PSI",
    unit: "Town Police Station",
    station: "Shivamogga",
    yearsOfService: 3,
    status: "On Duty",
    avatar: OFFICER_PHOTOS[4],
    ROWID: "KSP-3211",
    kpis: { totalCases: 1, activeCases: 1, closedCases: 0, chargesheetRate: 60, avgInvestigationTime: 40, detectionRate: 70 },
    workload: { highPriority: [], pending: [], hearings: [], recent: [] },
    summary: { strongArea: "Law and Order Maintenance & Mob Control", workloadStatus: "Underloaded", rating: "4.5 / 5.0", aiRecommendation: "Available for case intake.", lastUpdated: "Just now" }
  },
  "KSP-5022": {
    badgeNumber: "KSP-5022",
    name: "ASI Siddaramaiah",
    rank: "ASI",
    unit: "City Police Station",
    station: "Tumakuru",
    yearsOfService: 15,
    status: "On Duty",
    avatar: OFFICER_PHOTOS[5],
    ROWID: "KSP-5022",
    kpis: { totalCases: 0, activeCases: 0, closedCases: 0, chargesheetRate: 85, avgInvestigationTime: 30, detectionRate: 90 },
    workload: { highPriority: [], pending: [], hearings: [], recent: [] },
    summary: { strongArea: "CCTNS Digital Record Maintenance & Verification", workloadStatus: "Optimal", rating: "4.9 / 5.0", aiRecommendation: "Senior administrator.", lastUpdated: "Just now" }
  }
};

const OFFICERS_STORAGE_KEY = "ksp_custom_officers_v5_pinterest_photos";

const loadCustomOfficers = () => {
  try {
    const raw = localStorage.getItem(OFFICERS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    return {};
  }
};

const saveCustomOfficers = (customMap) => {
  try {
    localStorage.setItem(OFFICERS_STORAGE_KEY, JSON.stringify(customMap));
  } catch (err) {
    console.error("Failed saving custom officers:", err);
  }
};

import { recordService } from "./recordService";

const getAuthUserByBadgeOrName = (badgeNumber, name) => {
  try {
    const raw = localStorage.getItem("ksp_auth_users_v2");
    if (!raw) return null;
    const users = JSON.parse(raw);
    return users.find(
      (u) =>
        u.badge === badgeNumber ||
        u.kgid === badgeNumber ||
        (u.name && name && u.name.toLowerCase().trim() === name.toLowerCase().trim())
    );
  } catch (err) {
    return null;
  }
};

export const officerService = {
  fetchRemoteOfficers: async () => {
    try {
      const res = await fetch('/api/officers');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const customMap = loadCustomOfficers();
          json.data.forEach((emp, idx) => {
            const badge = emp.badgeNumber || `KSP-${emp.ROWID}`;
            if (!customMap[badge]) {
              customMap[badge] = {
                badgeNumber: badge,
                name: emp.name,
                rank: emp.rank || "Police Inspector",
                unit: emp.unit || "General Unit",
                station: emp.station || "Bengaluru Range",
                yearsOfService: emp.yearsOfService || 5,
                status: emp.status || "On Duty",
                avatar: OFFICER_PHOTOS[idx % OFFICER_PHOTOS.length],
                ROWID: emp.ROWID,
                kpis: {
                  totalCases: 0,
                  activeCases: 0,
                  closedCases: 0,
                  chargesheetRate: 85,
                  avgInvestigationTime: 30,
                  detectionRate: 90
                },
                workload: { highPriority: [], pending: [], hearings: [], recent: [] },
                summary: {
                  strongArea: "Field Investigation & Patrol Tracking",
                  workloadStatus: "Optimal",
                  rating: "5.0 / 5.0",
                  aiRecommendation: "Active on duty.",
                  lastUpdated: "Just now"
                }
              };
            }
          });
          saveCustomOfficers(customMap);
          return customMap;
        }
      }
    } catch (err) {
      console.warn("[officerService] Online officer fetch exception:", err.message);
    }
    return loadCustomOfficers();
  },

  getOfficers: () => {
    const customMap = loadCustomOfficers();
    const mergedMap = { ...officersDatabase, ...customMap };
    
    return Object.keys(mergedMap).map(key => {
      const authUser = getAuthUserByBadgeOrName(key, mergedMap[key].name);
      return {
        badgeNumber: key,
        name: authUser?.name || mergedMap[key].name,
        rank: authUser?.rank || mergedMap[key].rank,
        unit: authUser?.unit || mergedMap[key].unit,
        avatar: authUser?.avatar || mergedMap[key].avatar
      };
    });
  },
  
  getOfficerProfile: (badgeNumber) => {
    const customMap = loadCustomOfficers();
    const mergedMap = { ...officersDatabase, ...customMap };
    const base = mergedMap[badgeNumber];
    if (!base) return null;

    // Sync avatar & user edits from auth database
    const authUser = getAuthUserByBadgeOrName(badgeNumber, base.name);
    const updatedAvatar = authUser?.avatar || base.avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250&auto=format&fit=crop";
    const updatedName = authUser?.name || base.name;
    const updatedUnit = authUser?.unit || base.unit;
    const updatedRank = authUser?.rank || base.rank;

    // Merge live dynamic analytics from recordService
    const liveStats = recordService.getOfficerAnalytics(updatedName);

    return {
      ...base,
      categoryDistribution: liveStats.categoryDistribution && liveStats.categoryDistribution.length > 0 
        ? liveStats.categoryDistribution 
        : (base.categoryDistribution || [
            { name: "Property Offences", value: 12, color: "#3b82f6" },
            { name: "Cyber Crimes", value: 8, color: "#a855f7" },
            { name: "Financial Fraud", value: 4, color: "#f59e0b" }
          ]),
      monthlyTrend: liveStats.monthlyTrend && liveStats.monthlyTrend.length > 0
        ? liveStats.monthlyTrend
        : (base.monthlyTrend || [
            { month: "Jan", assigned: 4, resolved: 3 },
            { month: "Feb", assigned: 5, resolved: 4 },
            { month: "Mar", assigned: 3, resolved: 4 },
            { month: "Apr", assigned: 6, resolved: 5 },
            { month: "May", assigned: 4, resolved: 4 },
            { month: "Jun", assigned: 5, resolved: 4 }
          ]),
      name: updatedName,
      unit: updatedUnit,
      rank: updatedRank,
      avatar: updatedAvatar,
      kpis: {
        ...base.kpis,
        totalCases: liveStats.totalCases,
        activeCases: liveStats.activeCases,
        closedCases: liveStats.closedCases,
        chargesheetRate: liveStats.chargesheetRate,
        detectionRate: Math.min(98, liveStats.chargesheetRate + 5)
      },
      workload: {
        ...base.workload,
        dockets: liveStats.dockets || base.workload.dockets || [],
        highPriority: liveStats.highPriority.length > 0 ? liveStats.highPriority : base.workload.highPriority,
        pending: liveStats.pending.length > 0 ? liveStats.pending : base.workload.pending,
        recent: liveStats.recent.length > 0 ? liveStats.recent : base.workload.recent
      }
    };
  },

  addOfficer: async (officerData) => {
    const { name, rank, badgeNumber, unit, station, yearsOfService, specialArea, username, password, avatar } = officerData;
    const badgeKey = badgeNumber || `KSP-2026-${Date.now().toString().slice(-4)}`;

    const payload = {
      badgeNumber: badgeKey,
      name,
      rank: rank || "Police Inspector",
      unit: unit || "General Crime Unit",
      station: station || "Bengaluru Range",
      yearsOfService: Number(yearsOfService) || 5
    };

    let createdOfficer = null;

    try {
      console.log("[officerService] Sending Add Officer form submission to backend Catalyst API...");
      const res = await fetch('/api/officers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          createdOfficer = json.data;
          console.log("[officerService] Officer registered online in Zoho Catalyst Data Store! ROWID:", json.data.ROWID);
        }
      }
    } catch (e) {
      console.warn("[officerService] Backend API POST exception:", e.message);
    }

    const newProfile = {
      badgeNumber: (createdOfficer && createdOfficer.badgeNumber) || badgeKey,
      name: (createdOfficer && createdOfficer.name) || name,
      rank: rank || "Police Inspector",
      unit: unit || "General Crime Unit",
      station: station || "Bengaluru Range",
      yearsOfService: Number(yearsOfService) || 5,
      status: "On Duty",
      ROWID: (createdOfficer && createdOfficer.ROWID) || badgeKey,
      avatar: avatar || "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=250&auto=format&fit=crop",
      username: username || "",
      kpis: {
        totalCases: 24,
        activeCases: 6,
        closedCases: 18,
        chargesheetRate: 85,
        avgInvestigationTime: 35,
        detectionRate: 90
      },
      categoryDistribution: [
        { name: "Property Offences", value: 12, color: "#3b82f6" },
        { name: "Cyber Crimes", value: 8, color: "#a855f7" },
        { name: "Financial Fraud", value: 4, color: "#f59e0b" }
      ],
      monthlyTrend: [
        { month: "Jan", assigned: 4, resolved: 3 },
        { month: "Feb", assigned: 5, resolved: 4 },
        { month: "Mar", assigned: 3, resolved: 4 },
        { month: "Apr", assigned: 6, resolved: 5 },
        { month: "May", assigned: 4, resolved: 4 },
        { month: "Jun", assigned: 5, resolved: 4 }
      ],
      timeline: [
        { stage: "Officer Onboarded", date: new Date().toISOString().split("T")[0], desc: `Officer registered into CCTNS active duty roster by Admin.`, status: "completed" }
      ],
      workload: {
        highPriority: [
          { caseNo: "CR-2026-001", title: "Active Jurisdiction CCTNS Monitoring", status: "Active", date: "Today" }
        ],
        pending: [],
        hearings: [],
        recent: []
      },
      summary: {
        strongArea: specialArea || "Field Investigation & Case Tracking",
        workloadStatus: "Optimal",
        rating: "5.0 / 5.0",
        aiRecommendation: "Dossier initialized. Active for case assignments.",
        lastUpdated: "Just now"
      }
    };

    const customMap = loadCustomOfficers();
    customMap[newProfile.badgeNumber] = newProfile;
    saveCustomOfficers(customMap);

    return newProfile;
  },

  getOfficerOfTheMonth: () => {
    const customMap = loadCustomOfficers();
    const mergedMap = { ...officersDatabase, ...customMap };
    const list = Object.keys(mergedMap);
    if (!list || list.length === 0) return null;

    let bestOfficer = null;
    let maxScore = -1;

    list.forEach((badge) => {
      const prof = officerService.getOfficerProfile(badge);
      if (!prof) return;

      const closed = prof.kpis?.closedCases || 0;
      const rate = prof.kpis?.chargesheetRate || 0;
      const score = closed * 2 + rate * 1.5;

      if (score > maxScore) {
        maxScore = score;
        bestOfficer = {
          badgeNumber: prof.badgeNumber,
          name: prof.name,
          rank: prof.rank,
          unit: prof.unit,
          station: prof.station || "Karnataka Police HQ",
          yearsOfService: prof.yearsOfService || 10,
          avatar: prof.avatar,
          casesSolvedMonth: Math.max(12, Math.round(closed / 5) + 4),
          totalCasesClosed: closed,
          clearanceRate: rate,
          detectionRate: prof.kpis?.detectionRate || 92,
          specialArea: prof.summary?.strongArea || "Field Operations & Investigation",
          commendation: "Awarded Director General's Honor Star for highest case resolution and investigation efficiency in previous month."
        };
      }
    });

    return bestOfficer;
  }
};
