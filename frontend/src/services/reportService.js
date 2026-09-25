import { recordService } from "./recordService";

const templates = [
  {
    id: "exec_summary",
    title: "Executive Crime Summary",
    desc: "High-level strategic crime overview and threat vector analysis for DG&IGP briefing.",
    icon: "FaFileSignature"
  },
  {
    id: "district_analysis",
    title: "District Crime Analysis",
    desc: "Geospatial incident statistics, hotspot evaluations, and jurisdictional case trends.",
    icon: "FaMapMarkedAlt"
  },
  {
    id: "officer_dossier",
    title: "Officer Performance Report",
    desc: "Dossier auditing case closure success, average detection times, and workload counts.",
    icon: "FaUserTie"
  },
  {
    id: "investigation_brief",
    title: "Investigation Dossier",
    desc: "Detailed life-cycle summary of specific critical CCTNS CaseMaster records.",
    icon: "FaFolderOpen"
  },
  {
    id: "fir_summary",
    title: "FIR Summary",
    desc: "Aggregated overview of newly registered cognizable and non-cognizable offences.",
    icon: "FaClipboardList"
  },
  {
    id: "trend_analysis",
    title: "Crime Trend Analysis",
    desc: "Time-series monthly fluctuations, forecasting models, and MO match alerts.",
    icon: "FaChartLine"
  },
  {
    id: "monthly_brief",
    title: "Monthly Intelligence Brief",
    desc: "Comprehensive monthly audit highlighting threat vectors and tactical advisories.",
    icon: "FaCalendarAlt"
  }
];

const mockRecentReports = [
  { id: "rep-101", title: "Bengaluru_Cyber_Briefing_Q2.pdf", date: "2026-07-17 14:15", size: "1.4 MB", type: "PDF" },
  { id: "rep-102", title: "NDPS_Mangaluru_Raid_Dossier.csv", date: "2026-07-16 11:22", size: "842 KB", type: "EXCEL" },
  { id: "rep-103", title: "Officer_Performance_Audit_Belagavi.pdf", date: "2026-07-15 09:30", size: "2.1 MB", type: "PDF" },
  { id: "rep-104", title: "Karnataka_Annual_FIR_Summary.csv", date: "2026-07-14 17:45", size: "4.8 MB", type: "EXCEL" }
];

const generateReportContent = (templateId, config) => {
  const districtName = config.district || "";
  const category = config.category || "";
  const officerName = config.officerName || "";
  const scope = config.scope || "Detailed";
  const priority = config.priority || "Routine";
  const dateRange = `${config.startDate || "2026-01-01"} TO ${config.endDate || "2026-07-19"}`;

  // Fetch all database records and filter using config parameters
  const allRecords = recordService.getRecords();
  const matchedRecords = allRecords.filter((r) => {
    if (districtName && r.district !== districtName) return false;
    if (category && r.crimeHead !== category) return false;
    if (officerName && !r.allottedOfficerName?.toLowerCase().includes(officerName.toLowerCase())) return false;
    if (config.startDate && r.regDate && r.regDate < config.startDate) return false;
    if (config.endDate && r.regDate && r.regDate > config.endDate) return false;
    return true;
  });

  const totalMatched = matchedRecords.length;
  const activeCount = matchedRecords.filter((r) => r.status !== "Case Closed / Completed").length;
  const closedCount = matchedRecords.filter((r) => r.status === "Case Closed / Completed").length;
  const criticalCount = matchedRecords.filter((r) => r.severity === "CRITICAL" || r.severity === "HIGH").length;

  const tObj = templates.find((t) => t.id === templateId);

  return {
    title: tObj ? tObj.title.toUpperCase() : "CCTNS DATABASE REPORT EXPORT",
    subtitle: `FILTERED CCTNS DATABASE AUDIT • ${districtName ? districtName.toUpperCase() : "STATEWIDE (ALL DISTRICTS)"}`,
    classification: priority === "Critical" ? "SECRET / MOST IMMEDIATE" : "RESTRICTED",
    date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    meta: {
      district: districtName || "ALL DISTRICTS (STATEWIDE)",
      category: category || "ALL CRIME CATEGORIES",
      officer: officerName || "ALL DISTRICT PERSONNEL",
      dateRange,
      scope,
      priority
    },
    summary: `Official CCTNS database compilation for ${districtName || "Statewide Jurisdiction"}. Query filtered ${totalMatched} FIR cases matching active search criteria. Active investigations: ${activeCount}, Resolved cases: ${closedCount}, High-priority alerts: ${criticalCount}.`,
    kpis: [
      { label: "FILTERED FIR MATCHES", value: `${totalMatched} Records` },
      { label: "UNDER INVESTIGATION", value: `${activeCount} Active` },
      { label: "CASES RESOLVED", value: `${closedCount} Closed` }
    ],
    findings: [
      `Database query executed across CCTNS Master Repository for ${districtName || "All Districts"}.`,
      `${totalMatched} FIR records retrieved matching active category and temporal bounds.`,
      `Resolution efficiency standing at ${totalMatched > 0 ? Math.round((closedCount / totalMatched) * 100) : 100}% for queried criteria.`
    ],
    recommendations: [
      "Print or save as PDF for official police command distribution.",
      "Export CSV data sheet for cross-departmental auditing."
    ],
    recordsTable: matchedRecords
  };
};

export const reportService = {
  getTemplates: () => templates,
  
  getRecentReports: () => mockRecentReports,
  
  generateReport: async (templateId, config) => {
    // Brief compilation delay
    await new Promise(resolve => setTimeout(resolve, 300));
    return generateReportContent(templateId, config);
  }
};
