import React, { useState, useEffect } from "react";
import {
  FaMicrochip,
  FaFingerprint,
  FaCheckCircle,
  FaTimes,
  FaSyncAlt,
  FaTv,
  FaWifi,
  FaInfoCircle
} from "react-icons/fa";
import { hardwareService } from "../../services/hardwareService";

const HardwareStatusIndicator = () => {
  const [status, setStatus] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await hardwareService.getDeviceStatus();
      if (data && data.success) {
        setStatus(data);
      }
    } catch (err) {
      console.warn("Failed fetching ESP32 hardware status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 15000);
    return () => clearInterval(interval);
  }, []);

  const isConnected = Boolean(status?.isConnected ?? status?.isOnline);

  const handleToggleConnection = async (state) => {
    try {
      await hardwareService.toggleConnection(state);
      await fetchStatus();
    } catch (err) {
      console.warn("Failed toggling connection:", err);
    }
  };

  return (
    <>
      {/* Navbar Pill */}
      <button
        onClick={() => {
          fetchStatus();
          setIsOpen(true);
        }}
        className={`hidden sm:flex items-center gap-2 h-10 px-3 rounded-xl border transition-all duration-200 shadow-sm active:scale-95 cursor-pointer font-mono text-xs ${
          isConnected
            ? "border-slate-700/80 bg-slate-900/90 hover:bg-slate-800/90 hover:border-cyan-500/50 text-slate-200"
            : "border-rose-800/60 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300"
        }`}
        title={isConnected ? "Biometric device connected" : "Biometric device not connected"}
      >
        <div className="relative flex items-center justify-center">
          {isConnected ? (
            <>
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping absolute" />
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
            </>
          ) : (
            <span className="h-2 w-2 rounded-full bg-rose-500" />
          )}
        </div>
        <FaMicrochip className={`text-xs ${isConnected ? "text-cyan-400" : "text-rose-400"}`} />
        <span className="text-[11px] font-bold">
          {isConnected ? "ESP32 ONLINE" : "Biometric device not connected"}
        </span>
      </button>

      {/* Hardware Status Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in font-inter">
          <div
            className="w-full max-w-lg rounded-2xl border border-slate-700/90 bg-[#09111e] shadow-[0_0_60px_-15px_rgba(6,182,212,0.3)] relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Accent Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500" />

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/70">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <FaMicrochip className="text-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-space tracking-wide uppercase">
                    ESP32 Hardware Module Status
                  </h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    ID: {status?.device?.deviceId || "ESP32-OLED-BIO-01"} • v2.4 Firmware
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={fetchStatus}
                  disabled={loading}
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Refresh Hardware Ping"
                >
                  <FaSyncAlt className={`text-xs ${loading ? "animate-spin text-cyan-400" : ""}`} />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Close"
                >
                  <FaTimes className="text-sm" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Component Health Cards */}
              <div className="grid grid-cols-3 gap-3">
                {/* ESP32 Controller */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 text-center">
                  <div className="flex justify-center text-cyan-400 mb-1.5">
                    <FaWifi className="text-base" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Controller</div>
                  <div className="text-xs font-bold text-white font-mono mt-0.5">ESP-WROOM-32</div>
                  <span className="inline-block mt-1 text-[9px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                    ONLINE
                  </span>
                </div>

                {/* OLED Display */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 text-center">
                  <div className="flex justify-center text-blue-400 mb-1.5">
                    <FaTv className="text-base" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Screen</div>
                  <div className="text-xs font-bold text-white font-mono mt-0.5">SSD1306 128x64</div>
                  <span className="inline-block mt-1 text-[9px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                    I2C 0x3C
                  </span>
                </div>

                {/* Fingerprint Sensor */}
                <div className="p-3 rounded-xl border border-slate-800 bg-slate-900/70 text-center">
                  <div className="flex justify-center text-emerald-400 mb-1.5">
                    <FaFingerprint className="text-base" />
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 uppercase">Sensor</div>
                  <div className="text-xs font-bold text-white font-mono mt-0.5">R307 Optical</div>
                  <span className="inline-block mt-1 text-[9px] font-bold text-emerald-400 font-mono bg-emerald-500/10 px-2 py-0.5 rounded">
                    UART 57600
                  </span>
                </div>
              </div>

              {/* Physical OLED Live Display Preview Buffer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <FaTv className="text-cyan-400" /> Live OLED Display Buffer (128x64)
                  </span>
                  <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                    Mirror Sync Active
                  </span>
                </div>

                {/* OLED Chassis */}
                <div className="rounded-xl border-4 border-slate-800 bg-[#020712] p-4 shadow-inner relative overflow-hidden">
                  <div className="absolute top-1 right-2 text-[8px] font-mono text-cyan-600/70 select-none">
                    SSD1306 128x64
                  </div>
                  <div className="font-mono text-xs leading-relaxed text-cyan-300 space-y-1 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] select-none">
                    <div className="text-center font-bold text-cyan-200 border-b border-cyan-900/60 pb-1 mb-1">
                      {status?.oled?.line1 || "--- MP POLICE CCTNS ---"}
                    </div>
                    <div className="text-center text-cyan-300">
                      {status?.oled?.line2 || "ESP32 2FA READY"}
                    </div>
                    <div className="text-center font-bold text-amber-300 text-sm tracking-wider">
                      {status?.oled?.line3 || "SCAN FINGERPRINT"}
                    </div>
                    <div className="text-center text-[10px] text-cyan-400/80">
                      {status?.oled?.line4 || "Waiting for Action..."}
                    </div>
                  </div>
                </div>
              </div>

              {/* Hardware Specifications & Wiring */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-2.5 text-xs font-mono text-slate-300">
                <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">Enrolled Fingerprint Slots:</span>
                  <span className="text-emerald-400 font-bold">
                    {status?.device?.enrolledOfficersCount || 3} Officers Enrolled
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">OLED I2C Pins:</span>
                  <span className="text-white font-bold">SDA = GPIO 21 • SCL = GPIO 22</span>
                </div>
                <div className="flex items-center justify-between text-[11px] border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400">R307 UART Pins:</span>
                  <span className="text-white font-bold">RX = GPIO 16 • TX = GPIO 17</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Audit Logging Table:</span>
                  <span className="text-cyan-400 font-bold">Zoho Catalyst BiometricAuditTrail</span>
                </div>
              </div>

              {/* Status Note */}
              <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-200">
                <FaInfoCircle className="text-blue-400 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  Every FIR creation, modification, deletion, and officer profile change requires physical biometric verification on the R307 sensor and OTP confirmation from the OLED display.
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  isConnected ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
                }`}>
                  {isConnected ? "Biometric device connected" : "Biometric device not connected"}
                </span>

                <button
                  type="button"
                  onClick={() => handleToggleConnection(!isConnected)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-mono text-[10px] uppercase font-bold border border-slate-700 cursor-pointer transition-colors"
                >
                  {isConnected ? "Simulate Disconnect" : "Simulate Connect"}
                </button>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
              >
                Close Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HardwareStatusIndicator;
