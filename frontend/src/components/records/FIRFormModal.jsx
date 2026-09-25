import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes,
  FaSave,
  FaFolderPlus,
  FaUser,
  FaMapMarkerAlt,
  FaShieldAlt,
  FaFileAlt
} from "react-icons/fa";

const FIRFormModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const isEdit = Boolean(initialData && initialData.id);
  const [activeTab, setActiveTab] = useState("general");
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    crimeNo: "",
    caseNo: "",
    regDate: new Date().toISOString().split("T")[0],
    incidentFromDate: new Date().toISOString().slice(0, 16),
    incidentToDate: "",
    district: "Bengaluru City",
    unit: "Koramangala Police Station",
    crimeHead: "Property Offences",
    crimeSubHead: "Theft",
    actSections: "IPC Sec 379 / BNS Sec 303",
    cognizableType: "Cognizable",
    severity: "MEDIUM",
    status: "Under Investigation",
    
    complainantName: "",
    complainantPhone: "",
    complainantAddress: "",
    complainantIdType: "Aadhaar",
    complainantIdNo: "",
    
    locationStreet: "",
    landmark: "",
    lat: "12.9352",
    lng: "77.6245",
    
    allottedOfficerName: "Ramesh Gowda",
    allottedOfficerRank: "PSI",
    allottedOfficerKgid: "KSP-8821",
    
    accusedName: "Unknown",
    accusedStatus: "Unidentified",
    
    briefFacts: "",
    propertyDescription: "",
    estimatedValue: "0",
    resolutionNotes: "",
    officialReportImage: ""
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, officialReportImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        officialReportImage: initialData.officialReportImage || "",
        lat: String(initialData.lat || 12.9352),
        lng: String(initialData.lng || 77.6245),
        estimatedValue: String(initialData.estimatedValue || 0)
      });
    } else {
      setFormData({
        crimeNo: "",
        caseNo: "",
        regDate: new Date().toISOString().split("T")[0],
        incidentFromDate: new Date().toISOString().slice(0, 16),
        incidentToDate: "",
        district: "Bengaluru City",
        unit: "Koramangala Police Station",
        crimeHead: "Property Offences",
        crimeSubHead: "Theft",
        actSections: "IPC Sec 379 / BNS Sec 303",
        cognizableType: "Cognizable",
        severity: "MEDIUM",
        status: "Under Investigation",
        complainantName: "",
        complainantPhone: "",
        complainantAddress: "",
        complainantIdType: "Aadhaar",
        complainantIdNo: "",
        locationStreet: "",
        landmark: "",
        lat: "12.9352",
        lng: "77.6245",
        allottedOfficerName: "Ramesh Gowda",
        allottedOfficerRank: "PSI",
        allottedOfficerKgid: "KSP-8821",
        accusedName: "Unknown",
        accusedStatus: "Unidentified",
        briefFacts: "",
        propertyDescription: "",
        estimatedValue: "0",
        resolutionNotes: ""
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center min-h-screen w-full bg-slate-950/85 backdrop-blur-md p-4 sm:p-6 overflow-y-auto animate-fade-in">
      {/* Click outside to close backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Modal Container */}
      <div 
        className="w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-[#081220] shadow-[0_0_60px_-15px_rgba(0,0,0,0.85)] relative overflow-hidden font-jakarta my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-blue-600" />

        {/* Modal Header */}
        <div 
          className="bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between"
          style={{ paddingLeft: "32px", paddingRight: "28px", paddingTop: "26px", paddingBottom: "22px" }}
        >
          <div className="flex items-center gap-4" style={{ paddingLeft: "8px" }}>
            <div className="h-11 w-11 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner flex-shrink-0">
              <FaFolderPlus className="text-lg" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-space text-white tracking-wide uppercase leading-tight">
                {isEdit ? `Edit CCTNS Record: ${formData.crimeNo || formData.id}` : "Register New CCTNS FIR Record"}
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Core Application Software (CAS) IIF-1 First Information Logging Form
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 transition-colors rounded-lg hover:bg-slate-800 cursor-pointer"
            title="Close"
          >
            <FaTimes className="text-base" />
          </button>
        </div>

        {/* Modal Form Sub-tabs */}
        <div 
          className="border-b border-slate-800/80 bg-slate-950/60 flex items-center gap-2 overflow-x-auto text-xs font-mono"
          style={{ paddingLeft: "32px", paddingRight: "28px", paddingTop: "6px" }}
        >
          <button
            type="button"
            onClick={() => setActiveTab("general")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "general"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaShieldAlt className="text-xs" /> 1. FIR & Classification
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("complainant")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "complainant"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaUser className="text-xs" /> 2. Complainant & Location
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("officer")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "officer"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaMapMarkerAlt className="text-xs" /> 3. Allotted Officer & Accused
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("brief")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "brief"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaFileAlt className="text-xs" /> 4. Brief Facts & Seizure
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          <div 
            className="max-h-[60vh] overflow-y-auto space-y-6"
            style={{ paddingLeft: "36px", paddingRight: "36px", paddingTop: "28px", paddingBottom: "28px" }}
          >
            
            {/* TAB 1: General & Classification */}
            {activeTab === "general" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Crime Number (18-Digit CCTNS)</label>
                  <input
                    type="text"
                    name="crimeNo"
                    value={formData.crimeNo}
                    onChange={handleChange}
                    placeholder="Auto-generated if empty"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Registration Date <span className="text-blue-400">*</span></label>
                  <input
                    type="date"
                    name="regDate"
                    value={formData.regDate}
                    onChange={handleChange}
                    required
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Incident From Date & Time <span className="text-blue-400">*</span></label>
                  <input
                    type="datetime-local"
                    name="incidentFromDate"
                    value={formData.incidentFromDate}
                    onChange={handleChange}
                    required
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">District Name <span className="text-blue-400">*</span></label>
                  <select
                    name="district"
                    value={formData.district}
                    onChange={handleChange}
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner cursor-pointer"
                  >
                    <option value="Bengaluru City">Bengaluru City</option>
                    <option value="Mangaluru City">Mangaluru City</option>
                    <option value="Mysuru City">Mysuru City</option>
                    <option value="Hubballi-Dharwad">Hubballi-Dharwad</option>
                    <option value="Belagavi District">Belagavi District</option>
                    <option value="Kalaburagi Range">Kalaburagi Range</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Police Station Unit <span className="text-blue-400">*</span></label>
                  <input
                    type="text"
                    name="unit"
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="e.g. Koramangala Police Station"
                    required
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Major Crime Head / Category <span className="text-blue-400">*</span></label>
                  <select
                    name="crimeHead"
                    value={formData.crimeHead}
                    onChange={handleChange}
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner cursor-pointer"
                  >
                    <option value="Theft">Theft</option>
                    <option value="Assault">Assault</option>
                    <option value="Murder">Murder</option>
                    <option value="Property Related">Property Related</option>
                    <option value="Cyber Crime">Cyber Crime</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Crime Sub-Head / MO</label>
                  <input
                    type="text"
                    name="crimeSubHead"
                    value={formData.crimeSubHead}
                    onChange={handleChange}
                    placeholder="e.g. Dacoity, Cyber Fraud, Theft"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">IPC / BNS Act & Sections <span className="text-blue-400">*</span></label>
                  <input
                    type="text"
                    name="actSections"
                    value={formData.actSections}
                    onChange={handleChange}
                    placeholder="e.g. IPC Sec 379 / BNS Sec 303"
                    required
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Severity / Risk Level</label>
                  <select
                    name="severity"
                    value={formData.severity}
                    onChange={handleChange}
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono font-bold shadow-inner cursor-pointer"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Initial Investigation Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner cursor-pointer"
                  >
                    <option value="Under Investigation">Under Investigation</option>
                    <option value="Suspect Apprehended">Suspect Apprehended</option>
                    <option value="Charge-sheet Submitted">Charge-sheet Submitted</option>
                    <option value="Case Closed / Completed">Case Closed / Completed</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: Complainant & Location */}
            {activeTab === "complainant" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Complainant Full Name <span className="text-blue-400">*</span></label>
                  <input
                    type="text"
                    name="complainantName"
                    value={formData.complainantName}
                    onChange={handleChange}
                    placeholder="e.g. Siddharth Malhotra"
                    required
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Complainant Phone Number</label>
                  <input
                    type="text"
                    name="complainantPhone"
                    value={formData.complainantPhone}
                    onChange={handleChange}
                    placeholder="+91 98XXX XXXXX"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Complainant Permanent Address</label>
                  <input
                    type="text"
                    name="complainantAddress"
                    value={formData.complainantAddress}
                    onChange={handleChange}
                    placeholder="House No, Street, Landmark, District"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">ID Proof Type</label>
                  <select
                    name="complainantIdType"
                    value={formData.complainantIdType}
                    onChange={handleChange}
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner cursor-pointer"
                  >
                    <option value="Aadhaar">Aadhaar Card</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="PAN Card">PAN Card</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">ID Proof Document Number</label>
                  <input
                    type="text"
                    name="complainantIdNo"
                    value={formData.complainantIdNo}
                    onChange={handleChange}
                    placeholder="e.g. XXXX-XXXX-8812"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="md:col-span-2 border-t border-slate-800/80 pt-4 mt-2">
                  <h3 className="font-mono font-bold text-blue-400 uppercase text-xs tracking-wider">
                    Incident Location & GIS Coordinates
                  </h3>
                </div>

                <div className="md:col-span-2 space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Incident Street / Site Address <span className="text-blue-400">*</span></label>
                  <input
                    type="text"
                    name="locationStreet"
                    value={formData.locationStreet}
                    onChange={handleChange}
                    placeholder="e.g. 100 Feet Road Commercial Warehouse"
                    required
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">GIS Latitude (Lat)</label>
                  <input
                    type="text"
                    name="lat"
                    value={formData.lat}
                    onChange={handleChange}
                    placeholder="12.9352"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">GIS Longitude (Lng)</label>
                  <input
                    type="text"
                    name="lng"
                    value={formData.lng}
                    onChange={handleChange}
                    placeholder="77.6245"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                  />
                </div>
              </div>
            )}

            {/* TAB 3: Allotted Officer & Accused */}
            {activeTab === "officer" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
                <div className="md:col-span-2">
                  <h3 className="font-mono font-bold text-purple-400 uppercase text-xs tracking-wider">
                    Investigating Officer Allocation
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Investigating Officer (IO) Name <span className="text-blue-400">*</span></label>
                  <input
                    type="text"
                    name="allottedOfficerName"
                    value={formData.allottedOfficerName}
                    onChange={handleChange}
                    placeholder="e.g. Ramesh Gowda"
                    required
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Officer Rank</label>
                  <select
                    name="allottedOfficerRank"
                    value={formData.allottedOfficerRank}
                    onChange={handleChange}
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner cursor-pointer"
                  >
                    <option value="PSI">PSI (Police Sub-Inspector)</option>
                    <option value="CPI">CPI (Circle Police Inspector)</option>
                    <option value="ASI">ASI (Assistant Sub-Inspector)</option>
                    <option value="Inspector">Inspector</option>
                    <option value="ACP">ACP (Assistant Commissioner)</option>
                    <option value="DySP">DySP (Deputy Superintendent)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Officer KGID Badge Number</label>
                  <input
                    type="text"
                    name="allottedOfficerKgid"
                    value={formData.allottedOfficerKgid}
                    onChange={handleChange}
                    placeholder="e.g. KSP-8821"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="md:col-span-2 border-t border-slate-800/80 pt-4 mt-2">
                  <h3 className="font-mono font-bold text-amber-400 uppercase text-xs tracking-wider">
                    Accused / Suspect Details
                  </h3>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Primary Accused / Suspect Name</label>
                  <input
                    type="text"
                    name="accusedName"
                    value={formData.accusedName}
                    onChange={handleChange}
                    placeholder="e.g. Kiran Kumar (or 'Unknown')"
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Apprehension / Custody Status</label>
                  <select
                    name="accusedStatus"
                    value={formData.accusedStatus}
                    onChange={handleChange}
                    className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner cursor-pointer"
                  >
                    <option value="Absconding">Absconding</option>
                    <option value="Detained">Detained</option>
                    <option value="Judicial Custody">Judicial Custody</option>
                    <option value="On Bail">On Bail</option>
                    <option value="Unidentified">Unidentified</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 4: Brief Facts & Seizure */}
            {activeTab === "brief" && (
              <div className="space-y-5 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Brief Facts of the Case (Narrative) <span className="text-blue-400">*</span></label>
                  <textarea
                    name="briefFacts"
                    value={formData.briefFacts}
                    onChange={handleChange}
                    rows={4}
                    placeholder="Detailed chronological facts of the incident as reported in FIR..."
                    required
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-sans leading-relaxed shadow-inner placeholder-slate-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Stolen / Seized Property Description</label>
                    <input
                      type="text"
                      name="propertyDescription"
                      value={formData.propertyDescription}
                      onChange={handleChange}
                      placeholder="e.g. Electronic equipment, vehicles, cash..."
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">Estimated Property Value (in INR ₹)</label>
                    <input
                      type="number"
                      name="estimatedValue"
                      value={formData.estimatedValue}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-300">Resolution / Disposal Notes (If Case Closed)</label>
                  <textarea
                    name="resolutionNotes"
                    value={formData.resolutionNotes}
                    onChange={handleChange}
                    rows={2}
                    placeholder="Final report details or disposal notes..."
                    className="w-full rounded-xl bg-slate-950/80 border border-slate-800 p-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-sans shadow-inner placeholder-slate-500"
                  />
                </div>

                {/* Official Report Attachment */}
                <div className="border-t border-slate-800/80 pt-4 space-y-3">
                  <label className="block text-xs font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                    <FaFileAlt className="text-xs" /> Official Written Report Scanned Document / Photo
                  </label>
                  <p className="text-xs text-slate-400">
                    Upload a scanned photo or image copy of the written official report filed for this FIR.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start bg-slate-950/60 p-4 rounded-xl border border-slate-800">
                    <div className="space-y-2">
                      <label className="block text-xs font-medium text-slate-300">Choose Image File from Computer:</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
                      />
                    </div>

                    {/* Document Preview Box */}
                    <div className="flex flex-col items-center justify-center border border-slate-800 rounded-xl p-3 bg-slate-950 min-h-[120px]">
                      {formData.officialReportImage ? (
                        <div className="relative w-full text-center space-y-1.5">
                          <img
                            src={formData.officialReportImage}
                            alt="Official Report Preview"
                            className="h-28 w-full object-cover rounded-lg border border-slate-800 shadow-md"
                          />
                          <button
                            type="button"
                            onClick={() => setFormData((prev) => ({ ...prev, officialReportImage: "" }))}
                            className="text-xs font-medium text-rose-400 hover:text-rose-300 underline cursor-pointer"
                          >
                            Remove Attached Report Photo
                          </button>
                        </div>
                      ) : (
                        <div className="text-center text-xs text-slate-500 space-y-1 p-3">
                          <FaFileAlt className="text-xl text-slate-600 mx-auto" />
                          <span>No official report document attached yet</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer Actions */}
          <div 
            className="py-5 bg-slate-900/90 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{ paddingLeft: "32px", paddingRight: "28px" }}
          >
            <div className="text-xs text-slate-400 font-sans" style={{ paddingLeft: "8px" }}>
              <span className="text-blue-400 font-bold">*</span> Indicates mandatory fields required for CCTNS registration
            </div>

            <div className="flex items-center gap-3 self-end sm:self-auto" style={{ paddingRight: "4px" }}>
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className="h-11 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white font-space text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-blue-600/25 transition-all cursor-pointer border-none"
              >
                <FaSave /> {isEdit ? "Save Changes" : "Create CCTNS FIR Record"}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default FIRFormModal;
