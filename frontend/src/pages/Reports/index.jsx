import React, { useState, useEffect } from "react";
import PageHeader from "../../components/dashboard/PageHeader";
import ReportConfiguration from "../../components/reports/ReportConfiguration";
import ReportPreview from "../../components/reports/ReportPreview";
import RecentReports from "../../components/reports/RecentReports";
import { reportService } from "../../services/reportService";

const Reports = () => {
  const [templates, setTemplates] = useState([]);
  const [activeTemplateId, setActiveTemplateId] = useState("exec_summary");
  const [config, setConfig] = useState({
    district: "",
    category: "",
    officerName: "",
    startDate: "2026-06-01",
    endDate: "2026-07-17",
    format: "PDF",
    scope: "Detailed",
    priority: "Routine"
  });
  
  const [previewData, setPreviewData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationQueue, setGenerationQueue] = useState([]);
  const [recentReports, setRecentReports] = useState([]);

  // Load templates & default briefing on mount
  useEffect(() => {
    const list = reportService.getTemplates();
    setTemplates(list);
    setRecentReports(reportService.getRecentReports());
    
    // Auto-generate default preview on mount
    reportService.generateReport("exec_summary", {
      district: "Bengaluru City",
      category: "Cyber Crimes",
      officerName: "ACP Rajeshwari N.",
      startDate: "2026-06-01",
      endDate: "2026-07-17",
      format: "PDF",
      scope: "Detailed",
      priority: "Routine"
    }).then(res => setPreviewData(res));
  }, []);

  const handleSelectTemplate = async (templateId) => {
    setActiveTemplateId(templateId);
    
    // Auto-update preview data for selected template with active configurations immediately
    const res = await reportService.generateReport(templateId, config);
    setPreviewData(res);
  };

  const handleConfigChange = (name, value) => {
    setConfig((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGeneratePreview = async () => {
    setIsGenerating(true);
    const activeTemplate = templates.find(t => t.id === activeTemplateId);
    const mockQueueItem = { title: activeTemplate ? activeTemplate.title.slice(0, 15) : "Report" };
    
    setGenerationQueue([mockQueueItem]);

    try {
      const res = await reportService.generateReport(activeTemplateId, config);
      setPreviewData(res);

      // Append to recent reports list
      const formatExt = config.format.toLowerCase();
      const cleanTitle = activeTemplate 
        ? activeTemplate.title.replace(/\s+/g, "_") 
        : "Operational_Briefing";
      const newReport = {
        id: `rep-${Date.now()}`,
        title: `${cleanTitle}_${Date.now().toString().slice(-4)}.${formatExt}`,
        date: new Date().toLocaleDateString("en-IN", { hour: "numeric", minute: "numeric", hour12: false }),
        size: config.format === "PDF" ? "1.4 MB" : "920 KB",
        type: config.format
      };
      setRecentReports((prev) => [newReport, ...prev]);
    } catch (err) {
      console.error("Failed to compile report preview:", err);
    } finally {
      setIsGenerating(false);
      setGenerationQueue([]);
    }
  };

  const handleExport = (format) => {
    if (format === "PDF") {
      window.print();
    } else if (format === "EXCEL" || format === "CSV") {
      if (!previewData || !previewData.recordsTable || previewData.recordsTable.length === 0) {
        alert("No filtered records available for spreadsheet export.");
        return;
      }

      const headers = ["Crime No", "Date", "District", "Police Station", "Category", "Act Sections", "Officer", "Complainant", "Status", "Severity"];
      const rows = previewData.recordsTable.map((r) => [
        `"${r.crimeNo || ""}"`,
        `"${r.regDate || ""}"`,
        `"${r.district || ""}"`,
        `"${r.unit || ""}"`,
        `"${r.crimeHead || ""}"`,
        `"${(r.actSections || "").replace(/"/g, '""')}"`,
        `"${r.allottedOfficerName || ""}"`,
        `"${r.complainantName || ""}"`,
        `"${r.status || ""}"`,
        `"${r.severity || ""}"`
      ]);

      const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `CCTNS_Filtered_Crime_Report_${Date.now().toString().slice(-6)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = () => {
    alert("Report metadata successfully routed to KSP Command Directory.");
  };

  const handleSchedule = () => {
    alert("Report compilation schedule registered. Cron task: Weekly @ Monday 08:00.");
  };

  const handleDownload = (report) => {
    window.print();
  };

  return (
    <div>
      {/* Page Title Header */}
      <PageHeader
        title="Intelligence Report Center"
        subtitle="Configure, compile, and export operational police logs, trial briefs, and executive summaries"
      />

      <div style={{ height: "32px" }} />

      {/* Main Core Columns Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Side: Parameters Form and Live Document Preview Sheet (3 col spans) */}
        <div className="lg:col-span-3">
          <ReportConfiguration
            config={config}
            onConfigChange={handleConfigChange}
            onGeneratePreview={handleGeneratePreview}
            isGenerating={isGenerating}
          />

          <div style={{ height: "32px" }}></div>

          <ReportPreview
            reportData={previewData}
            onExport={handleExport}
            onShare={handleShare}
            onSchedule={handleSchedule}
          />
        </div>

        {/* Right Side: Operations Sidebar Audit (1 col span) */}
        <div className="lg:col-span-1">
          <RecentReports
            recentReports={recentReports}
            generationQueue={generationQueue}
            onDownload={handleDownload}
          />
        </div>

      </div>
    </div>
  );
};

export default Reports;
