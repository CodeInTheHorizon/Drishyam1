import React, { useState, useEffect, useRef } from "react";
import {
  FaLock,
  FaShieldAlt,
  FaIdCard,
  FaCamera,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBroadcastTower,
  FaMicrochip,
  FaUserCheck,
  FaSyncAlt
} from "react-icons/fa";
import { hardwareService } from "../../services/hardwareService";

const DEFAULT_OFFICER_FALLBACK = [
  { cardUid: "04:A2:8F:1A", officerName: "Kartik Singhal", badgeNumber: "MPP-2026-5882", rank: "Police Inspector" },
  { cardUid: "93:1C:7E:2B", officerName: "Medhavi Agrawal", badgeNumber: "MPP-2026-8359", rank: "Sub-Inspector" },
  { cardUid: "F5:8D:34:6C", officerName: "Kshitij Soni", badgeNumber: "MPP-2026-3003", rank: "Cyber Crime Officer" },
  { cardUid: "B1:6A:90:5E", officerName: "Hitesh Sanghi", badgeNumber: "MPP-2026-9344", rank: "Assistant Sub-Inspector" }
];

const ManageRecordsLockScreen = ({ onUnlock }) => {
  const [officerCards, setOfficerCards] = useState(DEFAULT_OFFICER_FALLBACK);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [tappedCard, setTappedCard] = useState(null);
  const [cardUidInput, setCardUidInput] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState("");
  const [liveOled, setLiveOled] = useState({
    header: "MP POLICE • ABHEDYA",
    line1: "MANAGE RECORDS",
    line2: "[ LOCKED ]",
    line3: "TAP RFID TO UNLOCK >>"
  });

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Fetch live officer smart cards directly from backend / Catalyst database
  const fetchOfficerCards = async () => {
    setIsLoadingCards(true);
    try {
      const cards = await hardwareService.getRegisteredCards();
      if (cards && Array.isArray(cards) && cards.length > 0) {
        setOfficerCards(cards);
      }
    } catch (e) {
      console.warn("[ManageRecordsLockScreen] Failed to fetch live cards:", e);
    } finally {
      setIsLoadingCards(false);
    }
  };

  useEffect(() => {
    fetchOfficerCards();
  }, []);

  // Poll hardware status to detect physical ESP32 RC522 card taps over Wi-Fi
  useEffect(() => {
    let isMounted = true;
    let pollCount = 0;

    const pollInterval = setInterval(async () => {
      pollCount++;
      // Periodically refresh officer cards every ~10s in case new officers were added
      if (pollCount % 6 === 0) {
        fetchOfficerCards();
      }

      try {
        const res = await fetch("/api/hardware/status");
        if (res.ok) {
          const json = await res.json();
          const hw = json.data;
          if (hw && isMounted) {
            if (hw.oled) setLiveOled(hw.oled);
            if (hw.lastTappedCard && (!tappedCard || tappedCard.cardUid !== hw.lastTappedCard.cardUid)) {
              setTappedCard(hw.lastTappedCard);
              if (!cameraActive) startCamera();
            }
          }
        }
      } catch (e) {
        // Non-fatal
      }
    }, 1500);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      stopCamera();
    };
  }, [tappedCard, cameraActive]);

  const startCamera = async () => {
    setCameraError("");
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false
      });
      streamRef.current = stream;
      setCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    } catch (err) {
      setCameraError("Camera unavailable. Live optical camera feed is mandatory for 2FA section unlock.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraActive, tappedCard]);

  // Handle Card Tap (Physical or Simulated)
  const handleCardTap = async (card) => {
    setError("");
    try {
      const res = await hardwareService.rfidTap({
        cardUid: card.cardUid,
        officer: card
      });
      setTappedCard({
        cardUid: card.cardUid,
        officer: card
      });
      if (res?.oled) setLiveOled(res.oled);
      startCamera();
    } catch (err) {
      setError(err.message || "Failed to read RFID card.");
    }
  };

  // Center crop square image from video
  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return null;
    const vWidth = video.videoWidth || 640;
    const vHeight = video.videoHeight || 480;

    const minDim = Math.min(vWidth, vHeight);
    const cropSize = Math.floor(minDim * 0.85);
    const startX = Math.floor((vWidth - cropSize) / 2);
    const startY = Math.floor((vHeight - cropSize) / 2);

    const canvas = document.createElement("canvas");
    canvas.width = 480;
    canvas.height = 480;
    const ctx = canvas.getContext("2d");

    ctx.translate(480, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, startX, startY, cropSize, cropSize, 0, 0, 480, 480);

    return canvas.toDataURL("image/jpeg", 0.92);
  };

  // Execute 2FA Section Unlock
  const handleUnlockSection = async () => {
    if (!tappedCard) {
      setError("Please tap your physical RFID card on the reader first.");
      return;
    }

    let probeImage = captureFrame();
    if (!probeImage) {
      setError("Could not capture live camera frame. Please face the active camera.");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const unlockResult = await hardwareService.unlockManageRecords({
        cardUid: tappedCard.cardUid,
        image: probeImage,
        officerBadge: tappedCard.officer?.badgeNumber,
        officerName: tappedCard.officer?.officerName || tappedCard.officer?.name
      });

      if (unlockResult && unlockResult.success) {
        stopCamera();
        if (unlockResult.oled) setLiveOled(unlockResult.oled);
        // Notify parent to reveal Manage Records console
        onUnlock(unlockResult.officer);
      }
    } catch (err) {
      setError(err.message || "2FA Unlock failed: Face does not match registered RFID card holder.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 p-6 rounded-2xl bg-gradient-to-b from-[#091124] to-[#040814] border-2 border-red-500/40 shadow-[0_0_80px_-20px_rgba(239,68,68,0.3)] text-slate-100 font-jakarta relative overflow-hidden animate-fade-in">
      {/* Top Warning Banner */}
      <div className="flex items-center justify-between pb-4 border-b border-red-500/30 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-red-500/15 border border-red-500/40 flex items-center justify-center text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.4)] flex-shrink-0 animate-pulse">
            <FaLock className="text-xl" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                AIR-GAPPED SECTION LOCKED
              </span>
              <span className="text-xs font-mono text-slate-400">LEVEL 3 CLEARANCE</span>
            </div>
            <h2 className="text-xl font-black font-space text-white uppercase tracking-wider mt-0.5">
              CCTNS Manage Records & FIR Console Locked
            </h2>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
          <FaBroadcastTower className="text-cyan-400 animate-pulse" />
          <span>ESP32 RFID TERMINAL ACTIVE</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-6 bg-red-950/20 p-3 rounded-xl border border-red-900/40">
        <strong className="text-red-400 uppercase font-mono">SECURITY DIRECTIVE:</strong> Access to the live FIR register, accused dossiers, and case status is restricted by default. To unlock this console, you must complete <strong className="text-white">Dual-Factor Authentication: Tap Physical Police Smart Card (RFID) + Biometric Face Scan</strong>.
      </p>

      {/* Main 2-Step 2FA Unlock Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left Column: STEP 1 - Physical RFID Police Card */}
        <div className="md:col-span-6 flex flex-col justify-between p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <FaIdCard className="text-sm" />
                FACTOR 1: POLICE SMART CARD (RFID)
              </span>
              {tappedCard ? (
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-mono font-bold flex items-center gap-1">
                  <FaCheckCircle className="text-[10px]" /> CARD READ
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono font-bold animate-pulse">
                  AWAITING TAP
                </span>
              )}
            </div>

            {/* Tapped Card Status Display */}
            {tappedCard ? (
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border-2 border-cyan-400/60 shadow-[0_0_20px_rgba(6,182,212,0.2)] space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-cyan-300">Registered Card UID</span>
                  <span className="font-mono text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-cyan-800">
                    {tappedCard.cardUid}
                  </span>
                </div>
                <div className="text-sm font-bold text-white flex items-center gap-2.5">
                  {tappedCard.officer?.photoUrl ? (
                    <img
                      src={tappedCard.officer.photoUrl}
                      alt={tappedCard.officer.officerName || tappedCard.officer.name}
                      className="w-7 h-7 rounded-full object-cover border border-emerald-400 flex-shrink-0"
                    />
                  ) : (
                    <FaUserCheck className="text-emerald-400 text-base" />
                  )}
                  <span className="truncate">{tappedCard.officer?.officerName || tappedCard.officer?.name || "Verified Officer"}</span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400 flex items-center justify-between">
                  <span>KGID: {tappedCard.officer?.badgeNumber}</span>
                  <span className="text-slate-400 text-[10px]">{tappedCard.officer?.rank}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-dashed border-slate-700 text-center space-y-2 mb-4">
                <FaBroadcastTower className="text-2xl text-cyan-400 mx-auto animate-bounce" />
                <div className="text-xs font-bold text-white">Tap your Police RFID Card on RC522 Reader</div>
                <p className="text-[11px] text-slate-400">
                  Hold physical card to sensor, or select any registered police officer below:
                </p>
              </div>
            )}

            {/* Quick Police Badge Selection / Simulation for Live Demos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                  <span>Select / Simulate Physical RFID Card Tap:</span>
                  <span className="px-1.5 py-0.2 rounded bg-cyan-950/80 border border-cyan-800/60 text-[9px] text-cyan-300 font-bold">
                    {officerCards.length} Live Officers
                  </span>
                </span>
                <button
                  type="button"
                  onClick={fetchOfficerCards}
                  disabled={isLoadingCards}
                  title="Sync with live database"
                  className="text-cyan-400 hover:text-cyan-300 transition-colors px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-800 border border-slate-700 text-[10px] flex items-center gap-1 cursor-pointer font-mono"
                >
                  <FaSyncAlt className={`text-[9px] ${isLoadingCards ? "animate-spin" : ""}`} />
                  <span>SYNC DB</span>
                </button>
              </div>

              {isLoadingCards && officerCards.length === 0 ? (
                <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                  <FaSyncAlt className="animate-spin text-cyan-400" />
                  <span>Fetching live officers from database...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                  {officerCards.map((card) => (
                    <button
                      key={card.cardUid}
                      type="button"
                      onClick={() => handleCardTap(card)}
                      className={`p-2 rounded-lg border text-left text-xs transition-all cursor-pointer flex items-center gap-2.5 ${
                        tappedCard?.cardUid === card.cardUid
                          ? "bg-cyan-600/30 border-cyan-400 text-white shadow-md shadow-cyan-500/20"
                          : "bg-slate-800/80 border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800"
                      }`}
                    >
                      {card.photoUrl ? (
                        <img
                          src={card.photoUrl}
                          alt={card.officerName}
                          className="w-8 h-8 rounded-full object-cover border border-cyan-500/40 flex-shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-cyan-400 text-xs font-bold flex-shrink-0">
                          {card.officerName?.[0] || "P"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="font-bold truncate text-[11px] text-white">{card.officerName}</div>
                        <div className="text-[9px] font-mono text-cyan-400 flex items-center justify-between">
                          <span>{card.badgeNumber}</span>
                          <span className="text-[8px] text-slate-400 font-mono bg-slate-900 px-1 rounded border border-slate-800">
                            {card.cardUid}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-400 truncate">{card.rank}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Physical OLED Terminal Visualizer */}
          <div className="mt-4 pt-3 border-t border-slate-800">
            <div className="rounded-lg bg-[#001018] border border-cyan-500/40 p-2.5 font-mono text-cyan-300 text-[10px] shadow-inner">
              <div className="flex justify-between text-[9px] text-cyan-400/80 border-b border-cyan-900 pb-1 mb-1">
                <span>ESP32 OLED 128x64</span>
                <span>STATUS: {liveOled.status}</span>
              </div>
              <div className="font-bold text-white">&gt; {liveOled.header}</div>
              <div className="text-cyan-400">{liveOled.line1}</div>
              <div className="text-cyan-200">{liveOled.line2}</div>
              <div className="text-amber-300">{liveOled.line3}</div>
            </div>
          </div>
        </div>

        {/* Right Column: STEP 2 - Biometric Face Scan */}
        <div className="md:col-span-6 flex flex-col justify-between p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-inner">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <FaCamera className="text-sm" />
                FACTOR 2: BIOMETRIC FACE SCAN
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                PARAMETER MATCH
              </span>
            </div>

            {error && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <FaExclamationTriangle className="flex-shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Live Camera Viewfinder */}
            <div className="relative w-full aspect-square max-w-[220px] rounded-xl overflow-hidden bg-slate-950 border-2 border-cyan-500/40 shadow-inner mx-auto mb-3">
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
                  cameraActive ? "block" : "hidden"
                }`}
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center bg-slate-950 text-slate-400 text-xs space-y-1">
                  <FaCamera className="text-2xl text-slate-600 mb-1" />
                  <span>Camera will activate upon RFID tap</span>
                </div>
              )}

              {/* Biometric Face Target Reticle */}
              {cameraActive && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-32 h-44 border-2 border-cyan-400/60 rounded-[50%] animate-pulse" />
                </div>
              )}
            </div>

            <div className="text-center space-y-1 mb-4">
              <div className="text-xs font-bold text-white">
                {tappedCard
                  ? `Verify Face for Officer: ${tappedCard.officer?.officerName}`
                  : "Tap RFID Card to Activate Camera"}
              </div>
              <p className="text-[11px] text-slate-400">
                Face must match the card owner in the police database to unlock.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => handleUnlockSection()}
              disabled={!tappedCard || isVerifying}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-lg ${
                tappedCard && !isVerifying
                  ? "bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 hover:from-blue-500 hover:to-teal-400 text-white shadow-cyan-500/25 cursor-pointer active:scale-95"
                  : "bg-slate-800 text-slate-500 border border-slate-700/60 cursor-not-allowed"
              }`}
            >
              <FaShieldAlt />
              {isVerifying ? "Verifying Face Match & Unlocking..." : "Unlock Manage Records via 2FA"}
            </button>

            <div className="flex items-center justify-center gap-1.5 py-1 text-[10px] font-mono text-slate-400">
              <FaShieldAlt className="text-cyan-400 text-xs" />
              <span>Live Optical Camera Stream Mandatory • Static Photo Upload Disabled</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManageRecordsLockScreen;
