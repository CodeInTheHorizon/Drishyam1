import React, { useState, useEffect } from "react";
import {
  FaFingerprint,
  FaCheckCircle,
  FaMicrochip,
  FaExclamationTriangle,
  FaShieldAlt,
  FaBroadcastTower,
  FaSyncAlt,
  FaTimesCircle,
  FaPlug
} from "react-icons/fa";
import { hardwareService } from "../../services/hardwareService";

const BiometricEnrollmentWidget = ({ officerData, onEnrollmentComplete, isEnrolled, enrolledInfo }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [slotNumber, setSlotNumber] = useState(null);
  const [error, setError] = useState("");
  const [scanStep, setScanStep] = useState(1); // 1 = First Touch, 2 = Confirm Touch

  // Device connection state layer
  const [isConnected, setIsConnected] = useState(null); // null = checking, true/false
  const [isCheckingConn, setIsCheckingConn] = useState(false);

  const checkConnection = async () => {
    setIsCheckingConn(true);
    try {
      const connInfo = await hardwareService.checkDeviceConnection();
      setIsConnected(connInfo.connected);
      if (!connInfo.connected) {
        setError("Biometric device not connected. Connect the physical ESP32 scanner to capture fingerprint.");
      } else {
        setError((prev) => (prev && prev.includes("not connected") ? "" : prev));
      }
    } catch (err) {
      setIsConnected(false);
      setError("Biometric device not connected: " + err.message);
    } finally {
      setIsCheckingConn(false);
    }
  };

  const handleSimulateConnection = async (state) => {
    try {
      await hardwareService.toggleConnection(state);
      await checkConnection();
    } catch (err) {
      console.warn("Failed setting connection:", err);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleStartEnrollment = async () => {
    // Layer 1: Strict Hardware Connection Check
    if (!isConnected) {
      setError("Biometric device not connected. Please connect the ESP32 fingerprint scanner before taking input.");
      return;
    }

    setIsScanning(true);
    setError("");
    setScanStep(1);

    try {
      // Step 1: Tell ESP32 to enter enrollment mode
      const startResp = await hardwareService.startEnrollment({
        name: officerData?.name || "Officer",
        badgeNumber: officerData?.badgeNumber || "MPP-2026-901"
      });

      setSlotNumber(startResp.slot);

      // Simulate optical sensor scanning phase 1
      await new Promise((r) => setTimeout(r, 700));
      setScanStep(2);

      // Simulate confirmation scan phase 2
      await new Promise((r) => setTimeout(r, 800));

      // Step 2: Confirm enrollment with template hash
      const confirmResp = await hardwareService.confirmEnrollment({
        name: officerData?.name,
        badgeNumber: officerData?.badgeNumber,
        slot: startResp.slot
      });

      if (confirmResp.success) {
        onEnrollmentComplete({
          biometricTemplateId: confirmResp.biometricTemplateId,
          templateHash: confirmResp.templateHash,
          slot: confirmResp.slot,
          enrolledAt: confirmResp.enrolledAt,
          deviceId: "ESP32-OLED-BIO-01"
        });
      }
    } catch (err) {
      setError(err.message || "Failed to capture fingerprint template from ESP32.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="rounded-xl border border-slate-700/80 bg-slate-900/60 p-5 space-y-4 font-inter">
      {/* Widget Header & Hardware Connection Layer Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <FaMicrochip className="text-sm" />
          </div>
          <div>
            <h4 className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              ESP32 Biometric Fingerprint Scanner
            </h4>
            <p className="text-[11px] text-slate-400">
              R307 Optical Sensor Interface • Hardware Layer Check
            </p>
          </div>
        </div>

        {/* CONNECTION STATUS BADGE: "Biometric device not connected" vs "Biometric device connected" */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isConnected ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 flex items-center gap-1.5 font-bold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              Biometric device connected
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-mono bg-rose-500/15 text-rose-400 border border-rose-500/40 flex items-center gap-1.5 font-bold shadow-sm">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Biometric device not connected
            </span>
          )}

          <button
            type="button"
            onClick={checkConnection}
            disabled={isCheckingConn}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer text-xs"
            title="Check Hardware Link"
          >
            <FaSyncAlt className={isCheckingConn ? "animate-spin text-cyan-400" : ""} />
          </button>
        </div>
      </div>

      {/* DISCONNECTED WARNING ALERT */}
      {!isConnected && (
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fade-in shadow-inner">
          <div className="flex items-center gap-2.5">
            <FaTimesCircle className="text-rose-400 text-base flex-shrink-0" />
            <div>
              <span className="font-bold font-mono uppercase tracking-wide">
                Biometric device not connected
              </span>
              <p className="text-[11px] text-rose-400/90 font-sans mt-0.5">
                The optical fingerprint scanner is not detected. Connect the ESP32 via USB/UART or activate the bridge before taking biometric input.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              type="button"
              onClick={() => handleSimulateConnection(true)}
              className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-md cursor-pointer"
            >
              <FaPlug /> Connect Device
            </button>
          </div>
        </div>
      )}

      {error && isConnected && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <FaExclamationTriangle className="text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ENROLLED SUCCESS STATE */}
      {isEnrolled ? (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <FaCheckCircle />
            </div>
            <div>
              <div className="text-xs font-bold text-white flex items-center gap-2">
                Biometric Template Enrolled & Bound
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  {enrolledInfo?.biometricTemplateId || "SLOT #04"}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                Saved on ESP32 Flash Memory • Ready for subsequent 2FA verification
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleStartEnrollment}
            disabled={!isConnected || isScanning}
            className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors flex items-center gap-1.5 ${
              isConnected
                ? "border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                : "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed"
            }`}
          >
            <FaSyncAlt className={isScanning ? "animate-spin" : ""} />
            Re-enroll
          </button>
        </div>
      ) : (
        /* SCAN / CAPTURE BIOMETRIC INPUT INTERFACE */
        <div className={`flex flex-col sm:flex-row items-center gap-5 p-4 rounded-xl border transition-all ${
          isConnected
            ? "bg-slate-950/60 border-slate-800"
            : "bg-slate-950/30 border-rose-900/40 opacity-80"
        }`}>
          {/* Fingerprint Touch Icon */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            <div className={`absolute inset-0 rounded-full blur-lg ${
              isConnected ? (isScanning ? "bg-cyan-500/30 animate-pulse" : "bg-cyan-500/10") : "bg-rose-500/10"
            }`} />
            <div className={`relative z-10 h-20 w-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center shadow-inner ${
              isConnected
                ? "border-cyan-400/60 bg-cyan-950/30 text-cyan-300"
                : "border-rose-700/60 bg-rose-950/20 text-rose-500"
            }`}>
              <FaFingerprint className={`text-3xl ${
                isConnected
                  ? (isScanning ? "animate-pulse text-emerald-400 scale-110" : "text-cyan-300")
                  : "text-rose-500/60"
              }`} />
              <span className="text-[9px] font-mono mt-0.5">
                {isConnected ? (isScanning ? (scanStep === 1 ? "SCAN 1/2" : "CONFIRM 2/2") : "READY") : "OFFLINE"}
              </span>
            </div>
          </div>

          {/* Action & Instructions */}
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <div>
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h5 className="text-xs font-bold text-white uppercase tracking-wider font-space">
                  Officer Biometric Registration
                </h5>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  isConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                }`}>
                  {isConnected ? "Device Connected" : "Biometric device not connected"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {isConnected
                  ? "Place officer's finger firmly on the ESP32 optical sensor scanner to register biometric template."
                  : "Biometric input is disabled because the hardware device is not connected. Connect the device to take fingerprint input."}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1 justify-center sm:justify-start">
              {/* PRIMARY ACTION BUTTON: Takes input ONLY when device is connected */}
              <button
                type="button"
                onClick={handleStartEnrollment}
                disabled={!isConnected || isScanning}
                className={`py-2.5 px-4 rounded-lg font-bold text-xs font-mono uppercase tracking-wider flex items-center gap-2 transition-all ${
                  isConnected
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-lg shadow-cyan-500/20 cursor-pointer active:scale-95"
                    : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed"
                }`}
                title={isConnected ? "Capture Fingerprint" : "Biometric device not connected"}
              >
                <FaFingerprint />
                {isConnected
                  ? (isScanning ? "Capturing from ESP32 Scanner..." : "Capture & Save Fingerprint")
                  : "Biometric device not connected"}
              </button>

              <span className="text-[11px] font-mono text-slate-500">
                Slot #{slotNumber || "Auto-assigned"}
              </span>

              {/* Dev/Demo Helper to test both states */}
              {!isConnected && (
                <button
                  type="button"
                  onClick={() => handleSimulateConnection(true)}
                  className="text-[11px] font-mono text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <FaPlug className="text-[10px]" />
                  <span>Connect Device Now</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BiometricEnrollmentWidget;
