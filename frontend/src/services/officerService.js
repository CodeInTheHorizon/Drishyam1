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

const officersDatabase = {};

const OFFICERS_STORAGE_KEY = "mpp_custom_officers_v7";

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
    const raw = localStorage.getItem("mpp_auth_users_v7") || localStorage.getItem("ksp_auth_users_v6_pinterest_avatars");
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
          const customMap = {};
          json.data.forEach((emp, idx) => {
            const badge = emp.badgeNumber || `MPP-${emp.ROWID || emp.EmployeeID}`;
            customMap[badge] = {
              badgeNumber: badge,
              name: emp.name,
              rank: emp.rank || "Police Inspector",
              unit: emp.unit || "General Unit",
              station: emp.station || "Bhopal Range",
              yearsOfService: emp.yearsOfService || 5,
              status: emp.status || "On Duty",
              avatar: emp.avatar || OFFICER_PHOTOS[idx % OFFICER_PHOTOS.length],
              ROWID: emp.ROWID || badge,
              EmployeeID: emp.EmployeeID || badge,
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
                strongArea: "Jurisdictional Crime Investigation & Case Management",
                workloadStatus: "Optimal",
                rating: "5.0 / 5.0",
                aiRecommendation: "Active on duty.",
                lastUpdated: "Just now"
              }
            };
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
            { name: "CDR / IPDR", value: 12, color: "#06b6d4" },
            { name: "Bank / UPI Logs", value: 8, color: "#10b981" },
            { name: "Email Headers", value: 4, color: "#f59e0b" }
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
    const badgeKey = badgeNumber || `MPP-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    const payload = {
      badgeNumber: badgeKey,
      name,
      rank: rank || "Police Inspector",
      unit: unit || "General Crime Unit",
      station: station || "Bhopal Range",
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
      } else {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server validation failed with status ${res.status}`);
      }
    } catch (e) {
      console.error("[officerService] Backend API POST exception:", e.message);
      throw e;
    }

    const newProfile = {
      badgeNumber: (createdOfficer && createdOfficer.badgeNumber) || badgeKey,
      name: (createdOfficer && createdOfficer.name) || name,
      rank: rank || "Police Inspector",
      unit: unit || "General Crime Unit",
      station: station || "Bhopal Range",
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
        { name: "CDR / IPDR", value: 12, color: "#06b6d4" },
        { name: "Bank / UPI Logs", value: 8, color: "#10b981" },
        { name: "Email Headers", value: 4, color: "#f59e0b" }
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
          station: prof.station || "Madhya Pradesh Police HQ",
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
