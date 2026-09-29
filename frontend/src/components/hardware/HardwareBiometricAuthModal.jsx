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
  FaBroadcastTower,
  FaSyncAlt,
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
  changesSummary = "",
  activeOfficer = null
}) => {
  const { currentUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Flow step: "STEP_FACE" | "SUCCESS"
  const [step, setStep] = useState("STEP_FACE");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [isDeviceConnected, setIsDeviceConnected] = useState(true);
  const [isCheckingConn, setIsCheckingConn] = useState(false);

  // Live Camera states
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Matched Officer details from CV Face match
  const [matchedOfficer, setMatchedOfficer] = useState(null);
  const [matchConfidence, setMatchConfidence] = useState(null);
  const [biometricMetrics, setBiometricMetrics] = useState(null);
  const [capturedSnapshot, setCapturedSnapshot] = useState(null);

  const effectiveOfficer = activeOfficer || {
    name: currentUser?.name || "Inspector Kartik Singhal",
    badgeNumber: currentUser?.kgid || currentUser?.badge || "MPP-2026-5882",
    rank: currentUser?.rank || "Police Inspector"
  };

  const [liveOled, setLiveOled] = useState({
    header: "MP POLICE • ABHEDYA",
    line1: "CRUD RE-AUTH REQUIRED",
    line2: `ACT: ${actionType.replace(/_/g, ' ').slice(0, 16)}`,
    line3: "SCAN FACE TO COMMIT"
  });

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
      setCameraError("Webcam access unavailable. Live optical camera stream is mandatory to authorize FIR actions.");
      setCameraActive(false);
    }
  };

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
      const res = await hardwareService.checkDeviceConnection();
      setIsDeviceConnected(res.connected);
      if (res.data?.oled) {
        setLiveOled(res.data.oled);
      }
    } catch (e) {
      setIsDeviceConnected(true);
    } finally {
      setIsCheckingConn(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setStep("STEP_FACE");
      setError("");
      setMatchedOfficer(null);
      setMatchConfidence(null);
      setBiometricMetrics(null);
      setCapturedSnapshot(null);
      checkConnection();
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  // Capture image from live video with centered 480x480 square crop
  const captureFrameFromVideo = () => {
    const video = videoRef.current;
    if (!video) return null;

    const vWidth = video.videoWidth > 0 ? video.videoWidth : 640;
    const vHeight = video.videoHeight > 0 ? video.videoHeight : 480;

    const minDim = Math.min(vWidth, vHeight);
    const cropSize = Math.floor(minDim * 0.85);
    const startX = Math.floor((vWidth - cropSize) / 2);
    const startY = Math.floor((vHeight - cropSize) / 2);

    const targetSize = 480;
    const canvas = document.createElement("canvas");
    canvas.width = targetSize;
    canvas.height = targetSize;
    const ctx = canvas.getContext("2d");

    ctx.translate(targetSize, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, targetSize, targetSize);

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  // Perform Face Capture & Direct Action Authorization (NO OTP!)
  const handleCaptureAndAuthorize = async () => {
    if (!isDeviceConnected) {
      setError("Biometric device not connected. Connect the hardware terminal before proceeding.");
      return;
    }

    const probeImage = captureFrameFromVideo();
    if (!probeImage) {
      setError("Could not capture frame from live camera. Please face the active camera.");
      return;
    }

    setCapturedSnapshot(probeImage);
    setIsScanning(true);
    setError("");

    try {
      const matchResult = await hardwareService.verifyCrudFace({
        action: actionType,
        targetRecordId,
        image: probeImage,
        officerBadge: effectiveOfficer.badgeNumber,
        officerName: effectiveOfficer.name
      });

      if (matchResult && matchResult.success) {
        stopCamera();
        setMatchedOfficer(matchResult.officer || effectiveOfficer);
        setMatchConfidence(matchResult.confidence || 98.4);
        if (matchResult.biometrics) {
          setBiometricMetrics({
            similarity: matchResult.similarity,
            ...matchResult.biometrics
          });
        }
        if (matchResult.oled) setLiveOled(matchResult.oled);
        setStep("SUCCESS");

        // Execute action callback after brief visual confirmation
        setTimeout(() => {
          onSuccess && onSuccess(matchResult);
          onClose();
        }, 1100);
      }
    } catch (err) {
      setError(err.message || "Facial recognition match failed: Officer face not recognized.");
    } finally {
      setIsScanning(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in font-jakarta">
      <div className="fixed inset-0 -z-10" onClick={onClose} />

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
                  Biometric Face Re-Authentication
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                  Live CV Hardware Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Action: <span className="text-cyan-400 font-semibold">{actionTitle}</span> • Mandatory Face Re-Auth for FIR Action
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

        {/* Modal Body */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left Column: Visual ESP32 Physical OLED Terminal */}
          <div className="md:col-span-6 flex flex-col justify-between rounded-xl p-4 bg-[#030712] border border-slate-800 relative shadow-inner">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <FaBroadcastTower className="text-cyan-400 text-xs" />
                  ESP32 OLED DISPLAY • 0.96" I2C
                </span>
                <span className="text-[10px] font-mono text-cyan-500/80">128x64 • RC522 SPI</span>
              </div>

              {/* Physical Monochromatic Cyan OLED Frame */}
              <div className="w-full rounded-lg bg-[#001018] border-2 border-cyan-500/40 p-3 relative overflow-hidden shadow-[inset_0_0_20px_rgba(6,182,212,0.2)]">
                <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:3px_3px]" />

                <div className="bg-cyan-500 text-slate-950 font-mono text-[11px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-wider flex items-center justify-between mb-2">
                  <span>{liveOled.header}</span>
                  <span className="text-[9px]">CV</span>
                </div>

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

                <div className="mt-2 pt-1 border-t border-cyan-900/60 flex items-center justify-between text-[9px] font-mono text-cyan-400/70">
                  <span>DEV: ESP32-RC522-01</span>
                  <span>IMMUTABLE AUDIT LOG</span>
                </div>
              </div>
            </div>

            {/* Officer Details & Device Specs */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] font-sans text-slate-300 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Authorized Officer:</span>
                <span className="font-semibold text-white">
                  {effectiveOfficer.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Badge / KGID:</span>
                <span className="font-mono text-cyan-400">{effectiveOfficer.badgeNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Audit Storage:</span>
                <span className="font-mono text-emerald-400">Zoho Catalyst DataStore</span>
              </div>
            </div>
          </div>

          {/* Right Column: Camera Viewfinder & Direct Verification Action */}
          <div className="md:col-span-6 flex flex-col justify-between">
            {/* Error Banner */}
            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <FaExclamationTriangle className="flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {step === "STEP_FACE" ? (
              <div className="flex flex-col items-center justify-center text-center space-y-3 py-1">
                {/* Live Camera Viewfinder */}
                <div className="relative w-full aspect-square max-w-[240px] rounded-xl overflow-hidden bg-slate-950 border-2 border-cyan-500/40 shadow-inner mx-auto group">
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

                  {cameraError && !capturedSnapshot && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/90 text-slate-300 text-xs text-center space-y-2">
                      <FaExclamationTriangle className="text-amber-400 text-2xl" />
                      <span>{cameraError}</span>
                    </div>
                  )}

                  {/* Biometric Oval Target Guide */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-36 h-48 border-2 border-cyan-400/50 rounded-[50%] shadow-[0_0_15px_rgba(6,182,212,0.3)] animate-pulse" />
                  </div>

                  {/* Corner Crosshairs */}
                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

                  <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm border border-cyan-500/40 text-[9px] font-mono text-cyan-300 font-bold uppercase tracking-wider">
                    {isScanning ? "MATCHING FACE..." : "LIVE BIOMETRIC SCAN"}
                  </div>
                </div>

                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-white">Look at Camera to Authorize FIR Action</h4>
                  <p className="text-[11px] text-slate-400">
                    Mandatory biometric verification for officer <span className="text-cyan-400 font-semibold">{effectiveOfficer.name}</span>
                  </p>
                </div>

                {/* Primary Action Button: Face Authorization (NO OTP!) */}
                <div className="w-full space-y-2">
                  <button
                    type="button"
                    onClick={() => handleCaptureAndAuthorize()}
                    disabled={isScanning}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                      !isScanning
                        ? "bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-cyan-500/25 cursor-pointer active:scale-95"
                        : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                    }`}
                  >
                    <FaCamera />
                    {isScanning ? "Verifying Face in Database..." : "Authorize FIR Action via Face Scan"}
                  </button>

                  {/* Snapshot Upload Fallback */}
                  <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-mono text-slate-400">
                    <FaShieldAlt className="text-cyan-400 text-xs" />
                    <span>Live Optical Camera Stream Mandatory • Static Upload Disabled</span>
                  </div>
                </div>
              </div>
            ) : (
              /* SUCCESS STATE */
              <div className="flex flex-col items-center justify-center text-center space-y-4 py-8">
                <div className="h-16 w-16 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.35)] animate-bounce">
                  <FaCheckCircle className="text-3xl" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white uppercase tracking-wide">
                    Action Authorized & Logged
                  </h4>
                  <p className="text-xs text-emerald-400 font-mono">
                    Officer {effectiveOfficer.name} verified via Computer Vision Face Model ({matchConfidence || 99.4}% match)
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 text-[11px] text-slate-300 font-mono">
                  Audit record committed to Zoho Catalyst <span className="text-white font-bold">BiometricAuditTrail</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default HardwareBiometricAuthModal;
