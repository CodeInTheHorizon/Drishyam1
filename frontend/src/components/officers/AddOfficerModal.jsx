import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { 
  FaTimes, 
  FaUserPlus, 
  FaKey, 
  FaShieldAlt, 
  FaSave,
  FaBuilding,
  FaCamera,
  FaCheckCircle,
  FaExclamationCircle,
  FaMicrochip,
  FaArrowRight,
  FaArrowLeft,
  FaTv
} from "react-icons/fa";
import FaceEnrollmentWidget from "../hardware/FaceEnrollmentWidget";

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
    photoUrl: "",
    avatar: ""
  });

  const [biometricEnrolled, setBiometricEnrolled] = useState(false);
  const [biometricData, setBiometricData] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  const faceWidgetRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      
      // Auto-generate suggested username if name changes and username not manually touched
      if (name === "name" && value.trim()) {
        const cleanName = value.trim().toLowerCase().replace(/\s+/g, "");
        if (!prev.username || prev.username.startsWith("mpp.")) {
          updated.username = `mpp.${cleanName}`;
        }
        if (!prev.badgeNumber || prev.badgeNumber === "MPP-2026-901") {
          const rand = Math.floor(1000 + Math.random() * 9000);
          updated.badgeNumber = `MPP-2026-${rand}`;
        }
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
      photoUrl: info.photoUrl,
      avatar: info.photoUrl,
      biometricTemplateId: info.photoUrl || "CV-FACE-MODEL",
      biometricSlot: 1
    }));
    setError("");
  };

  const validateDossier = () => {
    if (!formData.name.trim()) {
      setError("Please enter the officer's full name.");
      setActiveTab("dossier");
      return false;
    }
    if (!formData.rank?.trim()) {
      setError("Please select the officer's rank.");
      setActiveTab("dossier");
      return false;
    }
    if (!formData.badgeNumber?.trim()) {
      setError("Please enter the officer's badge/MPPID number.");
      setActiveTab("dossier");
      return false;
    }
    if (!formData.unit?.trim()) {
      setError("Please specify the assigned division or cyber unit.");
      setActiveTab("dossier");
      return false;
    }
    if (!formData.station?.trim()) {
      setError("Please specify the district jurisdiction.");
      setActiveTab("dossier");
      return false;
    }
    setError("");
    return true;
  };

  const validateCredentials = () => {
    if (!formData.username.trim()) {
      setError("Please specify a login username for the officer.");
      setActiveTab("credentials");
      return false;
    }
    if (!formData.password || formData.password.length < 4) {
      setError("Password must be at least 4 characters long.");
      setActiveTab("credentials");
      return false;
    }
    setError("");
    return true;
  };

  const handleNextFromDossier = () => {
    if (validateDossier()) {
      setActiveTab("credentials");
    }
  };

  const handleNextFromCredentials = () => {
    if (validateDossier() && validateCredentials()) {
      setActiveTab("biometrics");
    }
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setError("");

    if (!validateDossier()) return;
    if (!validateCredentials()) return;

    const livePhoto = formData.photoUrl || biometricData?.photoUrl;
    if (!livePhoto) {
      setError("MANDATORY FACIAL ENROLLMENT: Officer face photo must be captured before registration.");
      setActiveTab("biometrics");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAdd({
        ...formData,
        photoUrl: livePhoto,
        avatar: livePhoto
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to register officer into database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto font-jakarta">
      {/* Backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

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
                    <FaCheckCircle /> FACE PHOTO CAPTURED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-amber-500/20 text-amber-400 border border-amber-500/40 font-bold flex items-center gap-1 animate-pulse">
                    <FaCamera /> FACE PHOTO REQUIRED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5">
                Admin Dossier Provisioning • Mandatory Cloudinary CV Face Enrollment
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

        {/* 3-Step Wizard Navigation Bar */}
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
            onClick={() => {
              if (validateDossier()) setActiveTab("credentials");
            }}
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
            onClick={() => {
              if (validateDossier() && validateCredentials()) setActiveTab("biometrics");
            }}
            className={`py-3.5 px-3 flex items-center justify-center gap-2 border-b-2 font-bold uppercase transition-all cursor-pointer relative ${
              activeTab === "biometrics"
                ? "border-cyan-400 text-cyan-300 bg-cyan-500/15"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <FaCamera className={`text-xs ${!biometricEnrolled ? "text-amber-400 animate-pulse" : "text-emerald-400"}`} />
            <span className="hidden sm:inline">3. Face Photo Enrollment</span>
            <span className="sm:hidden">3. Face Capture</span>
            {biometricEnrolled && (
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 absolute top-2 right-2" />
            )}
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit}>
          
          <div className="p-6 sm:p-8 max-h-[65vh] overflow-y-auto space-y-6">

            {/* TAB 1: Core Dossier */}
            {activeTab === "dossier" && (
              <div className="space-y-5 animate-fade-in">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Officer Full Name <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Rajesh Sharma"
                      required
                      autoFocus
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium shadow-inner placeholder-slate-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Rank / Designation <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <select
                      name="rank"
                      value={formData.rank}
                      onChange={handleChange}
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-3 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium shadow-inner cursor-pointer"
                    >
                      <option value="Police Inspector">Police Inspector (PI)</option>
                      <option value="Sub-Inspector">Sub-Inspector (PSI)</option>
                      <option value="Assistant Sub-Inspector">Assistant Sub-Inspector (ASI)</option>
                      <option value="Deputy Superintendent of Police (DSP)">Deputy Superintendent of Police (DSP)</option>
                      <option value="Superintendent of Police (SP)">Superintendent of Police (SP)</option>
                      <option value="Inspector General of Police (IGP)">Inspector General of Police (IGP)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Badge / KGID Number <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <input
                      type="text"
                      name="badgeNumber"
                      value={formData.badgeNumber}
                      onChange={handleChange}
                      placeholder="MPP-2026-901"
                      required
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-cyan-300 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-mono font-bold shadow-inner"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      District Jurisdiction <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <select
                      name="station"
                      value={formData.station}
                      onChange={handleChange}
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-3 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium shadow-inner cursor-pointer"
                    >
                      {MP_DISTRICTS.map((dist) => (
                        <option key={dist} value={dist}>{dist} District</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Years of Service
                    </label>
                    <input
                      type="number"
                      name="yearsOfService"
                      min="1"
                      max="40"
                      value={formData.yearsOfService}
                      onChange={handleChange}
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium shadow-inner"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Assigned Division / Unit <span className="text-rose-500 font-bold ml-1">*</span>
                    </label>
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-3 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium shadow-inner cursor-pointer"
                    >
                      {MP_STATIONS.map((stn) => (
                        <option key={stn} value={stn}>{stn}</option>
                      ))}
                      <option value="General Crime Investigation Unit">General Crime Investigation Unit</option>
                      <option value="State Special Task Force (STF)">State Special Task Force (STF)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Specialized Domain / Focus
                    </label>
                    <input
                      type="text"
                      name="specialArea"
                      value={formData.specialArea}
                      onChange={handleChange}
                      placeholder="e.g. Financial Fraud & Mule Link Analysis"
                      className="w-full h-11 rounded-xl bg-slate-950/80 border border-slate-800 px-4 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 font-medium shadow-inner placeholder-slate-500"
                    />
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: Credentials */}
            {activeTab === "credentials" && (
              <div className="space-y-5 animate-fade-in">
                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs flex items-start gap-2.5">
                  <FaKey className="text-base text-blue-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">System Credentials Provisioning:</span> The officer will use these credentials along with Facial Recognition 2FA to access the CCTNS portal.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-300">
                      Login Username <span className="text-rose-500 font-bold ml-1">*</span>
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

              </div>
            )}

            {/* TAB 3: Computer Vision Facial Photo Enrollment & Cloudinary Storage */}
            {activeTab === "biometrics" && (
              <div className="space-y-5 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold font-space text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                      <FaCamera /> Mandatory Facial Photo Enrollment • Cloudinary AI
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Capture and enroll the officer's facial photo into Cloudinary. This photo is permanently bound to the officer's ID in Zoho Catalyst for Computer Vision 2FA verification during FIR CRUD actions.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">Step 3 of 3</span>
                </div>

                {/* Active Face Enrollment Camera Widget */}
                <FaceEnrollmentWidget
                  ref={faceWidgetRef}
                  officerData={formData}
                  isEnrolled={biometricEnrolled}
                  enrolledInfo={biometricData}
                  onEnrollmentComplete={handleEnrollmentSuccess}
                />
              </div>
            )}

          </div>

          {/* Prominent Error Banner */}
          {error && (
            <div className="px-6 py-2.5 mx-6 mb-2 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-2 shadow-sm animate-shake">
              <div className="flex items-center gap-2">
                <FaExclamationCircle className="text-rose-400 flex-shrink-0 text-sm" />
                <span className="font-medium">{error}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setError("")}
                className="text-rose-400 hover:text-white text-xs cursor-pointer"
              >
                <FaTimes />
              </button>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div 
            className="py-4 sm:py-5 bg-slate-900/90 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 sm:px-8"
          >
            <div className="text-xs text-slate-400 font-sans">
              <span className="text-rose-500 font-bold">*</span> Mandatory fields • Facial photo required before database registration
            </div>
            
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="h-11 px-5 rounded-xl border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition-all cursor-pointer"
              >
                Cancel
              </button>

              {/* Wizard Step 1 Action */}
              {activeTab === "dossier" && (
                <button
                  type="button"
                  onClick={handleNextFromDossier}
                  className="h-11 px-6 rounded-xl font-space text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer border-none text-white bg-blue-600 hover:bg-blue-500 shadow-blue-600/25 active:scale-95"
                >
                  <span>Next: Login Credentials</span>
                  <FaArrowRight className="text-xs" />
                </button>
              )}

              {/* Wizard Step 2 Action */}
              {activeTab === "credentials" && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("dossier")}
                    className="h-11 px-4 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <FaArrowLeft className="text-[10px]" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextFromCredentials}
                    className="h-11 px-6 rounded-xl font-space text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer border-none text-white bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-cyan-600/25 active:scale-95"
                  >
                    <span>Next: Face Photo</span>
                    <FaArrowRight className="text-xs" />
                  </button>
                </>
              )}

              {/* Wizard Step 3 Action */}
              {activeTab === "biometrics" && (
                <>
                  <button
                    type="button"
                    onClick={() => setActiveTab("credentials")}
                    className="h-11 px-4 rounded-xl border border-slate-800 bg-slate-900 text-slate-400 hover:text-white font-mono text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <FaArrowLeft className="text-[10px]" />
                    <span>Back</span>
                  </button>

                  {!biometricEnrolled ? (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        faceWidgetRef.current?.capture();
                      }}
                      className="h-11 px-6 rounded-xl font-space text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer border-none text-white bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-500 hover:to-teal-400 shadow-cyan-500/30 active:scale-95 animate-pulse"
                    >
                      <FaCamera className="text-sm" />
                      <span>Capture Officer Photo</span>
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="h-11 px-6 rounded-xl font-space text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer border-none text-white bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 active:scale-95 disabled:opacity-50"
                    >
                      <FaCheckCircle className="text-sm" />
                      <span>{isSubmitting ? "Registering Officer..." : "Register Officer & Save Photo"}</span>
                    </button>
                  )}
                </>
              )}

            </div>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
};

export default AddOfficerModal;
