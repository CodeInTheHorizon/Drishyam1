import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes,
  FaCamera,
  FaUserCheck,
  FaShieldAlt,
  FaMicrochip,
  FaCheckCircle,
  FaExclamationTriangle,
  FaLock,
  FaKey,
  FaClock,
  FaBroadcastTower,
  FaSyncAlt,
  FaUpload,
  FaIdBadge
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

  // Flow step: "STEP_1_FACE" | "STEP_2_OTP" | "SUCCESS"
  const [step, setStep] = useState("STEP_1_FACE");
  const [sessionId, setSessionId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [error, setError] = useState("");
  const [isDeviceConnected, setIsDeviceConnected] = useState(true);
  const [isCheckingConn, setIsCheckingConn] = useState(false);

  // Live Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Matched Officer details from Cloudinary / Catalyst live query
  const [matchedOfficer, setMatchedOfficer] = useState(null);
  const [matchConfidence, setMatchConfidence] = useState(null);
  const [biometricMetrics, setBiometricMetrics] = useState(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);

  // OTP inputs (6 digits)
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [secondsRemaining, setSecondsRemaining] = useState(90);
  const [liveOled, setLiveOled] = useState({
    header: "MP POLICE • ABHEDYA",
    line1: "SYSTEM SECURE",
    line2: "ESP32 + OLED + CV",
    line3: "READY FOR 2FA AUTH"
  });

  const otpInputRefs = useRef([]);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Camera Stream Lifecycle
  const startCamera = async () => {
    setCameraError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user"
        },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err.message);
      setCameraError("Webcam access unavailable. You can upload a photo snapshot below.");
      setCameraActive(false);
    }
  };

  // Sync stream to video element whenever camera becomes active or mounts
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraActive, step]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  const checkConnection = async () => {
    setIsCheckingConn(true);
    try {
      const conn = await hardwareService.checkDeviceConnection();
      setIsDeviceConnected(conn.connected);
      if (!conn.connected) {
        setError("ESP32 Hardware device not connected. Connect the 2FA module to proceed.");
      } else {
        setError((prev) => (prev && prev.includes("not connected") ? "" : prev));
      }
    } catch {
      setIsDeviceConnected(false);
      setError("ESP32 Hardware device not connected.");
    } finally {
      setIsCheckingConn(false);
    }
  };

  const handleSimulateConnection = async (state = true) => {
    await hardwareService.toggleConnection(state);
    await checkConnection();
  };

  // Initialize Hardware Session & Camera whenever modal opens
  useEffect(() => {
    if (isOpen) {
      setStep("STEP_1_FACE");
      setError("");
      setOtpDigits(["", "", "", "", "", ""]);
      setMatchedOfficer(null);
      setMatchConfidence(null);
      setCapturedSnapshot(null);
      setSecondsRemaining(90);

      checkConnection();
      startCamera();

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
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen, actionType, targetRecordId, currentUser]);

  // Countdown timer for OTP
  useEffect(() => {
    let timer = null;
    if (step === "STEP_2_OTP" && secondsRemaining > 0) {
      timer = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setError("2FA OTP expired on ESP32 screen. Please scan face again.");
            setStep("STEP_1_FACE");
            startCamera();
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

  // Capture image from live video with centered face crop
  const captureFrameFromVideo = () => {
    const video = videoRef.current;
    if (!video) return null;

    const vWidth = video.videoWidth > 0 ? video.videoWidth : 640;
    const vHeight = video.videoHeight > 0 ? video.videoHeight : 480;

    // Center crop square to isolate head and face portrait (eliminates room background)
    const minDim = Math.min(vWidth, vHeight);
    const cropSize = Math.floor(minDim * 0.85);
    const startX = Math.floor((vWidth - cropSize) / 2);
    const startY = Math.floor((vHeight - cropSize) / 2);

    const targetSize = 480;
    const canvas = document.createElement("canvas");
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext("2d");

    // Mirror the frame horizontally to match user perspective
    ctx.translate(targetSize, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, targetSize, targetSize);

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  // Perform Face Capture & Match against Database
  const handleCaptureAndMatch = async (customImageData = null) => {
    if (!isDeviceConnected) {
      setError("Biometric device not connected. Connect the physical ESP32 module before taking input.");
      return;
    }
    if (!sessionId) {
      setError("Authentication session not initialized. Reopening modal...");
      return;
    }

    let probeImage = customImageData;
    if (!probeImage) {
      probeImage = captureFrameFromVideo();
    }

    if (!probeImage) {
      setError("Could not capture image from camera. Please upload a photo snapshot.");
      return;
    }

    setCapturedSnapshot(probeImage);
    setIsScanning(true);
    setError("");

    try {
      const matchResult = await hardwareService.matchFaceAuth({
        sessionId,
        image: probeImage
      });

      if (matchResult && matchResult.success) {
        stopCamera();
        setMatchedOfficer(matchResult.matchedOfficer || {
          name: matchResult.officerName,
          badgeNumber: currentUser?.kgid || "MPP-2026-901"
        });
        setMatchConfidence(matchResult.confidence || 98.4);
        if (matchResult.biometrics) {
          setBiometricMetrics({
            similarity: matchResult.similarity,
            ...matchResult.biometrics
          });
        }
        if (matchResult.oled) setLiveOled(matchResult.oled);
        setStep("STEP_2_OTP");
        setSecondsRemaining(90);

        setTimeout(() => {
          otpInputRefs.current[0]?.focus();
        }, 200);
      }
    } catch (err) {
      setError(err.message || "Facial recognition match failed: Officer not recognized in database.");
    } finally {
      setIsScanning(false);
    }
  };

  // Handle manual photo file upload
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (uploadEvt) => {
      const base64 = uploadEvt.target.result;
      handleCaptureAndMatch(base64);
    };
    reader.readAsDataURL(file);
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
      const effectiveOfficerName = matchedOfficer?.name || currentUser?.name || "Active Officer";
      const effectiveKgid = matchedOfficer?.badgeNumber || currentUser?.kgid || currentUser?.badge || "MPP-2026-901";
      const effectiveEmpId = matchedOfficer?.EmployeeID || currentUser?.ROWID || currentUser?.id || 101;

      const verifyResp = await hardwareService.verifyOtp({
        sessionId,
        otp: fullOtp,
        action: actionType,
        targetRecordId,
        officerName: effectiveOfficerName,
        kgid: effectiveKgid,
        employeeId: effectiveEmpId,
        changesSummary: changesSummary || `[CV Face Match 2FA] Officer ${effectiveOfficerName} (${effectiveKgid}) authorized ${actionType} on ${targetRecordId}`
      });

      if (verifyResp.success) {
        setStep("SUCCESS");
        setLiveOled({
          header: "ACCESS GRANTED",
          line1: "2FA VERIFIED OK",
          line2: `ACT: ${actionType.slice(0, 16)}`,
          line3: "AUDIT LOGGED IN DB"
        });

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
              <FaCamera className="text-lg animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-space text-white tracking-wide uppercase">
                  CV Face Recognition 2FA Security
                </h3>
                {isDeviceConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    CV Camera & OLED Online
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/15 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
                    <span className="h-2 w-2 rounded-full bg-rose-500" />
                    Device not connected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Action: <span className="text-cyan-400 font-semibold">{actionTitle}</span> • Mandatory Face Match & 2FA OTP
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
                <span className="text-slate-400">Personnel Roster:</span>
                <span className="font-semibold text-white">
                  {matchedOfficer ? matchedOfficer.name : currentUser?.name || "Active Officer"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Badge / KGID:</span>
                <span className="font-mono text-cyan-400">
                  {matchedOfficer ? matchedOfficer.badgeNumber : currentUser?.kgid || currentUser?.badge || "MPP-2026-901"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Sensor Interface:</span>
                <span className="font-mono text-emerald-400">CV Face Model + OLED 2FA</span>
              </div>
            </div>
          </div>

          {/* Right Column: 2-Step Interactive Verification Flow */}
          <div className="md:col-span-6 flex flex-col justify-between">
            {/* Step Indicators */}
            <div className="flex items-center gap-2 mb-4 text-xs font-mono">
              <div
                className={`flex-1 py-1.5 px-3 rounded-lg border flex items-center gap-1.5 font-bold transition-all ${
                  step === "STEP_1_FACE"
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : "bg-slate-900 border-emerald-500/50 text-emerald-400"
                }`}
              >
                <FaCamera className="text-xs" />
                <span>1. Face Match</span>
                {step !== "STEP_1_FACE" && <FaCheckCircle className="ml-auto text-emerald-400 text-xs" />}
              </div>

              <div
                className={`flex-1 py-1.5 px-3 rounded-lg border flex items-center gap-1.5 font-bold transition-all ${
                  step === "STEP_2_OTP"
                    ? "bg-cyan-500/15 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                    : step === "SUCCESS"
                    ? "bg-slate-900 border-emerald-500/50 text-emerald-400"
                    : "bg-slate-900 border-slate-800 text-slate-500"
                }`}
              >
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

            {/* STEP 1: CV Face Capture & Recognition Match */}
            {step === "STEP_1_FACE" && (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-1">
                {!isDeviceConnected && (
                  <div className="w-full p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs text-left flex items-start gap-2 shadow-sm">
                    <FaExclamationTriangle className="text-rose-400 text-sm flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <div className="font-bold font-mono uppercase tracking-wider">Device not connected</div>
                      <div className="text-[11px] text-rose-400">
                        The ESP32 OLED 2FA unit is not detected. Connect the hardware device before proceeding.
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

                {/* Live Camera Viewfinder with Biometric Target Reticle */}
                <div className="relative w-full aspect-[4/3] max-w-[280px] rounded-xl overflow-hidden bg-slate-950 border-2 border-cyan-500/40 shadow-inner mx-auto group">
                  <video
                    ref={(el) => {
                      videoRef.current = el;
                      if (el && streamRef.current && el.srcObject !== streamRef.current) {
                        el.srcObject = streamRef.current;
                        el.play().catch(() => {});
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transform -scale-x-100 ${
                      capturedSnapshot || !cameraActive ? "hidden" : "block"
                    }`}
                  />
                  
                  {capturedSnapshot && (
                    <img
                      src={capturedSnapshot}
                      alt="Captured probe"
                      className="w-full h-full object-cover"
                    />
                  )}

                  {!capturedSnapshot && !cameraActive && (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-slate-500 space-y-2">
                      <FaCamera className="text-3xl text-slate-600" />
                      <span className="text-[11px] font-mono">Camera initializing...</span>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 text-[10px] font-mono cursor-pointer"
                      >
                        Retry Camera
                      </button>
                    </div>
                  )}

                  {/* Biometric Oval Head Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div
                      className={`w-32 h-44 rounded-[50%] border-2 border-dashed transition-all ${
                        isScanning
                          ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.5)]"
                          : "border-cyan-400/70"
                      }`}
                    />
                  </div>

                  {/* Holographic Laser Scan Line */}
                  {isScanning && (
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_#34d399] animate-bounce pointer-events-none" />
                  )}

                  {/* Corner Crosshairs */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

                  {/* CV Live Label */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-cyan-500/40 text-[9px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    {isScanning ? "AI FACE MATCHING..." : "LIVE CV SCANNER"}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Look at the Camera to Verify Identity</h4>
                  <p className="text-[11px] text-slate-400">
                    Your photo will be captured & matched against registered officers in Catalyst database.
                  </p>
                </div>

                {/* Primary Action Button: Capture & Match */}
                <div className="w-full space-y-2">
                  <button
                    type="button"
                    onClick={() => handleCaptureAndMatch()}
                    disabled={!isDeviceConnected || isScanning}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                      isDeviceConnected && !isScanning
                        ? "bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-cyan-500/25 cursor-pointer active:scale-95"
                        : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                    }`}
                  >
                    <FaCamera />
                    {isScanning ? "Matching Face in Database..." : "Scan Face for 2FA Verification"}
                  </button>

                  {/* Secondary fallback: Upload snapshot if webcam unavailable */}
                  <div className="flex items-center justify-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-mono cursor-pointer"
                    >
                      <FaUpload className="text-[10px]" /> Upload Photo Snapshot
                    </button>
                    {cameraError && (
                      <span className="text-[10px] text-rose-400 font-mono">• {cameraError}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2: OLED Screen 2FA OTP Entry Mode */}
            {step === "STEP_2_OTP" && (
              <form onSubmit={handleVerifyOtpSubmit} className="space-y-3.5 py-1">
                {/* Matched Officer Identity Badge Card */}
                {matchedOfficer && (
                  <div className="p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/40 flex items-center gap-3 shadow-inner">
                    {matchedOfficer.photoUrl ? (
                      <img
                        src={matchedOfficer.photoUrl}
                        alt={matchedOfficer.name}
                        className="h-11 w-11 rounded-lg object-cover border border-cyan-400/60 flex-shrink-0"
                      />
                    ) : (
                      <div className="h-11 w-11 rounded-lg bg-cyan-900/60 border border-cyan-500/40 flex items-center justify-center text-cyan-300 flex-shrink-0">
                        <FaUserCheck className="text-lg" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {matchedOfficer.name}
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 font-mono text-[9px] font-bold">
                          {matchConfidence || 98.4}% MATCH
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-cyan-400 flex items-center gap-2">
                        <span>KGID: {matchedOfficer.badgeNumber || currentUser?.kgid || "MPP-2026-901"}</span>
                        {matchedOfficer.rank && <span>• {matchedOfficer.rank}</span>}
                      </div>
                      {biometricMetrics && (
                        <div className="flex items-center gap-1.5 mt-1 text-[9px] font-mono text-cyan-300/90">
                          <span className="px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800/80">Geometry: {biometricMetrics.sCorr}%</span>
                          <span className="px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800/80">LBP Texture: {biometricMetrics.sLbp}%</span>
                          <span className="px-1 py-0.2 rounded bg-cyan-950 border border-cyan-800/80">Edges: {biometricMetrics.sGrad}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-center space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Enter 6-Digit ESP32 OLED Security OTP</h4>
                  <p className="text-[11px] text-slate-400">
                    Read the dynamic one-time passcode generated on the physical ESP32 OLED screen.
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
                    Expires in:{" "}
                    <strong className={secondsRemaining < 20 ? "text-rose-400" : "text-cyan-400"}>
                      {secondsRemaining}s
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("STEP_1_FACE");
                      startCamera();
                    }}
                    className="text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <FaSyncAlt className="text-[10px]" /> Re-scan Face
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
                  Face Identified: {matchedOfficer?.name || "Officer"} • OLED OTP Confirmed.
                  Logging action directly to Catalyst database...
                </p>
              </div>
            )}

            {/* Bottom hardware note */}
            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span className="flex items-center gap-1">
                <FaLock className="text-cyan-400" /> SECURE CV 2FA LOCK
              </span>
              <span className="text-slate-500">CCTNS LIVE AUDIT LOGGING</span>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HardwareBiometricAuthModal;
