import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaUserShield, FaUserCheck, FaLock, FaKey, FaExclamationCircle } from "react-icons/fa";
import { motion } from "framer-motion";
import LetterGlitch from "../../components/backgrounds/LetterGlitch";
import kspLogo from "../../assets/images/ksp-emblem.png";

const Login = () => {
  const [activeTab, setActiveTab] = useState("admin"); // "admin" | "officer"
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("admin");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { loginAdmin, loginOfficer } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setError("");
    if (tab === "admin") {
      setUsername("admin");
      setPassword("admin");
    } else {
      setUsername("ksp.ramesh");
      setPassword("Officer@123");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (activeTab === "admin") {
        await loginAdmin(username, password);
      } else {
        await loginOfficer(username, password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || "Failed to authenticate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#020617] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden font-sans">

      {/* Background LetterGlitch Animation Layer */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <LetterGlitch
          glitchColors={["#1e40af", "#2563eb", "#60a5fa"]}
          glitchSpeed={135}
          smooth={true}
          outerVignette={true}
          centerVignette={false}
        />
      </div>

      {/* Dark Ambient SOC Gradient Layer for Readability (rgba(2,6,23,0.60) equivalent) */}
      <div className="absolute inset-0 z-10 bg-[#020617]/63 pointer-events-none" />

      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[650px] h-[650px] bg-blue-900/10 rounded-full blur-[140px] pointer-events-none z-10" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-indigo-950/15 rounded-full blur-[120px] pointer-events-none z-10" />

      {/* Main Unified Glass Panel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="w-full max-w-[580px] min-h-[695px] rounded-[14px] border border-blue-900/30 bg-[#081220]/78 backdrop-blur-xl shadow-[0_0_80px_rgba(30,64,175,0.08)] p-8 sm:p-14 flex flex-col items-center justify-center relative z-20 overflow-hidden"
      >

        {/* Official KSP Emblem - Responsive Width */}
        <div className="flex justify-center mb-10">
          <img
            src={kspLogo}
            alt="Karnataka State Police Emblem"
            className="w-[115px] md:w-[120px] h-auto object-contain max-h-[135px]"
          />
        </div>

        {/* Platform Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wider text-center text-white font-sans uppercase mb-6 leading-none">
          KARNATAKA STATE POLICE
        </h1>

        {/* Subtitle (Inter/font-sans) */}
        <h2 className="text-base sm:text-lg font-bold tracking-widest text-center text-blue-400 font-sans uppercase mb-5 leading-none">
          AI CRIME INTELLIGENCE PLATFORM
        </h2>

        {/* Tagline (Inter/font-sans) */}
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-center text-slate-400 mb-0 leading-none">
          Secure Command & Control Portal
        </p>

        {/* Spacing spacer block to force noticeable vertical spacing in flex container */}
        <div className="h-14 sm:h-16 pointer-events-none" />

        {/* Inner Authentication Card (Expanded & Spaced) */}
        <div className="w-full max-w-[450px] rounded-xl border border-white/[0.08] bg-[#050a12]/92 shadow-2xl p-8 sm:p-9 space-y-6">

          {/* Card Command Header */}
          <div className="flex flex-col space-y-1.5 border-b border-slate-800/80 pb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
              Identity Verification
            </h3>
            <p className="text-[11px] text-slate-400 font-sans">
              Select access role and enter authorized credentials
            </p>
          </div>

          {/* Tab Selection */}
          <div className="grid grid-cols-2 gap-2 p-1.5 rounded-lg bg-slate-950/90 border border-slate-800/80 font-sans text-xs">
            <button
              type="button"
              onClick={() => handleTabSwitch("admin")}
              className={`h-11 rounded-md flex items-center justify-center gap-2 font-bold uppercase transition-all duration-150 cursor-pointer ${
                activeTab === "admin"
                  ? "bg-[#2563eb] text-white shadow-md border border-[#60a5fa]/30"
                  : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#2563eb]/10 border border-transparent"
              }`}
            >
              <FaUserShield className="text-sm" />
              <span>Admin Login</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabSwitch("officer")}
              className={`h-11 rounded-md flex items-center justify-center gap-2 font-bold uppercase transition-all duration-150 cursor-pointer ${
                activeTab === "officer"
                  ? "bg-[#2563eb] text-white shadow-md border border-[#60a5fa]/30"
                  : "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-[#2563eb]/10 border border-transparent"
              }`}
            >
              <FaUserCheck className="text-sm" />
              <span>Officer Login</span>
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs font-sans flex items-start gap-2.5 animate-fade-in">
              <FaExclamationCircle className="text-sm flex-shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5 pt-1">
            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-300 tracking-wide font-sans">
                {activeTab === "admin" ? "Admin ID / Username" : "Officer Username"} <span className="text-blue-400">*</span>
              </label>
              <div className="relative">
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeTab === "admin" ? "admin" : "e.g. ksp.ramesh"}
                  required
                  className="w-full h-12 rounded-lg bg-slate-950/80 border border-blue-900/40 pr-4 text-xs text-white outline-none focus:border-[#60a5fa] focus:ring-1 focus:ring-[#60a5fa]/30 focus:bg-slate-950 transition-all placeholder-slate-500 shadow-inner font-mono font-medium"
                  style={{ paddingLeft: "3.25rem" }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[11px] font-semibold text-slate-300 tracking-wide font-sans">
                Security Password <span className="text-blue-400">*</span>
              </label>
              <div className="relative">
                <FaKey className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full h-12 rounded-lg bg-slate-950/80 border border-blue-900/40 pr-4 text-xs text-white outline-none focus:border-[#60a5fa] focus:ring-1 focus:ring-[#60a5fa]/30 focus:bg-slate-950 transition-all placeholder-slate-500 shadow-inner font-mono font-medium"
                  style={{ paddingLeft: "3.25rem" }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-lg font-bold uppercase tracking-wider text-white text-xs transition-all duration-200 bg-[#2563eb] hover:bg-blue-600 active:scale-[0.98] border border-blue-500/40 shadow-[0_0_20px_rgba(37,99,235,0.25)] hover:shadow-[0_0_25px_rgba(37,99,235,0.35)] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isSubmitting ? "Authenticating..." : `Sign In as ${activeTab === "admin" ? "Administrator" : "Police Officer"}`}
            </button>
          </form>

          {/* Demo Helper / Credential Section */}
          <div className="rounded-lg border border-slate-800/80 bg-slate-950/80 p-4 text-[11px] space-y-2.5 font-mono shadow-inner">
            <div className="flex items-center justify-between text-slate-400 font-bold border-b border-slate-800/60 pb-2 tracking-wider uppercase text-[10px]">
              <span>Command Access Credentials</span>
              <span className="text-[#60a5fa] font-extrabold">PIN: 1122</span>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold text-blue-400 font-sans">🛡️ Admin Role:</span>
                <span><code className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">admin</code> / <code className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">admin</code></span>
              </div>
              <div className="flex justify-between items-center text-slate-300">
                <span className="font-semibold text-blue-400 font-sans">👮 Officer Role:</span>
                <span><code className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">ksp.ramesh</code> / <code className="text-white bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">Officer@123</code></span>
              </div>
            </div>
          </div>

          {/* Footer info */}
          <div className="text-center font-sans text-[10.5px] text-slate-500 pt-2 border-t border-slate-800/50">
            Karnataka State Police CCTNS Portal • Encrypted Gateway v4.2
          </div>

        </div>

      </motion.div>
    </div>
  );
};

export default Login;
