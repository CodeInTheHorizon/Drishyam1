import React, { useState } from "react";
import { 
  FaTimes, 
  FaUserPlus, 
  FaKey, 
  FaShieldAlt, 
  FaSave,
  FaBuilding,
  FaFingerprint,
  FaCheckCircle,
  FaExclamationCircle
} from "react-icons/fa";

const AddOfficerModal = ({ isOpen, onClose, onAdd }) => {
  const [activeTab, setActiveTab] = useState("dossier");
  const [formData, setFormData] = useState({
    name: "",
    rank: "PSI",
    badgeNumber: "",
    unit: "Koramangala Police Station",
    station: "Bengaluru City Range",
    yearsOfService: "5",
    specialArea: "Cyber Crime & Digital Forensics",
    username: "",
    password: "Officer@123"
  });

  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-generate suggested username if name changes and username not manually touched
      if (name === "name" && value.trim()) {
        const cleanName = value.trim().toLowerCase().replace(/\s+/g, "");
        updated.username = `ksp.${cleanName}`;
      }
      
      // Auto-generate suggested badge if name changes
      if (name === "name" && value.trim()) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        updated.badgeNumber = `KSP-2026-IN${rand}`;
      }

      return updated;
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter the officer's full name.");
      setActiveTab("dossier");
      return;
    }

    if (!formData.username.trim()) {
      setError("Please specify a login username for the officer.");
      setActiveTab("credentials");
      return;
    }

    if (!formData.password || formData.password.length < 4) {
      setError("Password must be at least 4 characters long.");
      setActiveTab("credentials");
      return;
    }

    try {
      onAdd(formData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to register officer.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div 
        className="w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-[#081220] shadow-[0_0_60px_-15px_rgba(0,0,0,0.85)] relative overflow-hidden font-jakarta my-auto animate-fade-in"
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
              <FaUserPlus className="text-lg" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-space text-white tracking-wide uppercase leading-tight">
                Register New Police Officer
              </h2>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Admin Console • Add Officer Dossier & Generate Login Credentials
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
            onClick={() => setActiveTab("dossier")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "dossier"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaShieldAlt className="text-xs" /> 1. Officer Dossier Profile
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("credentials")}
            className={`py-3.5 px-4 flex items-center gap-2 border-b-2 font-bold uppercase transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "credentials"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaKey className="text-xs" /> 2. Login Credentials & Access Account
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          
          <div className="max-h-[60vh] overflow-y-auto space-y-6" style={{ padding: "28px 36px" }}>
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center gap-2.5 font-medium animate-fade-in">
                <FaExclamationCircle className="text-rose-400 text-sm flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: Officer Dossier Profile */}
            {activeTab === "dossier" && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-800/70 pb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FaShieldAlt className="text-blue-400 text-xs" /> OFFICER SERVICE PARTICULARS
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Officer Full Name & Title <span className="text-blue-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Vikram Seth"
                      required
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium shadow-inner placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Officer Rank <span className="text-blue-400">*</span>
                    </label>
                    <select
                      name="rank"
                      value={formData.rank}
                      onChange={handleChange}
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner cursor-pointer"
                    >
                      <option value="PSI">PSI (Police Sub-Inspector)</option>
                      <option value="CPI">CPI (Circle Police Inspector)</option>
                      <option value="ASI">ASI (Assistant Sub-Inspector)</option>
                      <option value="Police Inspector">Police Inspector</option>
                      <option value="Assistant Commissioner">Assistant Commissioner (ACP)</option>
                      <option value="Deputy Superintendent">Deputy Superintendent (DySP)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      KGID Badge Number
                    </label>
                    <input
                      type="text"
                      name="badgeNumber"
                      value={formData.badgeNumber}
                      onChange={handleChange}
                      placeholder="e.g. KSP-2026-IN9940"
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Years of Service
                    </label>
                    <input
                      type="number"
                      name="yearsOfService"
                      value={formData.yearsOfService}
                      onChange={handleChange}
                      placeholder="5"
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Assigned Division / Unit
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      placeholder="e.g. Koramangala Police Station"
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Specialization Area
                    </label>
                    <input
                      type="text"
                      name="specialArea"
                      value={formData.specialArea}
                      onChange={handleChange}
                      placeholder="e.g. Cyber Crime & Digital Forensics"
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      Station Range / Jurisdiction Headquarters
                    </label>
                    <input
                      type="text"
                      name="station"
                      value={formData.station}
                      onChange={handleChange}
                      placeholder="e.g. Bengaluru City Range"
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                    />
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: Login Credentials & Access Account */}
            {activeTab === "credentials" && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center gap-2 border-b border-slate-800/70 pb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FaKey className="text-blue-400 text-xs" /> AUTHENTICATION CREDENTIALS & SECURITY
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Officer Login Username <span className="text-blue-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="e.g. ksp.vikram"
                      required
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono font-semibold shadow-inner placeholder-slate-500"
                    />
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Identifier used by personnel to access the CCTNS workspace.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Initial Passphrase <span className="text-blue-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Officer@123"
                      required
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono shadow-inner placeholder-slate-500"
                    />
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Temporary password; officer can update in Settings once logged in.
                    </p>
                  </div>

                </div>

                {/* Clearance Notice Banner */}
                <div className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl flex items-center justify-between gap-4 mt-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-950/50 border border-emerald-800/50 flex items-center justify-center text-emerald-400 flex-shrink-0">
                      <FaFingerprint className="text-base" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono">AUTOMATIC ROLE PROVISIONING</h4>
                      <p className="text-[11px] text-slate-400 font-sans mt-0.5">
                        Officer clearance set to <strong>CCTNS Field Officer</strong> with assigned unit permissions.
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2.5 py-1 rounded-md">
                    ROLE: OFFICER
                  </span>
                </div>

              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div 
            className="py-5 bg-slate-900/90 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{ paddingLeft: "32px", paddingRight: "28px" }}
          >
            <div className="text-xs text-slate-400 font-sans" style={{ paddingLeft: "8px" }}>
              <span className="text-blue-400 font-bold">*</span> Indicates mandatory fields required for personnel registration
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
                <FaSave /> Register Officer & Generate Access
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddOfficerModal;
