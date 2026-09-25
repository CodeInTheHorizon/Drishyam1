import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { authService } from "../../services/authService";
import { officerService } from "../../services/officerService";
import {
  FaLock,
  FaKey,
  FaShieldAlt,
  FaUserCheck,
  FaSave,
  FaCheckCircle,
  FaExclamationCircle,
  FaUpload,
  FaUser,
  FaEye,
  FaEyeSlash,
  FaSearch,
  FaCopy,
  FaCheck,
  FaFingerprint,
  FaBuilding,
  FaUserShield,
  FaSyncAlt,
  FaImages
} from "react-icons/fa";

const PRESET_AVATARS = [
  { label: "Commander Profile", url: "https://i.pinimg.com/1200x/27/0c/e1/270ce1193cbdc1cb9f4211e8e0eaf87d.jpg" },
  { label: "Tactical Officer", url: "https://i.pinimg.com/1200x/3a/01/97/3a0197357a4ad3428b34eb8884cf4cea.jpg" },
  { label: "Inspector Profile", url: "https://i.pinimg.com/736x/2c/11/3f/2c113fd9405b68fa8e59fbf22a17ed45.jpg" },
  { label: "Special Ops Officer", url: "https://i.pinimg.com/1200x/4a/00/0f/4a000f954bc84e713ce910bc90de34f9.jpg" },
  { label: "Field Officer", url: "https://i.pinimg.com/736x/09/74/48/0974482cba0effe8a902070d27fcc952.jpg" },
  { label: "Senior DySP", url: "https://i.pinimg.com/1200x/18/1e/26/181e26c023cfd2c8eee90ebb99fbddfb.jpg" },
  { label: "Intelligence Officer", url: "https://i.pinimg.com/736x/a5/9f/3e/a59f3e2c45390d5ff9ba4291a77f1212.jpg" },
  { label: "Operations Officer", url: "https://i.pinimg.com/736x/80/7b/ec/807bec8232c15e4db104f32fa1887835.jpg" }
];

const Settings = () => {
  const { currentUser, isAdmin, isOfficer, updateUserProfile, updatePassword, updatePin } = useAuth();

  // Admin Security PIN State
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [pinSuccess, setPinSuccess] = useState("");
  const [pinError, setPinError] = useState("");

  // Officer Profile & Credentials State
  const [profileForm, setProfileForm] = useState({
    name: "",
    username: "",
    phone: "",
    address: "",
    avatar: "",
    unit: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  // Admin Officer Password Reset State
  const [selectedUserId, setSelectedUserId] = useState("");
  const [officerNewPassword, setOfficerNewPassword] = useState("");
  const [officerPwdSuccess, setOfficerPwdSuccess] = useState("");
  const [officerPwdError, setOfficerPwdError] = useState("");
  const [officerSearch, setOfficerSearch] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  const [usersList, setUsersList] = useState([]);

  // Copy helper
  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(""), 2000);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setProfileError("File size exceeds 5 MB limit.");
      return;
    }

    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setProfileError("Supported formats: PNG, JPG, JPEG.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setProfileForm((prev) => ({
        ...prev,
        avatar: reader.result
      }));
      setProfileSuccess("Image loaded successfully. Save changes to update profile photo.");
    };
    reader.readAsDataURL(file);
  };

  // Sync state with current user session and fetch online database officers
  useEffect(() => {
    const sync = async () => {
      await authService.syncOnlineOfficers();
      setUsersList(authService.getUsers().filter((u) => u.role === "OFFICER"));
    };
    sync();

    if (currentUser) {
      setProfileForm({
        name: currentUser.name || "",
        username: currentUser.username || "",
        phone: currentUser.phone || "+91 98450 12345",
        address: currentUser.address || "Koramangala Police Station Quarters, Bengaluru",
        avatar: currentUser.avatar || PRESET_AVATARS[0].url,
        unit: currentUser.unit || "State Crime Division",
        newPassword: "",
        confirmPassword: ""
      });
    }
  }, [currentUser]);

  // Handle Admin Security PIN Change
  const handlePinUpdate = (e) => {
    e.preventDefault();
    setPinSuccess("");
    setPinError("");

    const cleanPin = newPin.trim();
    if (cleanPin === authService.getSecurityPin()) {
      setPinError("New Security PIN must be different from the current active PIN.");
      return;
    }

    try {
      const updated = updatePin(cleanPin);
      setPinSuccess(`Records Security PIN successfully updated to '${updated}'!`);
      setNewPin("");
    } catch (err) {
      setPinError(err.message || "Failed to update Security PIN.");
    }
  };

  // Handle Officer Profile & Credentials Update
  const handleProfileUpdate = (e) => {
    e.preventDefault();
    setProfileSuccess("");
    setProfileError("");

    if (!currentUser) return;

    const currentPhone = currentUser.phone || "+91 98450 12345";
    const currentAddress = currentUser.address || "Koramangala Police Station Quarters, Bengaluru";
    const currentAvatar = currentUser.avatar || PRESET_AVATARS[0].url;
    const currentUnit = currentUser.unit || "State Crime Division";

    const isNameChanged = profileForm.name.trim() !== (currentUser.name || "").trim();
    const isUsernameChanged = profileForm.username.trim() !== (currentUser.username || "").trim();
    const isPhoneChanged = profileForm.phone.trim() !== currentPhone.trim();
    const isAddressChanged = profileForm.address.trim() !== currentAddress.trim();
    const isAvatarChanged = profileForm.avatar.trim() !== currentAvatar.trim();
    const isUnitChanged = profileForm.unit.trim() !== currentUnit.trim();
    const isPasswordChanged = Boolean(profileForm.newPassword.trim());

    const hasChanges =
      isNameChanged ||
      isUsernameChanged ||
      isPhoneChanged ||
      isAddressChanged ||
      isAvatarChanged ||
      isUnitChanged ||
      isPasswordChanged;

    if (!hasChanges) {
      setProfileError("No changes detected. Modify at least one field before saving.");
      return;
    }

    if (profileForm.newPassword) {
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileError("Passwords do not match. Please re-enter.");
        return;
      }
      if (profileForm.newPassword.length < 4) {
        setProfileError("Password must be at least 4 characters.");
        return;
      }
    }

    try {
      const updatedUser = updateUserProfile({
        name: profileForm.name,
        username: profileForm.username,
        phone: profileForm.phone,
        address: profileForm.address,
        avatar: profileForm.avatar,
        unit: profileForm.unit,
        password: profileForm.newPassword || undefined
      });

      // Also sync avatar & details to officerService if badge matches
      if (currentUser?.badge || currentUser?.kgid) {
        const badge = currentUser.badge || currentUser.kgid;
        const existingProf = officerService.getOfficerProfile(badge);
        if (existingProf) {
          officerService.addOfficer({
            ...existingProf,
            name: updatedUser.name,
            unit: updatedUser.unit,
            avatar: updatedUser.avatar,
            badgeNumber: badge
          });
        }
      }

      setProfileSuccess("Officer profile and access credentials updated successfully!");
      setProfileForm((prev) => ({ ...prev, newPassword: "", confirmPassword: "" }));
    } catch (err) {
      setProfileError(err.message || "Failed to update profile.");
    }
  };

  // Handle Admin Password Reset for Officers
  const handleOfficerPasswordReset = (e) => {
    e.preventDefault();
    setOfficerPwdSuccess("");
    setOfficerPwdError("");

    if (!selectedUserId) {
      setOfficerPwdError("Please select an officer account.");
      return;
    }

    if (!officerNewPassword || officerNewPassword.length < 4) {
      setOfficerPwdError("Password must be at least 4 characters long.");
      return;
    }

    try {
      const targetUser = usersList.find((u) => u.id === selectedUserId);
      authService.updatePassword(selectedUserId, officerNewPassword);
      setOfficerPwdSuccess(`Password for officer '${targetUser?.name}' (${targetUser?.username}) updated successfully!`);
      setOfficerNewPassword("");
      setSelectedUserId("");
    } catch (err) {
      setOfficerPwdError(err.message || "Failed to reset officer password.");
    }
  };

  // Filter officers directory
  const filteredOfficers = usersList.filter((u) => {
    const q = officerSearch.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name || "").toLowerCase().includes(q) ||
      (u.username || "").toLowerCase().includes(q) ||
      (u.rank || "").toLowerCase().includes(q) ||
      (u.kgid || "").toLowerCase().includes(q) ||
      (u.unit || "").toLowerCase().includes(q)
    );
  });

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="w-full font-inter relative pb-24 flex flex-col gap-9 px-1 sm:px-2 animate-fade-in">
      
      {/* 1. TOP COMMAND BAR */}
      <div 
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl"
        style={{ padding: "24px 32px" }}
      >
        <div style={{ paddingLeft: "6px" }}>
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[10px] font-mono font-bold tracking-widest text-blue-400 uppercase">
              SECURITY & SYSTEM GOVERNANCE
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight mt-1.5 font-space">
            Settings & Profile Management
          </h1>
          <p className="mt-1 text-xs text-slate-300 font-normal font-inter">
            Configure officer identity, authentication credentials, security PINs, and station assignments.
          </p>
        </div>

        {/* Live Status Telemetry Chips */}
        <div className="flex flex-wrap items-center gap-6 font-mono text-[10px] pr-2">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
            <span>SESSION: <strong className="text-emerald-400 font-bold">ENCRYPTED</strong></span>
          </div>
          <div className="h-4 w-px bg-slate-700/60 hidden sm:block" />
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-slate-300 font-semibold">{today}</span>
          </div>
        </div>
      </div>

      {/* 2. OFFICER HERO DOSSIER CARD */}
      <div 
        className="bg-gradient-to-r from-slate-900/90 via-[#081220] to-slate-900/90 rounded-2xl border border-blue-500/25 shadow-xl relative overflow-hidden backdrop-blur-md"
        style={{ padding: "38px 44px" }}
      >
        {/* Subtle Cyber Watermark Accent */}
        <div className="absolute right-0 bottom-0 opacity-[0.03] text-[220px] pointer-events-none translate-y-16 translate-x-16 select-none font-mono">
          🛡️
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-9 items-center relative z-10 font-inter">
          
          {/* Group 1: Avatar & Photo Controls */}
          <div className="flex flex-col items-center gap-3.5">
            <div className="relative group">
              <div className="h-32 w-32 rounded-xl overflow-hidden border-2 border-blue-500/40 bg-slate-950 shadow-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-105">
                <img
                  src={profileForm.avatar || PRESET_AVATARS[0].url}
                  alt="Officer Avatar"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-1.5 rounded-full border-2 border-slate-900 shadow-lg">
                <FaUserShield className="text-xs" />
              </div>
            </div>

            <div className="flex items-center gap-2 mt-1">
              <label 
                htmlFor="avatar-upload-hero" 
                className="cursor-pointer bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 hover:bg-slate-800 hover:border-blue-500/50 hover:text-white transition-all shadow-sm font-inter"
              >
                <FaUpload className="text-[10px] text-blue-400" /> Upload
              </label>
              <input
                type="file"
                id="avatar-upload-hero"
                accept="image/png, image/jpeg, image/jpg"
                onChange={handleFileChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => setShowAvatarModal(!showAvatarModal)}
                className="bg-slate-950/80 border border-slate-700/80 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-slate-200 flex items-center gap-1.5 hover:bg-slate-800 hover:border-blue-500/50 hover:text-white transition-all shadow-sm font-inter cursor-pointer"
              >
                <FaImages className="text-[10px] text-blue-400" /> Presets
              </button>
            </div>
          </div>

          {/* Group 2: Identity */}
          <div className="flex flex-col space-y-3" style={{ paddingLeft: "18px" }}>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaUser className="text-blue-400 text-xs" /> OFFICER IDENTITY
            </span>
            <div className="space-y-1.5">
              <h2 className="text-xl font-bold font-space text-white leading-tight">
                {currentUser?.name || "Commanding Officer"}
              </h2>
              <span className="inline-block text-[10.5px] font-bold text-blue-400 uppercase tracking-wider font-mono">
                {currentUser?.rank || "Officer Rank"}
              </span>
            </div>
          </div>

          {/* Group 3: Organization */}
          <div className="flex flex-col space-y-3" style={{ paddingLeft: "18px" }}>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaBuilding className="text-blue-400 text-xs" /> ASSIGNMENT UNIT
            </span>
            <div className="space-y-3 text-[12px]">
              <div>
                <span className="text-slate-400 text-[9px] block font-mono uppercase leading-none mb-1">STATION / UNIT</span>
                <span className="font-semibold text-white">{currentUser?.unit || "KSP Intelligence HQ"}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[9px] block font-mono uppercase leading-none mb-1">KGID NUMBER</span>
                <button
                  type="button"
                  onClick={() => handleCopy(currentUser?.kgid || "KSP-ADMIN-01", "kgid")}
                  className="font-semibold font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Click to copy KGID"
                >
                  <span>{currentUser?.kgid || "KSP-ADMIN-01"}</span>
                  {copiedKey === "kgid" ? <FaCheck className="text-emerald-400 text-[10px]" /> : <FaCopy className="text-[10px] opacity-60 hover:opacity-100" />}
                </button>
              </div>
            </div>
          </div>

          {/* Group 4: Security Clearance */}
          <div className="flex flex-col space-y-3" style={{ paddingLeft: "18px" }}>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaFingerprint className="text-blue-400 text-xs" /> CLEARANCE LEVEL
            </span>
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 text-xs text-emerald-400 font-bold font-mono tracking-wider bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded-md shadow-inner">
                <FaShieldAlt className="text-xs text-emerald-400" /> LEVEL 1 AUTHORIZED
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                <span className="block text-[8.5px] text-slate-400 uppercase">ACCESS GRANTED</span>
                State Security Grid Active
              </div>
            </div>
          </div>

          {/* Group 5: Operational Status */}
          <div className="flex flex-col space-y-3" style={{ paddingLeft: "18px" }}>
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
              <FaSyncAlt className="text-blue-400 text-xs" /> NETWORK STATUS
            </span>
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-2 bg-blue-950/50 border border-blue-800/40 px-3 py-1 rounded-md">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-[10px] font-bold text-blue-300 font-mono tracking-wide">
                  ACTIVE ON-GRID
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                CCTNS Node #BLR-HQ-09
              </div>
            </div>
          </div>

        </div>

        {/* Preset Avatars Drawer Modal */}
        {showAvatarModal && (
          <div className="mt-7 pt-7 border-t border-slate-800/80 animate-fade-in">
            <div className="flex items-center justify-between mb-4 font-inter">
              <span className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <FaImages className="text-blue-400" /> Select an Officer Avatar Preset
              </span>
              <button
                type="button"
                onClick={() => setShowAvatarModal(false)}
                className="text-xs text-slate-400 hover:text-white font-mono cursor-pointer"
              >
                ✕ Close
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3.5">
              {PRESET_AVATARS.map((av, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setProfileForm((prev) => ({ ...prev, avatar: av.url }));
                    setProfileSuccess(`Selected ${av.label}. Click 'Update Profile' to save.`);
                  }}
                  className={`relative rounded-lg overflow-hidden border-2 transition-all p-0.5 cursor-pointer group ${
                    profileForm.avatar === av.url ? "border-blue-500 shadow-lg scale-105" : "border-slate-800 hover:border-slate-600 opacity-80 hover:opacity-100"
                  }`}
                >
                  <img src={av.url} alt={av.label} className="h-14 w-full object-cover rounded-md" />
                  <span className="text-[8px] font-mono text-center block text-slate-400 group-hover:text-white truncate mt-1">
                    {av.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 3. MAIN CONFIGURATION CARDS (Plus Jakarta Sans Exclusively Applied Here) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 z-10 relative font-jakarta">

        {/* Profile & Credentials form spans 9 columns if admin, 12 columns if officer */}
        <form
          onSubmit={handleProfileUpdate}
          className={`grid grid-cols-1 gap-8 ${isAdmin ? "lg:col-span-9 lg:grid-cols-9" : "lg:col-span-12 lg:grid-cols-12"}`}
        >
          {/* Card 1: Account Profile Details */}
          <div
            id="profile-details-section"
            className={`flex flex-col justify-between bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl p-8 sm:p-10 lg:p-12 ${
              isAdmin ? "lg:col-span-5" : "lg:col-span-7"
            }`}
          >
            <div className="px-3 sm:px-4">
              {/* Header */}
              <div 
                className="flex items-center gap-3 border-b border-slate-800/60 pb-4 mb-6"
                style={{ paddingLeft: "10px", paddingRight: "10px", paddingTop: "4px" }}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    {isOfficer ? "Officer Profile & Station Details" : "Account Profile Details"}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5 leading-normal">
                    Update profile, contacts, address, and assigned station.
                  </p>
                </div>
              </div>

              {profileSuccess && (
                <div className="p-3.5 mb-5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
                  <FaCheckCircle className="text-emerald-400 text-sm flex-shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {profileError && (
                <div className="p-3.5 mb-5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
                  <FaExclamationCircle className="text-red-400 text-sm flex-shrink-0" />
                  <span>{profileError}</span>
                </div>
              )}

              {/* Grid Inputs with Plus Jakarta Sans */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 mt-5 px-2 sm:px-3">
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    Officer Full Name <span className="text-blue-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileForm.name}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, name: e.target.value }))}
                      required
                      className="w-full h-12 rounded-xl bg-slate-950/80 border border-slate-700/70 text-[13px] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-slate-500 shadow-inner font-medium"
                      style={{ paddingLeft: "18px", paddingRight: "18px" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    Phone Contact Number
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                      className="w-full h-12 rounded-xl bg-slate-950/80 border border-slate-700/70 text-[13px] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-slate-500 shadow-inner font-medium"
                      style={{ paddingLeft: "18px", paddingRight: "18px" }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    Division / Range
                  </label>
                  <input
                    type="text"
                    value="Bengaluru City Police"
                    readOnly
                    className="w-full h-12 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[13px] text-slate-400 outline-none cursor-not-allowed shadow-inner font-medium"
                    style={{ paddingLeft: "18px", paddingRight: "18px" }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    Address / Station Quarters
                  </label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, address: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-slate-950/80 border border-slate-700/70 text-[13px] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-slate-500 shadow-inner font-medium"
                    style={{ paddingLeft: "18px", paddingRight: "18px" }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    District
                  </label>
                  <input
                    type="text"
                    value="Bengaluru Urban"
                    readOnly
                    className="w-full h-12 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[13px] text-slate-400 outline-none cursor-not-allowed shadow-inner font-medium"
                    style={{ paddingLeft: "18px", paddingRight: "18px" }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    Assigned Unit / Station
                  </label>
                  <input
                    type="text"
                    value={profileForm.unit}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, unit: e.target.value }))}
                    className="w-full h-12 rounded-xl bg-slate-950/80 border border-slate-700/70 text-[13px] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all placeholder-slate-500 shadow-inner font-medium"
                    style={{ paddingLeft: "18px", paddingRight: "18px" }}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    Email (Official CCTNS ID)
                  </label>
                  <input
                    type="email"
                    value={currentUser?.email || "officer@ksp.gov.in"}
                    readOnly
                    className="w-full h-12 rounded-xl bg-slate-950/40 border border-slate-800/80 text-[13px] text-slate-400 outline-none cursor-not-allowed shadow-inner font-medium"
                    style={{ paddingLeft: "18px", paddingRight: "18px" }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-800/50 px-3 sm:px-4">
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-none outline-none shadow-lg shadow-blue-600/20 font-jakarta"
              >
                <FaSave /> Save Profile Changes
              </button>
            </div>
          </div>

          {/* Card 2: Manage Login Credentials */}
          <div
            id="login-credentials-section"
            className={`flex flex-col justify-between bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl p-8 sm:p-10 lg:p-12 ${
              isAdmin ? "lg:col-span-4" : "lg:col-span-5"
            }`}
          >
            <div className="px-3 sm:px-4">
              {/* Header */}
              <div 
                className="flex items-center gap-3 border-b border-slate-800/60 pb-4 mb-6"
                style={{ paddingLeft: "10px", paddingRight: "10px", paddingTop: "4px" }}
              >
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                    Login Credentials
                  </h4>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5 leading-normal">
                    Configure login identifier and security passphrase updates.
                  </p>
                </div>
              </div>

              {/* Form Inputs */}
              <div className="space-y-5 mt-5 px-2 sm:px-3">
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    Login Username
                  </label>
                  <input
                    type="text"
                    value={profileForm.username}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, username: e.target.value }))}
                    required
                    className="w-full h-12 rounded-xl bg-slate-950/80 border border-slate-700/70 text-[13px] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-semibold font-mono placeholder-slate-650 shadow-inner"
                    style={{ paddingLeft: "18px", paddingRight: "18px" }}
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    New Password (Optional)
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={profileForm.newPassword}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Leave blank to keep current"
                      className="w-full h-12 rounded-xl bg-slate-950/80 border border-slate-700/70 text-[13px] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono placeholder-slate-600 shadow-inner font-medium"
                      style={{ paddingLeft: "18px", paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-1"
                    >
                      {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={profileForm.confirmPassword}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Re-enter new password"
                      className="w-full h-12 rounded-xl bg-slate-950/80 border border-slate-700/70 text-[13px] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono placeholder-slate-600 shadow-inner font-medium"
                      style={{ paddingLeft: "18px", paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-1"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-5 border-t border-slate-800/50 px-3 sm:px-4">
              <button
                type="submit"
                className="h-12 w-full rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-none outline-none shadow-lg shadow-blue-600/20 font-jakarta"
              >
                <FaKey /> Update Credentials
              </button>
            </div>
          </div>
        </form>

        {/* Card 3: Records Security PIN Configuration (Admin Only) */}
        {isAdmin && (
          <div
            id="pin-config-section"
            className="lg:col-span-3 flex flex-col justify-between bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl p-8 sm:p-10 lg:p-12"
          >
            <form onSubmit={handlePinUpdate} className="h-full flex flex-col justify-between px-3 sm:px-4">
              <div>
                {/* Header */}
                <div 
                  className="flex items-center gap-3 border-b border-slate-800/60 pb-4 mb-6"
                  style={{ paddingLeft: "10px", paddingRight: "10px", paddingTop: "4px" }}
                >
                  <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      Records Security PIN
                    </h4>
                    <p className="text-[11px] text-slate-400 font-normal mt-0.5 leading-normal">
                      Required for modifying FIR records.
                    </p>
                  </div>
                </div>

                {pinSuccess && (
                  <div className="p-3.5 mb-5 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
                    <FaCheckCircle className="text-emerald-400 text-sm flex-shrink-0" />
                    <span>{pinSuccess}</span>
                  </div>
                )}

                {pinError && (
                  <div className="p-3.5 mb-5 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5 animate-fade-in font-medium">
                    <FaExclamationCircle className="text-red-400 text-sm flex-shrink-0" />
                    <span>{pinError}</span>
                  </div>
                )}

                {/* PIN Input */}
                <div className="space-y-2.5 mt-5 px-2 sm:px-3">
                  <label className="block text-[11px] font-semibold text-slate-300 tracking-normal" style={{ paddingLeft: "6px" }}>
                    Enter New PIN (4-6 Digits)
                  </label>
                  <div className="relative">
                    <input
                      type={showPin ? "text" : "password"}
                      maxLength={6}
                      value={newPin}
                      onChange={(e) => setNewPin(e.target.value)}
                      placeholder="••••"
                      required
                      className="w-full h-12 rounded-xl bg-slate-950/80 border border-slate-700/70 text-[13px] text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono tracking-widest placeholder-slate-600 shadow-inner"
                      style={{ paddingLeft: "18px", paddingRight: "44px" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs cursor-pointer p-1"
                    >
                      {showPin ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1" style={{ paddingLeft: "6px" }}>
                    Used as the cryptographic authorization lock when editing or deleting FIRs.
                  </p>
                </div>
              </div>

              <div className="mt-8 pt-5 border-t border-slate-800/50 px-3 sm:px-4">
                <button
                  type="submit"
                  className="h-12 w-full rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-none outline-none shadow-lg shadow-blue-600/20 font-jakarta"
                >
                  <FaLock /> Update PIN
                </button>
              </div>
            </form>
          </div>
        )}

      </div>

      {/* 4. POLICE OFFICERS DIRECTORY & CREDENTIAL RESET (Reverted to Original font-space / font-inter / font-mono) */}
      {isAdmin && (
        <div className="bg-slate-900/85 border border-slate-700/60 rounded-2xl backdrop-blur-md shadow-2xl p-8 sm:p-10 lg:p-12 space-y-7 z-10 relative font-inter">

          {/* Header & Search Filter */}
          <div 
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/60 pb-5" 
            style={{ paddingLeft: "16px", paddingRight: "16px", paddingTop: "4px" }}
          >
            <div>
              <div className="flex items-center gap-3">
                <div className="h-2.5 w-2.5 rounded-full bg-blue-500 animate-pulse" />
                <h3 className="text-sm font-bold font-space text-white uppercase tracking-wider flex items-center gap-2">
                  <FaUserCheck className="text-blue-400 text-base" />
                  Police Officers Directory & Credential Reset
                </h3>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-sans" style={{ paddingLeft: "22px" }}>
                Active CCTNS personnel accounts, access authorizations, and credentials override console.
              </p>
            </div>

            {/* Quick Search */}
            <div className="relative w-full md:w-72">
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 text-xs" />
              <input
                type="text"
                placeholder="Search by name, KGID, unit..."
                value={officerSearch}
                onChange={(e) => setOfficerSearch(e.target.value)}
                className="w-full h-10 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-inter placeholder-slate-600 shadow-inner"
                style={{ paddingLeft: "36px", paddingRight: "14px" }}
              />
            </div>
          </div>

          {officerPwdSuccess && (
            <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
              <FaCheckCircle className="text-emerald-400 text-sm flex-shrink-0" />
              <span>{officerPwdSuccess}</span>
            </div>
          )}

          {officerPwdError && (
            <div className="p-3.5 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center gap-2.5 animate-fade-in">
              <FaExclamationCircle className="text-red-400 text-sm flex-shrink-0" />
              <span>{officerPwdError}</span>
            </div>
          )}

          {/* Premium Wikipedia/CCTNS Style Fully Bordered Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-inter border-collapse border border-slate-800">
                <thead>
                  <tr className="bg-slate-950 text-slate-300 font-bold border-b border-slate-800 uppercase text-[10px] tracking-wider font-space">
                    <th className="py-3.5 px-6 border border-slate-800">Officer Name</th>
                    <th className="py-3.5 px-6 border border-slate-800">Rank & KGID</th>
                    <th className="py-3.5 px-6 border border-slate-800">Login Username</th>
                    <th className="py-3.5 px-6 border border-slate-800">Active Passphrase</th>
                    <th className="py-3.5 px-6 border border-slate-800">Assigned Unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredOfficers.length > 0 ? (
                    filteredOfficers.map((off) => (
                      <tr 
                        key={off.id} 
                        className="bg-slate-900/40 hover:bg-slate-800/50 transition-colors duration-150"
                      >
                        <td className="py-3.5 px-6 border border-slate-800 font-semibold text-white">
                          <div className="flex items-center gap-3.5">
                            <img
                              src={off.avatar || PRESET_AVATARS[0].url}
                              alt={off.name}
                              className="h-8 w-8 rounded-lg object-cover border border-slate-700/80 shadow-md flex-shrink-0"
                            />
                            <span className="font-semibold text-slate-100">{off.name}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-6 border border-slate-800 font-medium text-slate-300 font-mono text-[11px]">
                          {off.rank} • <span className="text-cyan-400 font-semibold">{off.kgid}</span>
                        </td>
                        <td className="py-3.5 px-6 border border-slate-800 font-mono text-blue-400 font-semibold">
                          <button
                            type="button"
                            onClick={() => handleCopy(off.username, `user_${off.id}`)}
                            className="bg-slate-950/80 px-2.5 py-1 rounded border border-slate-800 hover:border-slate-600 transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Click to copy username"
                          >
                            <span>{off.username}</span>
                            {copiedKey === `user_${off.id}` ? <FaCheck className="text-emerald-400 text-[10px]" /> : <FaCopy className="text-[10px] opacity-40 hover:opacity-100" />}
                          </button>
                        </td>
                        <td className="py-3.5 px-6 border border-slate-800 font-mono text-emerald-400 font-bold">
                          <button
                            type="button"
                            onClick={() => handleCopy(off.password || "officer123", `pwd_${off.id}`)}
                            className="bg-emerald-950/30 text-emerald-300 px-2.5 py-1 rounded border border-emerald-800/40 hover:border-emerald-700 transition-all flex items-center gap-1.5 cursor-pointer"
                            title="Click to copy password"
                          >
                            <span>{off.password || "officer123"}</span>
                            {copiedKey === `pwd_${off.id}` ? <FaCheck className="text-emerald-400 text-[10px]" /> : <FaCopy className="text-[10px] opacity-40 hover:opacity-100" />}
                          </button>
                        </td>
                        <td className="py-3.5 px-6 border border-slate-800 text-slate-300 font-sans">
                          {off.unit || "General Unit"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500 italic font-mono text-xs border border-slate-800">
                        No officers matched your search query "{officerSearch}".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Override Password Action Console */}
          <div className="pt-2">
            <form onSubmit={handleOfficerPasswordReset} className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end bg-slate-950/60 border border-slate-800/80 p-5 rounded-xl">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400" style={{ paddingLeft: "4px" }}>
                  Select Officer Account
                </label>
                <div className="relative">
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full h-11 rounded-lg bg-slate-900 border border-slate-800 pr-10 text-xs text-slate-200 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all cursor-pointer appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2020%2020%2522%20fill%3D%22none%22%3E%3Cpath%20d%3D%22M7%209l3%203%203-3%22%20stroke%3D%22%2394a3b8%22%20stroke-width%3D%221.5%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat font-inter shadow-inner"
                    style={{ paddingLeft: "16px" }}
                  >
                    <option value="">-- Choose Officer Account --</option>
                    {usersList.map((off) => (
                      <option key={off.id} value={off.id}>
                        {off.name} (Username: {off.username} | Password: {off.password || "officer123"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400" style={{ paddingLeft: "4px" }}>
                  Set New Override Password
                </label>
                <input
                  type="text"
                  value={officerNewPassword}
                  onChange={(e) => setOfficerNewPassword(e.target.value)}
                  placeholder="Enter new passphrase..."
                  className="w-full h-11 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono placeholder-slate-600 shadow-inner"
                  style={{ paddingLeft: "16px", paddingRight: "16px" }}
                />
              </div>

              <button
                type="submit"
                className="h-11 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer border-none outline-none font-space shadow-lg shadow-blue-600/20"
              >
                <FaKey /> Override Password
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Settings;
