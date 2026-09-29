import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/dashboard/PageHeader";
import FIRFormModal from "../../components/records/FIRFormModal";
import FIRDetailModal from "../../components/records/FIRDetailModal";
import HardwareBiometricAuthModal from "../../components/hardware/HardwareBiometricAuthModal";
import ManageRecordsLockScreen from "../../components/records/ManageRecordsLockScreen";
import { recordService } from "../../services/recordService";
import { crimeService } from "../../services/crimeService";
import { hardwareService } from "../../services/hardwareService";
import {
  FaFolderPlus,
  FaSearch,
  FaEye,
  FaEdit,
  FaTrash,
  FaCheckCircle,
  FaUndo,
  FaFilter,
  FaShieldAlt,
  FaUserCheck,
  FaExclamationTriangle,
  FaProjectDiagram,
  FaLock,
  FaUnlock
} from "react-icons/fa";

const ManageRecords = () => {
  const [records, setRecords] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    district: "",
    category: "",
    severity: "",
    status: ""
  });

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Section 2FA Air-Gap Lock State (Locked by default for all users)
  const [isSectionUnlocked, setIsSectionUnlocked] = useState(() => {
    return sessionStorage.getItem("cctns_manage_records_unlocked") === "true";
  });
  const [unlockedOfficer, setUnlockedOfficer] = useState(() => {
    const saved = sessionStorage.getItem("cctns_unlocked_officer");
    try {
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const handleUnlockSuccess = (officer) => {
    setIsSectionUnlocked(true);
    setUnlockedOfficer(officer);
    sessionStorage.setItem("cctns_manage_records_unlocked", "true");
    sessionStorage.setItem("cctns_unlocked_officer", JSON.stringify(officer));
    reloadRecords();
  };

  const handleLockSection = async () => {
    try {
      await hardwareService.lockSection();
    } catch (e) {
      // Non-fatal
    }
    setIsSectionUnlocked(false);
    setUnlockedOfficer(null);
    sessionStorage.removeItem("cctns_manage_records_unlocked");
    sessionStorage.removeItem("cctns_unlocked_officer");
  };

  // Hardware Re-Auth Face States for FIR CRUD
  const [isHwAuthModalOpen, setIsHwAuthModalOpen] = useState(false);
  const [hwAuthCallback, setHwAuthCallback] = useState(null);
  const [hwAuthTitle, setHwAuthTitle] = useState("");
  const [hwAuthType, setHwAuthType] = useState("MANAGE_RECORD");
  const [hwAuthTargetId, setHwAuthTargetId] = useState("RECORD");
  const [hwAuthSummary, setHwAuthSummary] = useState("");

  const requestHardwareAuth = (title, actionType, targetId, summary, callback) => {
    setHwAuthTitle(title);
    setHwAuthType(actionType);
    setHwAuthTargetId(targetId);
    setHwAuthSummary(summary);
    setHwAuthCallback(() => callback);
    setIsHwAuthModalOpen(true);
  };

  // Load records on mount & filter change
  const reloadRecords = () => {
    const data = recordService.getRecords(filters);
    setRecords(data);
  };

  useEffect(() => {
    reloadRecords();

    // Fetch remote records from Catalyst backend and subscribe to updates
    recordService.fetchRemoteRecords().then(() => {
      reloadRecords();
    });

    const unsubscribe = recordService.subscribe(() => {
      reloadRecords();
    });

    return () => unsubscribe();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      district: "",
      category: "",
      severity: "",
      status: ""
    });
  };

  // Handlers for CRUD with Hardware Biometric 2FA protection
  const handleOpenCreateModal = () => {
    requestHardwareAuth(
      "Register New FIR Record",
      "CREATE_FIR",
      "NEW_FIR",
      "Initiating new FIR registration into online CaseMaster",
      () => {
        setSelectedRecord(null);
        setIsFormOpen(true);
      }
    );
  };

  const handleOpenEditModal = (record) => {
    requestHardwareAuth(
      `Edit FIR ${record.crimeNo}`,
      "UPDATE_FIR",
      record.crimeNo,
      `Modifying FIR record details for case ${record.crimeNo}`,
      () => {
        setSelectedRecord(record);
        setIsFormOpen(true);
      }
    );
  };

  const handleOpenDetailModal = (record) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const handleSaveRecord = async (formData) => {
    if (selectedRecord && selectedRecord.id) {
      await recordService.updateRecord(selectedRecord.id, formData);
    } else {
      await recordService.createRecord(formData);
    }
    setIsFormOpen(false);
    setSelectedRecord(null);
    reloadRecords();
  };

  const handleToggleCaseClosed = (id) => {
    const rec = recordService.getRecordById(id);
    const actionText = rec?.status === "Case Closed / Completed" ? "Re-open Case Investigation" : "Mark Case Closed / Completed";

    requestHardwareAuth(
      `${actionText} for ${rec?.crimeNo || 'FIR'}`,
      "UPDATE_STATUS",
      rec?.crimeNo || String(id),
      `${actionText} status update for FIR ${rec?.crimeNo}`,
      () => {
        recordService.toggleCaseClosed(id);
        reloadRecords();
        if (selectedRecord && selectedRecord.id === id) {
          setSelectedRecord(recordService.getRecordById(id));
        }
      }
    );
  };

  const handleDeletePrompt = (id) => {
    const rec = recordService.getRecordById(id);
    requestHardwareAuth(
      `Delete FIR ${rec?.crimeNo || ''}`,
      "DELETE_FIR",
      rec?.crimeNo || String(id),
      `Permanent deletion authorization for FIR ${rec?.crimeNo}`,
      () => {
        setDeleteConfirmId(id);
      }
    );
  };

  const handleDeleteRecord = async (id) => {
    try {
      await recordService.deleteRecord(id);
      await recordService.fetchRemoteRecords();
      reloadRecords();
    } catch (err) {
      console.error("Failed to delete record:", err);
      alert("Failed to delete record from Catalyst Data Store: " + err.message);
    } finally {
      setDeleteConfirmId(null);
    }
  };

  // Statistics Summary
  const stats = useMemo(() => {
    const all = recordService.getRecords();
    const active = all.filter((r) => r.status !== "Case Closed / Completed").length;
    const closed = all.filter((r) => r.status === "Case Closed / Completed").length;
    const critical = all.filter((r) => r.severity === "CRITICAL").length;
    return { total: all.length, active, closed, critical };
  }, [records]);

  if (!isSectionUnlocked) {
    return (
      <div className="flex flex-col font-inter">
        <div className="mb-6">
          <PageHeader
            title="CCTNS Manage Records & FIR Console"
            subtitle="Restricted state police archive protected by dual-factor RFID & Computer Vision security"
          />
        </div>
        <ManageRecordsLockScreen onUnlock={handleUnlockSuccess} />
      </div>
    );
  }

  return (
    <div className="flex flex-col font-inter">
      {/* Unlocked Security Status Strip */}
      <div className="mb-6 p-3 rounded-xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm flex-shrink-0">
            <FaShieldAlt className="text-base" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-xs font-mono tracking-wide">
                CCTNS SECTION UNLOCKED
              </span>
              <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold">
                2FA VERIFIED (RFID + FACE)
              </span>
            </div>
            <div className="text-[11px] text-slate-300 font-sans">
              Active Authorized Officer: <span className="text-cyan-400 font-bold">{unlockedOfficer?.officerName || unlockedOfficer?.name || "Kartik Singhal"}</span> ({unlockedOfficer?.badgeNumber || "MPP-2026-5882"}) • Card UID: <span className="font-mono text-cyan-300">{unlockedOfficer?.cardUid || "04:A2:8F:1A"}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLockSection}
          className="px-3.5 py-1.5 rounded-lg bg-red-600/20 hover:bg-red-600/40 border border-red-500/50 text-red-300 hover:text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <FaLock className="text-[10px]" /> Lock Section
        </button>
      </div>

      {/* Title Header */}
      <div className="mb-8" style={{ marginBottom: "32px" }}>
        <PageHeader
          title="CCTNS Manage Records & FIR Console"
          subtitle="Register new First Information Reports, update case timelines, allocate investigating officers, and mark completed case closures"
          action={
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center justify-center gap-3.5 rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-400/60 text-sm font-mono font-bold uppercase tracking-wider text-white transition-all cursor-pointer shadow-lg hover:shadow-blue-500/30 active:scale-[0.98] flex-shrink-0 whitespace-nowrap"
              style={{ paddingLeft: "36px", paddingRight: "36px", paddingTop: "14px", paddingBottom: "14px", borderRadius: "10px" }}
            >
              <FaFolderPlus className="text-base text-white" />
              <span>Register New FIR</span>
            </button>
          }
        />
      </div>

      {/* KPI Summary Cards */}
      <div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        style={{ marginBottom: "32px" }}
      >
        {/* Total Registered FIRs */}
        <div
          className="rounded-lg border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl flex items-center justify-between hover:border-blue-500/40 transition-all"
          style={{ padding: "20px 24px", borderLeft: "4px solid #3b82f6" }}
        >
          <div style={{ paddingLeft: "10px" }}>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-slate-400 block mb-1">Total Registered FIRs</span>
            <h3 className="font-mono text-3xl font-extrabold text-white leading-none">{stats.total}</h3>
          </div>
          <div className="h-10 w-10 rounded-md bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0">
            <FaShieldAlt className="text-base" />
          </div>
        </div>

        {/* Active Investigations */}
        <div
          className="rounded-lg border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl flex items-center justify-between hover:border-amber-500/40 transition-all"
          style={{ padding: "20px 24px", borderLeft: "4px solid #f59e0b" }}
        >
          <div style={{ paddingLeft: "10px" }}>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-amber-400 block mb-1">Active Investigations</span>
            <h3 className="font-mono text-3xl font-extrabold text-white leading-none">{stats.active}</h3>
          </div>
          <div className="h-10 w-10 rounded-md bg-amber-600/15 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0">
            <FaUserCheck className="text-base" />
          </div>
        </div>

        {/* Closed / Completed Cases */}
        <div
          className="rounded-lg border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl flex items-center justify-between hover:border-emerald-500/40 transition-all"
          style={{ padding: "20px 24px", borderLeft: "4px solid #10b981" }}
        >
          <div style={{ paddingLeft: "10px" }}>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-400 block mb-1">Closed / Completed Cases</span>
            <h3 className="font-mono text-3xl font-extrabold text-white leading-none">{stats.closed}</h3>
          </div>
          <div className="h-10 w-10 rounded-md bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 flex-shrink-0">
            <FaCheckCircle className="text-base" />
          </div>
        </div>

        {/* Critical Severity Incidents */}
        <div
          className="rounded-lg border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl flex items-center justify-between hover:border-rose-500/40 transition-all"
          style={{ padding: "20px 24px", borderLeft: "4px solid #f43f5e" }}
        >
          <div style={{ paddingLeft: "10px" }}>
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-rose-400 block mb-1">Critical Severity Incidents</span>
            <h3 className="font-mono text-3xl font-extrabold text-white leading-none">{stats.critical}</h3>
          </div>
          <div className="h-10 w-10 rounded-md bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-400 flex-shrink-0">
            <FaExclamationTriangle className="text-base" />
          </div>
        </div>
      </div>

      {/* Query Filters & Search Toolbar */}
      <div 
        className="bg-slate-900/85 border border-slate-700/60 rounded-md backdrop-blur-md shadow-xl mb-8 font-sans" 
        style={{ padding: "20px 24px", marginBottom: "32px" }}
      >
        <div 
          className="flex items-center justify-between pb-3.5 mb-3.5 border-b border-slate-800/60"
          style={{ paddingLeft: "4px", paddingRight: "4px" }}
        >
          <div className="flex items-center gap-2.5 text-xs font-bold text-white uppercase tracking-widest font-mono">
            <FaFilter className="text-blue-400 text-sm" />
            <span>Search & Filter FIR Records</span>
          </div>
          <button
            onClick={handleResetFilters}
            className="flex items-center gap-1.5 rounded-md border border-slate-700/60 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3.5 py-1.5 transition-all cursor-pointer font-bold uppercase text-[9.5px] font-mono tracking-widest shadow-sm"
          >
            Reset Filters
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 text-xs font-mono">
          {/* Search Box */}
          <div className="relative sm:col-span-2 lg:col-span-2 flex items-center">
            <FaSearch className="absolute left-4 text-slate-400 text-xs pointer-events-none z-10" />
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Search by FIR No, Officer, Complainant..."
              className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono transition-all shadow-inner"
              style={{ paddingLeft: "44px", paddingRight: "16px" }}
            />
          </div>

          {/* District Filter */}
          <div>
            <select
              name="district"
              value={filters.district}
              onChange={handleFilterChange}
              className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono transition-all cursor-pointer shadow-inner"
              style={{ paddingLeft: "14px", paddingRight: "14px" }}
            >
              <option value="" className="bg-slate-950 text-slate-400">-- ALL DISTRICTS --</option>
              {crimeService.getDistricts().map(d => (
                <option key={d} value={d} className="bg-slate-950 text-slate-200">{d}</option>
              ))}
            </select>
          </div>

          {/* Crime Category Filter */}
          <div>
            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono transition-all cursor-pointer shadow-inner"
              style={{ paddingLeft: "14px", paddingRight: "14px" }}
            >
              <option value="" className="bg-slate-950 text-slate-400">-- ALL CATEGORIES --</option>
              <option value="CDR / IPDR" className="bg-slate-950 text-slate-200">CDR / IPDR</option>
              <option value="Bank / UPI Logs" className="bg-slate-950 text-slate-200">Bank / UPI Logs</option>
              <option value="Email Headers" className="bg-slate-950 text-slate-200">Email Headers</option>
              <option value="Chat Exports" className="bg-slate-950 text-slate-200">Chat Exports</option>
              <option value="Android / APK Logs" className="bg-slate-950 text-slate-200">Android / APK Logs</option>
            </select>
          </div>

          {/* Severity Filter */}
          <div>
            <select
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
              className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono transition-all cursor-pointer shadow-inner"
              style={{ paddingLeft: "14px", paddingRight: "14px" }}
            >
              <option value="" className="bg-slate-950 text-slate-400">-- ALL SEVERITIES --</option>
              <option value="CRITICAL" className="bg-slate-950 text-rose-400 font-bold">CRITICAL</option>
              <option value="HIGH" className="bg-slate-950 text-amber-400 font-bold">HIGH</option>
              <option value="MEDIUM" className="bg-slate-950 text-blue-400 font-bold">MEDIUM</option>
              <option value="LOW" className="bg-slate-950 text-emerald-400 font-bold">LOW</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full h-11 rounded-md bg-slate-950/80 border border-slate-700/60 text-xs text-blue-400 font-bold focus:outline-none focus:border-blue-500 font-mono transition-all cursor-pointer shadow-inner"
              style={{ paddingLeft: "14px", paddingRight: "14px" }}
            >
              <option value="" className="bg-slate-950 text-slate-400">-- ALL STATUSES --</option>
              <option value="ACTIVE" className="bg-slate-950 text-slate-200">Active Cases</option>
              <option value="CLOSED" className="bg-slate-950 text-slate-200">Case Closed / Completed</option>
              <option value="Under Investigation" className="bg-slate-950 text-slate-200">Under Investigation</option>
              <option value="Suspect Apprehended" className="bg-slate-950 text-slate-200">Suspect Apprehended</option>
              <option value="Charge-sheet Submitted" className="bg-slate-950 text-slate-200">Charge-sheet Submitted</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main FIR Data Table */}
      <div className="rounded-sm border border-slate-700/60 bg-slate-900/85 backdrop-blur-md overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse font-sans text-xs">
            <thead>
              <tr className="bg-slate-950/90 font-mono text-[10px] font-bold text-slate-300 uppercase tracking-wider border-b border-slate-700/70">
                <th className="py-4 pl-6 pr-4">Crime No & Date</th>
                <th className="py-4 px-4">Jurisdiction</th>
                <th className="py-4 px-4">Crime Category & Section</th>
                <th className="py-4 px-4">Complainant</th>
                <th className="py-4 px-4">Allotted Officer</th>
                <th className="py-4 px-4">Accused / Suspect</th>
                <th className="py-4 px-4">Status & Severity</th>
                <th className="py-4 pl-4 pr-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500 font-mono">
                    No CCTNS FIR records match your filter criteria.
                  </td>
                </tr>
              ) : (
                records.map((r, index) => {
                  const isClosed = r.status === "Case Closed / Completed";

                  return (
                    <tr key={r.id ? `${r.id}-${index}` : index} className="odd:bg-slate-900/40 even:bg-slate-950/40 hover:bg-blue-600/10 transition-colors duration-150">
                      {/* Crime No & Date */}
                      <td className="py-4 pl-6 pr-4 font-mono">
                        <div className="font-bold text-blue-400 hover:text-blue-300 cursor-pointer transition-colors text-xs" onClick={() => handleOpenDetailModal(r)}>
                          {r.crimeNo}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-1">Reg: {r.regDate}</div>
                      </td>

                      {/* Jurisdiction */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-xs">{r.unit}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.district}</div>
                      </td>

                      {/* Category & Section */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-xs">{r.crimeHead}</div>
                        <div className="text-[10px] font-mono text-purple-400 mt-1 font-semibold">{r.actSections}</div>
                      </td>

                      {/* Complainant */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-200 text-xs">{r.complainantName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.complainantPhone || "N/A"}</div>
                      </td>

                      {/* Allotted Officer */}
                      <td className="py-4 px-4 font-mono">
                        <div className="font-bold text-slate-200 text-xs">{r.allottedOfficerName}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{r.allottedOfficerRank} • MPPID: {r.allottedOfficerKgid}</div>
                      </td>

                      {/* Suspect */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-slate-200 text-xs">{r.accusedName}</div>
                        <div className="text-[10px] font-mono text-amber-400 mt-0.5">{r.accusedStatus}</div>
                      </td>

                      {/* Status & Severity */}
                      <td className="py-4 px-4 font-mono">
                        <div className="flex flex-col gap-1.5 items-start">
                          <span className={`text-[9px] font-bold px-2.5 py-0.5 rounded-sm border uppercase tracking-wider font-mono ${isClosed
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                            }`}>
                            {isClosed ? "CLOSED / COMPLETED" : r.status}
                          </span>

                          <span className={`text-[8.5px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider font-mono border ${r.severity === "CRITICAL" ? "bg-rose-500/15 text-rose-400 border-rose-500/30" :
                            r.severity === "HIGH" ? "bg-amber-500/15 text-amber-400 border-amber-500/30" :
                              "bg-blue-500/15 text-blue-400 border-blue-500/30"
                            }`}>
                            {r.severity}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 pl-4 pr-6 text-right font-mono">
                        <div className="flex items-center justify-end gap-2">
                          {/* View Detail */}
                          <button
                            onClick={() => handleOpenDetailModal(r)}
                            className="p-2 rounded-sm border border-slate-700/60 bg-slate-950/80 text-slate-400 hover:text-blue-400 hover:border-blue-500/50 hover:bg-slate-900 transition-all shadow-sm cursor-pointer"
                            title="Inspect Full FIR Dossier"
                          >
                            <FaEye />
                          </button>

                          {/* Edit Record */}
                          <button
                            onClick={() => handleOpenEditModal(r)}
                            className="p-2 rounded-sm border border-slate-700/60 bg-slate-950/80 text-slate-400 hover:text-purple-400 hover:border-purple-500/50 hover:bg-slate-900 transition-all shadow-sm cursor-pointer"
                            title="Edit Record Fields"
                          >
                            <FaEdit />
                          </button>

                          {/* View in Network Matrix */}
                          <Link
                            to={`/network-analysis`}
                            className="p-2 rounded-sm border border-slate-700/60 bg-slate-950/80 text-slate-400 hover:text-amber-400 hover:border-amber-500/50 hover:bg-slate-900 transition-all shadow-sm cursor-pointer"
                            title="Explore Suspect in Link & Network Graph"
                          >
                            <FaProjectDiagram />
                          </Link>

                          {/* Toggle Closed Status */}
                          <button
                            onClick={() => handleToggleCaseClosed(r.id)}
                            className={`p-2 rounded-sm border transition-all shadow-sm cursor-pointer ${isClosed
                              ? "border-slate-700/60 bg-slate-950/80 text-amber-400 hover:bg-slate-900 hover:border-amber-500/50"
                              : "border-slate-700/60 bg-slate-950/80 text-emerald-400 hover:bg-slate-900 hover:border-emerald-500/50"
                              }`}
                            title={isClosed ? "Re-open Case Investigation" : "Mark Case Closed / Completed"}
                          >
                            {isClosed ? <FaUndo /> : <FaCheckCircle />}
                          </button>

                          {/* Delete Record */}
                          <button
                            onClick={() => handleDeletePrompt(r.id)}
                            className="p-2 rounded-sm border border-slate-700/60 bg-slate-950/80 text-slate-400 hover:text-rose-400 hover:border-rose-500/50 hover:bg-slate-900 transition-all shadow-sm cursor-pointer"
                            title="Delete FIR Record"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-sm border border-slate-700/60 bg-slate-950 p-6 space-y-4 shadow-2xl font-sans">
            <div className="flex items-center gap-3 text-rose-500">
              <FaExclamationTriangle className="text-2xl" />
              <h3 className="text-base font-mono font-bold uppercase text-white">Delete FIR Record?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete FIR record <code className="text-rose-400 font-mono font-bold">{recordService.getRecordById(deleteConfirmId)?.crimeNo}</code>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-sm border border-slate-700/60 text-slate-400 hover:text-white hover:bg-slate-900 text-xs font-mono transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRecord(deleteConfirmId)}
                className="px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-500 text-white text-xs font-mono font-bold uppercase shadow-lg transition-all cursor-pointer"
              >
                Delete Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hardware Face Re-Authentication for FIR CRUD Actions (NO OTP!) */}
      <HardwareBiometricAuthModal
        isOpen={isHwAuthModalOpen}
        onClose={() => setIsHwAuthModalOpen(false)}
        onSuccess={hwAuthCallback}
        actionTitle={hwAuthTitle}
        actionType={hwAuthType}
        targetRecordId={hwAuthTargetId}
        changesSummary={hwAuthSummary}
        activeOfficer={unlockedOfficer}
      />

      {/* Form Modal (Create / Edit) */}
      <FIRFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveRecord}
        initialData={selectedRecord}
      />

      {/* Detail Dossier Inspection Modal */}
      <FIRDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        record={selectedRecord}
        onToggleStatus={handleToggleCaseClosed}
      />
    </div>
  );
};

export default ManageRecords;
