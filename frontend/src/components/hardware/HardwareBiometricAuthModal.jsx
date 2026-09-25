import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes,
  FaFingerprint,
  FaShieldAlt,
  FaMicrochip,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
  FaKey,
  FaClock,
  FaBroadcastTower,
  FaWifi
} from "react-icons/fa";
import { hardwareService } from "../../services/hardwareService";
import { useAuth } from "../../context/AuthContext";

const HardwareBiometricAuthModal = ({
  isOpen,
  onClose,
  onSuccess,
  actionTitle = "Manage Record Action",
  actionType = "MANAGE_RECORD",
  targetRecordId = "RECORD",
  changesSummary = ""
}) => {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Flow step: "STEP_1_BIOMETRIC" | "STEP_2_OTP" | "SUCCESS"
  const [step, setStep] = useState("STEP_1_BIOMETRIC");
  const [sessionId, setSessionId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [biometricVerifiedAt, setBiometricVerifiedAt] = useState(null);
  const [error, setError] = useState("");
  const [isDeviceConnected, setIsDeviceConnected] = useState(null);
  const [isCheckingConn, setIsCheckingConn] = useState(false);

  // OTP inputs (6 digits)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [secondsRemaining, setSecondsRemaining] = useState(90);
  const [liveOled, setLiveOled] = useState({
    header: "MP POLICE • ABHEDYA",
    line1: "SYSTEM SECURE",
    line2: "ESP32 + OLED + BIO",
    line3: "READY FOR 2FA AUTH"
  });

  const otpInputRefs = useRef([]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const checkConnection = async () => {
    setIsCheckingConn(true);
    try {
      const conn = await hardwareService.checkDeviceConnection();
      setIsDeviceConnected(conn.connected);
      if (!conn.connected) {
        setError("Biometric device not connected. Connect the ESP32 fingerprint scanner to proceed.");
      } else {
        setError(prev => (prev && prev.includes("not connected") ? "" : prev));
      }
    } catch {
      setIsDeviceConnected(false);
      setError("Biometric device not connected.");
    } finally {
      setIsCheckingConn(false);
    }
  };

  const handleSimulateConnection = async (state = true) => {
    await hardwareService.toggleConnection(state);
    await checkConnection();
  };

  // Initialize Hardware Session whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("STEP_1_BIOMETRIC");
      setError("");
      setOtpDigits(["", "", "", "", "", ""]);
      setBiometricVerifiedAt(null);
      setSecondsRemaining(90);

      checkConnection();

      const initAuth = async () => {
        try {
          const resp = await hardwareService.requestAuth({
            action: actionType,
            targetRecordId: targetRecordId,
            officerName: currentUser?.name || "Command Officer",
            kgid: currentUser?.kgid || currentUser?.badge || "MPP-2026-901",
            employeeId: currentUser?.ROWID || currentUser?.id || 101
          });
          if (resp && resp.sessionId) {
            setSessionId(resp.sessionId);
            if (resp.oled) setLiveOled(resp.oled);
          }
        } catch (err) {
          setError(err.message || "Failed to initialize ESP32 hardware bridge.");
        }
      };

      initAuth();
    }
  }, [isOpen, actionType, targetRecordId, currentUser]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer = null;
    if (step === "STEP_2_OTP" && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setError("2FA OTP expired on ESP32 screen. Please scan fingerprint again.");
            setStep("STEP_1_BIOMETRIC");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [step, secondsRemaining]);

  if (!isOpen || !mounted) return null;

  // Handle Biometric Fingerprint Scan Trigger
  const handleScanFingerprint = async () => {
    if (!isDeviceConnected) {
      setError("Biometric device not connected. Connect the physical ESP32 scanner before taking input.");
      return;
    }
    if (!sessionId) return;
    setIsScanning(true);
    setError("");

    try {
      // Simulate real-time optical scan delay
      await new Promise((r) => setTimeout(r, 650));

      const scanResult = await hardwareService.scanBiometric(sessionId, {
        officerName: currentUser?.name || "Active Officer",
        kgid: currentUser?.kgid || currentUser?.badge || "MPP-2026-901"
      });

      if (scanResult.success) {
        setBiometricVerifiedAt(new Date().toLocaleTimeString("en-IN"));
        setStep("STEP_2_OTP");
        setSecondsRemaining(90);
        if (scanResult.oled) setLiveOled(scanResult.oled);

        // Auto-focus first OTP digit
        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 150);
      }
    } catch (err) {
      setError(err.message || "Biometric fingerprint authentication failed.");
    } finally {
      setIsScanning(false);
    }
  };

  // Handle OTP digit entry
  const handleDigitChange = (index, value) => {
    const clean = value.replace(/\D/g, "").slice(-1);
    const updated = [...otpDigits];
    updated[index] = clean;
    setOtpDigits(updated);
    if (error) setError("");

    if (clean && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleDigitKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
    if (e.key === "Enter") {
      handleVerifyOtpSubmit(e);
    }
  };

  const handlePasteOtp = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    const updated = [...otpDigits];
    for (let i = 0; i < pasted.length; i++) {
      updated[i] = pasted[i];
    }
    setOtpDigits(updated);
    const nextIdx = Math.min(pasted.length, 5);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // Submit OTP Verification
  const handleVerifyOtpSubmit = async (e) => {
    e?.preventDefault();
    setError("");

    const fullOtp = otpDigits.join("");
    if (fullOtp.length < 6) {
      setError("Please enter the complete 6-digit OTP from the ESP32 OLED display.");
      return;
    }

    setIsVerifyingOtp(true);
    try {
      const verifyResp = await hardwareService.verifyOtp({
        sessionId,
        otp: fullOtp,
        action: actionType,
        targetRecordId,
        officerName: currentUser?.name || "Active Officer",
        kgid: currentUser?.kgid || currentUser?.badge || "MPP-2026-901",
        employeeId: currentUser?.ROWID || currentUser?.id || 101,
        changesSummary: changesSummary || `${actionType} verified via ESP32 Hardware 2FA on ${targetRecordId}`
      });

      if (verifyResp.success) {
        setStep("SUCCESS");
        setLiveOled({
          header: "ACCESS GRANTED",
          line1: "2FA VERIFIED OK",
          line2: `ACT: ${actionType.slice(0, 16)}`,
          line3: "AUDIT LOGGED IN DB"
        });

        // Small delay to show success celebration before executing operation
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1100);
      }
    } catch (err) {
      setError(err.message || "2FA OTP verification failed.");
      setOtpDigits(["", "", "", "", "", ""]);
      otpInputRefs.current[0]?.focus();
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in font-jakarta">
      {/* Backdrop click outside */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Modal Dialog Card */}
      <div 
        className="w-full max-w-2xl mx-auto rounded-2xl border border-cyan-500/40 bg-[#070e1b] shadow-[0_0_60px_-15px_rgba(6,182,212,0.35)] relative overflow-hidden text-slate-100 animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-600 via-cyan-400 to-indigo-600" />

        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner flex-shrink-0">
              <FaMicrochip className="text-lg animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-space text-white tracking-wide uppercase">
                  Hardware 2-Factor Authentication
                </h3>
                {isDeviceConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    Biometric device connected
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Biometric device not connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Action: <span className="text-cyan-400 font-semibold">{actionTitle}</span> • Mandatory Biometric & OTP Verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Cancel"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Modal Body: Split into Visual ESP32 OLED Display + Verification Controls */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left Column: Visual ESP32 Physical OLED Terminal (128x64 retro cyan pixel display) */}
          <div className="md:col-span-6 flex flex-col justify-between rounded-xl p-4 bg-[#030712] border border-slate-800 relative shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FaBroadcastTower className="text-cyan-400 text-xs" />
                  ESP32 OLED DISPLAY • 0.96" I2C
                </span>
                <span className="text-[10px] font-mono text-cyan-500/80">128x64 • 115200 BAUD</span>
              </div>

              {/* Physical Monochromatic Cyan OLED Frame */}
              <div className="w-full rounded-lg bg-[#001018] border-2 border-cyan-500/40 p-3 relative overflow-hidden shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]">
                {/* OLED CRT Scanlines effect */}
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:3px_3px]" />
                
                {/* Header Bar on OLED */}
                <div className="bg-cyan-500 text-slate-950 font-mono text-[11px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center justify-between mb-2">
                  <span>{liveOled.header}</span>
                  <span className="text-[9px]">2FA</span>
                </div>

                {/* OLED Text Content */}
                <div className="font-mono text-cyan-300 text-xs space-y-1.5 select-none leading-relaxed tracking-wide min-h-[72px]">
                  <div className="text-[11px] font-semibold text-cyan-200 truncate">
                    &gt; {liveOled.line1}
                  </div>
                  <div className="text-sm font-black text-cyan-400 tracking-wider">
                    {liveOled.line2}
                  </div>
                  <div className="text-[10px] text-cyan-300/80 uppercase">
                    {liveOled.line3}
                  </div>
                </div>

                {/* Bottom status strip */}
                <div className="mt-2 pt-1 border-t border-cyan-900/60 flex items-center justify-between text-[9px] font-mono text-cyan-400/70">
                  <span>DEV: ESP32-BIO-01</span>
                  <span>IP: 192.168.1.150</span>
                </div>
              </div>
            </div>

            {/* Officer Details & Device Hardware Specs */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-sans text-slate-300 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Authorized Personnel:</span>
                <span className="font-semibold text-white">{currentUser?.name || "Active Officer"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Badge / KGID:</span>
                <span className="font-mono text-cyan-400">{currentUser?.kgid || currentUser?.badge || "MPP-2026-901"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Sensor Interface:</span>
                <span className="font-mono text-emerald-400">R307 Optical Biometrics</span>
              </div>
            </div>
          </div>

          {/* Right Column: 2-Step Interactive Verification Flow */}
          <div className="md:col-span-6 flex flex-col justify-between">
            
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-4 text-xs font-mono">
              <div className={`flex-1 py-1.5 px-3 rounded-lg border flex items-center gap-1.5 font-bold transition-all ${
                step === "STEP_1_BIOMETRIC" 
                  ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                  : "bg-slate-900 border-emerald-500/50 text-emerald-400"
              }`}>
                <FaFingerprint className="text-xs" />
                <span>1. Biometric</span>
                {step !== "STEP_1_BIOMETRIC" && <FaCheckCircle className="ml-auto text-emerald-400 text-xs" />}
              </div>

              <div className={`flex-1 py-1.5 px-3 rounded-lg border flex items-center gap-1.5 font-bold transition-all ${
                step === "STEP_2_OTP" 
                  ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]" 
                  : step === "SUCCESS"
                  ? "bg-slate-900 border-emerald-500/50 text-emerald-400"
                  : "bg-slate-900 border-slate-800 text-slate-500"
              }`}>
                <FaKey className="text-xs" />
                <span>2. OLED OTP</span>
                {step === "SUCCESS" && <FaCheckCircle className="ml-auto text-emerald-400 text-xs" />}
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-shake">
                <FaExclamationTriangle className="flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Biometric Fingerprint Scan Mode */}
            {step === "STEP_1_BIOMETRIC" && (
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-2">
                {!isDeviceConnected && (
                  <div className="w-full p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs text-left flex items-start gap-2.5 shadow-sm">
                    <FaExclamationTriangle className="text-rose-400 text-sm flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold font-mono uppercase tracking-wider">Biometric device not connected</div>
                      <div className="text-[11px] text-rose-400">
                        The physical ESP32 optical fingerprint sensor is not detected. Connect the hardware device before performing biometric authentication.
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSimulateConnection(true)}
                        className="mt-1 px-3 py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition-all"
                      >
                        Connect Hardware Device
                      </button>
                    </div>
                  </div>
                )}

                <div className="relative flex items-center justify-center">
                  {/* Pulsating Sensor Glow */}
                  <div className={`absolute inset-0 rounded-full blur-xl ${
                    isDeviceConnected ? "bg-cyan-500/20 animate-pulse" : "bg-rose-500/10"
                  }`} />
                  
                  {/* Fingerprint Touch Target */}
                  <button
                    type="button"
                    onClick={handleScanFingerprint}
                    disabled={!isDeviceConnected || isScanning}
                    className={`relative z-10 h-24 w-24 rounded-full border-2 border-dashed flex flex-col items-center justify-center transition-all shadow-lg ${
                      isDeviceConnected
                        ? "border-cyan-400 bg-cyan-950/40 hover:bg-cyan-900/60 active:scale-95 text-cyan-300 cursor-pointer hover:shadow-cyan-500/30 group"
                        : "border-rose-800/60 bg-rose-950/20 text-rose-500/60 cursor-not-allowed"
                    }`}
                  >
                    <FaFingerprint className={`text-4xl transition-transform ${
                      isDeviceConnected
                        ? (isScanning ? "animate-pulse scale-110 text-emerald-400" : "group-hover:scale-105")
                        : "text-rose-500/60"
                    }`} />
                    <span className="text-[9px] font-mono font-bold mt-1">
                      {isDeviceConnected
                        ? (isScanning ? "SCANNING..." : "SCAN SENSOR")
                        : "DISCONNECTED"}
                    </span>
                  </button>
                </div>

                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {isDeviceConnected
                      ? "Place Authorized Finger on ESP32 Scanner"
                      : "Biometric Device Offline"}
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto">
                    {isDeviceConnected
                      ? "Optical sensor will verify fingerprint template against registered personnel roster."
                      : "Biometric input is unavailable until the hardware scanner is connected."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleScanFingerprint}
                  disabled={!isDeviceConnected || isScanning}
                  className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                    isDeviceConnected
                      ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95"
                      : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                  }`}
                >
                  <FaFingerprint />
                  {isDeviceConnected
                    ? (isScanning ? "Verifying Fingerprint on Sensor..." : "Scan Fingerprint on ESP32 Sensor")
                    : "Biometric device not connected"}
                </button>
              </div>
            )}

            {/* STEP 2: OLED Screen 2FA OTP Entry Mode */}
            {step === "STEP_2_OTP" && (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-4 py-1">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between text-xs font-mono">
                  <span className="text-emerald-300 flex items-center gap-1.5 font-bold">
                    <FaCheckCircle /> Biometric Verified OK
                  </span>
                  <span className="text-slate-400 text-[11px]">{biometricVerifiedAt}</span>
                </div>

                <div className="text-center space-y-1">
                  <h4 className="text-sm font-bold text-white">Enter 6-Digit OLED Security OTP</h4>
                  <p className="text-xs text-slate-400">
                    Read the one-time passcode generated and displayed on the ESP32 OLED screen.
                  </p>
                </div>

                {/* 6 Digit OTP Inputs */}
                <div className="flex items-center justify-center gap-2 sm:gap-2.5" onPaste={handlePasteOtp}>
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpInputRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleDigitChange(idx, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                      className="h-12 w-10 sm:w-11 text-center font-mono font-bold text-xl rounded-xl border border-slate-700 bg-slate-900 text-cyan-300 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all shadow-inner"
                    />
                  ))}
                </div>

                {/* Expiry countdown */}
                <div className="flex items-center justify-between text-xs font-mono text-slate-400 px-1">
                  <span className="flex items-center gap-1">
                    <FaClock className="text-cyan-400" />
                    Expires in: <strong className={secondsRemaining < 20 ? "text-rose-400" : "text-cyan-400"}>{secondsRemaining}s</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => setStep("STEP_1_BIOMETRIC")}
                    className="text-cyan-400 hover:underline cursor-pointer"
                  >
                    Re-scan Fingerprint
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={isVerifyingOtp || otpDigits.join("").length < 6}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <FaShieldAlt />
                  {isVerifyingOtp ? "Authenticating 2FA OTP..." : "Verify OTP & Authorize Action"}
                </button>
              </form>
            )}

            {/* STEP 3: Verification Success */}
            {step === "SUCCESS" && (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-6 animate-fade-in">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 text-3xl shadow-[0_0_30px_rgba(16,185,129,0.4)]">
                  <FaCheckCircle className="animate-bounce" />
                </div>
                <h4 className="text-base font-bold text-white">2-Factor Authentication Successful!</h4>
                <p className="text-xs text-emerald-300 font-mono">
                  Biometric Match + OLED OTP Confirmed. Executing operation and writing audit trail to database...
                </p>
              </div>
            )}

            {/* Bottom hardware note */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1">
                <FaLock className="text-cyan-400" /> SECURE 2FA LOCK
              </span>
              <span className="text-slate-500">CCTNS HARDWARE PROTOCOL</span>
            </div>

          </div>

        </div>
      </div>
    </div>,
    document.body
  );
};

export default HardwareBiometricAuthModal;
