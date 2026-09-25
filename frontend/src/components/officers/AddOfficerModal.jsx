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
  FaExclamationCircle,
  FaMicrochip,
  FaArrowRight,
  FaArrowLeft,
  FaTv
} from "react-icons/fa";
import BiometricEnrollmentWidget from "../hardware/BiometricEnrollmentWidget";

const MP_DISTRICTS = [
  "Bhopal",
  "Indore",
  "Jabalpur",
  "Gwalior",
  "Ujjain",
  "Sagar",
  "Rewa",
  "Satna",
  "Chhindwara",
  "Ratlam"
];

const MP_STATIONS = [
  "Bhopal Central Cyber Cell",
  "Indore Cyber Police Station",
  "Jabalpur Cyber Unit",
  "Gwalior Cyber Police Station",
  "Ujjain Cyber Unit",
  "State Cyber Crime Police Station Bhopal"
];

const AddOfficerModal = ({ isOpen, onClose, onAdd }) => {
  const [activeTab, setActiveTab] = useState("dossier");
  const [formData, setFormData] = useState({
    name: "",
    rank: "Police Inspector",
    badgeNumber: "MPP-2026-901",
    unit: "Bhopal Central Cyber Cell",
    station: "Bhopal",
    yearsOfService: "5",
    specialArea: "Cyber Forensics & Threat Intelligence",
    username: "",
    password: "Officer@123",
    biometricTemplateId: ""
  });

  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricData, setBiometricData] = useState(null);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-generate suggested username if name changes and username not manually touched
      if (name === "name" && value.trim()) {
        const cleanName = value.trim().toLowerCase().replace(/\s+/g, "");
        updated.username = `mpp.${cleanName}`;
      }
      
      // Auto-generate suggested badge if name changes
      if (name === "name" && value.trim()) {
        const rand = Math.floor(1000 + Math.random() * 9000);
        updated.badgeNumber = `MPP-2026-${rand}`;
      }

      return updated;
    });
    if (error) setError("");
  };

  const handleEnrollmentSuccess = (info) => {
    setBiometricEnrolled(true);
    setBiometricData(info);
    setFormData((prev) => ({
      ...prev,
      biometricTemplateId: info.biometricTemplateId,
      biometricSlot: info.slot
    }));
    setError("");
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");

    // --- Validations ---
    if (!formData.name.trim()) {
      setError("Please enter the officer's full name.");
      setActiveTab("dossier");
      return;
    }

    if (!formData.rank?.trim()) {
      setError("Please select the officer's rank.");
      setActiveTab("dossier");
      return;
    }

    if (!formData.badgeNumber?.trim()) {
      setError("Please enter the officer's badge/KGID number.");
      setActiveTab("dossier");
      return;
    }

    if (!formData.unit?.trim()) {
      setError("Please specify the assigned division or cyber unit.");
      setActiveTab("dossier");
      return;
    }

    if (!formData.station?.trim()) {
      setError("Please specify the district jurisdiction.");
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

    if (!biometricEnrolled) {
      setError("MANDATORY BIOMETRIC REGISTRATION: Please capture and enroll the officer's fingerprint via the ESP32 scanner below.");
      setActiveTab("biometrics");
      return;
    }

    try {
      await onAdd(formData);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to register officer.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div 
        className="w-full max-w-4xl rounded-2xl border border-slate-700/80 bg-[#081220] shadow-[0_0_60px_-15px_rgba(0,0,0,0.85)] relative overflow-hidden font-jakarta my-auto animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600" />

        {/* Modal Header */}
        <div 
          className="bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between px-6 py-4 sm:px-8 sm:py-5"
        >
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400 shadow-inner flex-shrink-0">
              <FaUserPlus className="text-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold font-space text-white tracking-wide uppercase leading-tight">
                  Register New Police Officer • MP Police
                </h2>
                {biometricEnrolled ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold flex items-center gap-1">
                    <FaCheckCircle /> BIOMETRIC CAPTURED (#{biometricData?.slot || 1})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold flex items-center gap-1 animate-pulse">
                    <FaFingerprint /> BIOMETRIC REQUIRED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Admin Dossier Provisioning • ESP32 Biometric Template Capture & CCTNS Access
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 transition-colors rounded-lg hover:bg-slate-800 cursor-pointer flex-shrink-0"
            title="Close"
          >
            <FaTimes className="text-base" />
          </button>
        </div>

        {/* 3-Step Wizard Navigation Bar (Fully Responsive, Never Hidden) */}
        <div className="border-b border-slate-800 bg-slate-950/80 grid grid-cols-3 text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveTab("dossier")}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 border-b-2 font-bold uppercase transition-all cursor-pointer ${
              activeTab === "dossier"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaShieldAlt className="text-xs" />
            <span className="hidden sm:inline">1. Officer Dossier</span>
            <span className="sm:hidden">1. Dossier</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("credentials")}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 border-b-2 font-bold uppercase transition-all cursor-pointer ${
              activeTab === "credentials"
                ? "border-blue-500 text-blue-400 bg-blue-500/10"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaKey className="text-xs" />
            <span className="hidden sm:inline">2. Login Access</span>
            <span className="sm:hidden">2. Login</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("biometrics")}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 border-b-2 font-bold uppercase transition-all cursor-pointer relative ${
              activeTab === "biometrics"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/15"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaFingerprint className={`text-xs ${!biometricEnrolled ? "text-amber-400 animate-pulse" : "text-emerald-400"}`} />
            <span className="hidden sm:inline">3. Biometric (ESP32)</span>
            <span className="sm:hidden">3. Biometric</span>
            {biometricEnrolled ? (
              <span className="h-2 w-2 rounded-full bg-emerald-400 ml-1" />
            ) : (
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping ml-1" />
            )}
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col">
          
          <div className="max-h-[60vh] overflow-y-auto space-y-6 px-6 py-5 sm:px-8 sm:py-6">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-950/70 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5 font-medium animate-fade-in shadow-lg">
                <FaExclamationCircle className="text-rose-400 text-base flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* TAB 1: Officer Dossier Profile */}
            {activeTab === "dossier" && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FaShieldAlt className="text-blue-400 text-xs" /> OFFICER SERVICE PARTICULARS
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Step 1 of 3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Officer Full Name & Title <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Inspector Rajesh Sharma"
                      required
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Officer Rank <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <select
                      name="rank"
                      value={formData.rank}
                      onChange={handleChange}
                      required
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner cursor-pointer"
                    >
                      <option value="Director General of Police (DGP)">Director General of Police (DGP)</option>
                      <option value="Inspector General of Police (IGP)">Inspector General of Police (IGP)</option>
                      <option value="Deputy Inspector General (DIG)">Deputy Inspector General (DIG)</option>
                      <option value="Superintendent of Police (SP)">Superintendent of Police (SP)</option>
                      <option value="Deputy SP (DySP)">Deputy SP (DySP)</option>
                      <option value="Police Inspector">Police Inspector</option>
                      <option value="Sub-Inspector (PSI)">Sub-Inspector (PSI)</option>
                      <option value="Assistant Sub-Inspector (ASI)">Assistant Sub-Inspector (ASI)</option>
                      <option value="Head Constable (HC)">Head Constable (HC)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      KGID / Badge Number <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="badgeNumber"
                      value={formData.badgeNumber}
                      onChange={handleChange}
                      placeholder="MPP-2026-901"
                      required
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
                      Assigned Division / Unit <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      placeholder="e.g. Bhopal Central Cyber Cell"
                      required
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
                      placeholder="e.g. Cyber Forensics & Threat Intelligence"
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300">
                      District Jurisdiction Headquarters <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <select
                      name="station"
                      value={formData.station}
                      onChange={handleChange}
                      required
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 shadow-inner cursor-pointer"
                    >
                      {MP_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab("credentials")}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <span>Continue to Login & Biometrics</span>
                    <FaArrowRight />
                  </button>
                </div>
              </div>
            )}

            {/* TAB 2: Login Credentials & Access Account + EMBEDDED BIOMETRIC SCANNER */}
            {activeTab === "credentials" && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800/70 pb-2">
                  <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <FaKey className="text-blue-400 text-xs" /> AUTHENTICATION CREDENTIALS & SECURITY
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">Step 2 of 3</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5 text-xs">
                  
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Officer Login Username <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      placeholder="e.g. mpp.rajesh"
                      required
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono font-semibold shadow-inner placeholder-slate-500"
                    />
                    <p className="text-[11px] text-slate-500 font-mono mt-1">
                      Identifier used by personnel to access the CCTNS workspace.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Initial Passphrase <span className="text-rose-500 font-bold ml-1">*</span>
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

                {/* DIRECT EMBEDDED BIOMETRIC ENROLLMENT CARD (Prominently displayed right here!) */}
                <div className="pt-2">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <FaFingerprint className="text-cyan-400 text-sm" />
                      <span className="text-xs font-bold font-space uppercase tracking-wider text-white">
                        Biometric Fingerprint Registration (Required)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("biometrics")}
                      className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      <span>Open Full Sensor Console</span>
                      <FaArrowRight className="text-[10px]" />
                    </button>
                  </div>

                  <BiometricEnrollmentWidget
                    officerData={formData}
                    isEnrolled={biometricEnrolled}
                    enrolledInfo={biometricData}
                    onEnrollmentComplete={handleEnrollmentSuccess}
                  />
                </div>

                <div className="pt-2 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab("dossier")}
                    className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white font-mono text-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <FaArrowLeft />
                    <span>Back to Dossier</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("biometrics")}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-cyan-600/20"
                  >
                    <span>View ESP32 Hardware Console</span>
                    <FaArrowRight />
                  </button>
                </div>

              </div>
            )}

            {/* TAB 3: Full ESP32 Hardware Biometric Enrollment & OLED Console */}
            {activeTab === "biometrics" && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold font-space text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <FaMicrochip /> Officer Biometric Registration • ESP32 + R307 Sensor
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Capture and bind the officer's biometric fingerprint template. Required for subsequent 2-Factor Biometric authentication when performing FIR actions or modifying personnel records.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Step 3 of 3</span>
                </div>

                {/* Active Biometric Widget */}
                <BiometricEnrollmentWidget
                  officerData={formData}
                  isEnrolled={biometricEnrolled}
                  enrolledInfo={biometricData}
                  onEnrollmentComplete={handleEnrollmentSuccess}
                />

                {/* OLED Display Mirror for Registration */}
                <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span className="flex items-center gap-1.5 text-cyan-400 font-bold">
                      <FaTv /> ESP32 Physical OLED Screen Mirror
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
                      I2C 0x3C Active
                    </span>
                  </div>

                  <div className="rounded-lg border-2 border-slate-800 bg-[#020712] p-3 text-center font-mono text-xs space-y-1 text-cyan-300 drop-shadow-[0_0_6px_rgba(6,182,212,0.8)]">
                    <div className="font-bold text-cyan-200 border-b border-cyan-900/40 pb-1">
                      ENROLL BIOMETRIC
                    </div>
                    <div>
                      NAME: {formData.name ? formData.name.slice(0, 16) : "NEW OFFICER"}
                    </div>
                    <div className="text-amber-300 font-bold">
                      {biometricEnrolled
                        ? `SLOT #${biometricData?.slot || 1} SAVED & BOUND`
                        : "PLACE FINGERPRINT ON SENSOR"}
                    </div>
                    <div className="text-[10px] text-cyan-500">
                      {biometricEnrolled ? ">> ENROLLMENT OK <<" : "AWAITING SENSOR TOUCH..."}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-start">
                  <button
                    type="button"
                    onClick={() => setActiveTab("credentials")}
                    className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white font-mono text-xs flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <FaArrowLeft />
                    <span>Back to Credentials</span>
                  </button>
                </div>
              </div>
            )}

          </div>

          {/* Modal Footer */}
          <div 
            className="py-4 sm:py-5 bg-slate-900/90 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 sm:px-8"
          >
            <div className="text-xs text-slate-400 font-sans">
              <span className="text-rose-500 font-bold">*</span> Mandatory fields • Biometric capture required before registration
            </div>
            
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="submit"
                className={`h-11 px-6 rounded-xl font-space text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer border-none text-white ${
                  biometricEnrolled
                    ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                    : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/25"
                }`}
              >
                {biometricEnrolled ? (
                  <>
                    <FaCheckCircle className="text-sm" />
                    <span>Register Officer & Bind Biometric</span>
                  </>
                ) : (
                  <>
                    <FaFingerprint className="text-sm" />
                    <span>Capture Biometric & Register</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};

export default AddOfficerModal;
