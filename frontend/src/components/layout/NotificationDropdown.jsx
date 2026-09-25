import React, { useState, useEffect, useRef } from "react";
import { IoNotificationsOutline, IoCheckmarkDoneOutline } from "react-icons/io5";
import {
  FaExclamationTriangle,
  FaEye,
  FaTimes,
  FaSkull,
  FaFireAlt,
  FaInfoCircle,
  FaBell,
  FaCheckCircle,
} from "react-icons/fa";
import { recordService } from "../../services/recordService";
import FIRDetailModal from "../records/FIRDetailModal";

const READ_KEYS_STORAGE = "ksp_read_notification_ids_v1";

const severityConfig = {
  CRITICAL: {
    label: "Critical",
    icon: FaSkull,
    pill: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    dot: "bg-rose-500",
    accent: "border-l-rose-500",
    iconColor: "text-rose-400",
  },
  HIGH: {
    label: "High",
    icon: FaFireAlt,
    pill: "bg-amber-500/15 text-amber-300 border-amber-500/30",
    dot: "bg-amber-500",
    accent: "border-l-amber-500",
    iconColor: "text-amber-400",
  },
  MEDIUM: {
    label: "Medium",
    icon: FaExclamationTriangle,
    pill: "bg-blue-500/10 text-blue-300 border-blue-500/20",
    dot: "bg-blue-500",
    accent: "border-l-blue-500",
    iconColor: "text-blue-400",
  },
  LOW: {
    label: "Low",
    icon: FaInfoCircle,
    pill: "bg-slate-600/20 text-slate-400 border-slate-600/30",
    dot: "bg-slate-500",
    accent: "border-l-slate-600",
    iconColor: "text-slate-400",
  },
};

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(READ_KEYS_STORAGE)) || [];
    } catch {
      return [];
    }
  });
  const [selectedFirModal, setSelectedFirModal] = useState(null);
  const dropdownRef = useRef(null);

  const loadNotifications = () => {
    const records = recordService.getRecords();
    const sorted = [...records].sort(
      (a, b) => new Date(b.regDate) - new Date(a.regDate)
    );
    const items = sorted.slice(0, 15).map((r) => ({
      id: r.id || r.crimeNo,
      crimeNo: r.crimeNo,
      title: r.crimeHead || "Cognizable Offence",
      location: r.unit || r.district,
      district: r.district,
      severity: r.severity || "MEDIUM",
      status: r.status || "Under Investigation",
      date: r.regDate || "Recent",
      description: r.briefFacts || "FIR logged into CCTNS Master Repository.",
      officer: r.allottedOfficerName || "Investigating Officer",
      record: r,
    }));
    setNotifications(items);
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = recordService.subscribe(loadNotifications);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !readIds.includes(n.id)).length;
  const hasUnread = unreadCount > 0;

  const markAsRead = (id) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      localStorage.setItem(READ_KEYS_STORAGE, JSON.stringify(next));
    }
  };

  const markAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadIds(allIds);
    localStorage.setItem(READ_KEYS_STORAGE, JSON.stringify(allIds));
  };

  const handleOpenNotice = (item) => {
    markAsRead(item.id);
    setSelectedFirModal(item.record);
    setIsOpen(false);
  };

  return (
    <div className="relative font-sans" ref={dropdownRef}>
      {/* Bell Icon Trigger */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className={`relative flex items-center justify-center h-10 w-10 sm:h-11 sm:w-11 rounded-xl border transition-all duration-200 cursor-pointer active:scale-95 shadow-sm ${
          isOpen
            ? "bg-blue-600/20 border-blue-500 text-blue-400 shadow-blue-500/20 shadow-md ring-2 ring-blue-500/20"
            : "bg-slate-900/90 border-slate-700/70 hover:border-blue-500/60 text-slate-200 hover:text-blue-400 hover:bg-slate-800/90 hover:shadow-blue-500/10"
        }`}
        title="FIR Alerts & Notifications"
      >
        <IoNotificationsOutline className="text-xl sm:text-2xl transition-transform duration-200 hover:scale-110" />
        {hasUnread && (
          <span className="absolute -top-1 -right-1 flex h-4.5 w-4.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-rose-600 text-white font-mono text-[9.5px] font-extrabold items-center justify-center border-2 border-slate-950 shadow-sm">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          </span>
        )}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          className="notification-dropdown-panel absolute right-0 top-full mt-3 z-50 flex flex-col"
          style={{
            width: "420px",
            background: "linear-gradient(180deg, #0a1628 0%, #060d1a 100%)",
            border: "1px solid rgba(51,65,85,0.5)",
            borderRadius: "16px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(37,99,235,0.06)",
            animation: "notifSlideDown 0.2s cubic-bezier(0.16,1,0.3,1) both",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              padding: "18px 20px 14px",
              borderBottom: "1px solid rgba(51,65,85,0.3)",
              background: "rgba(37,99,235,0.04)",
              borderRadius: "16px 16px 0 0",
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="flex items-center justify-center rounded-lg"
                  style={{
                    width: 34,
                    height: 34,
                    background: "rgba(239,68,68,0.12)",
                    border: "1px solid rgba(239,68,68,0.2)",
                  }}
                >
                  <FaBell className="text-rose-400 text-sm" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide font-space">
                    Notifications
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    CCTNS FIR Alert Feed
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {hasUnread && (
                  <button
                    onClick={markAllAsRead}
                    className="flex items-center gap-1.5 text-[11px] font-semibold font-mono text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2.5 py-1 rounded-md transition-all"
                  >
                    <IoCheckmarkDoneOutline className="text-sm" />
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-500 hover:text-white hover:bg-slate-800 p-1.5 rounded-lg transition-colors text-sm"
                >
                  <FaTimes />
                </button>
              </div>
            </div>

            {/* Unread count summary */}
            {hasUnread && (
              <div
                className="flex items-center gap-2 mt-3 px-3 py-1.5 rounded-md"
                style={{
                  background: "rgba(239,68,68,0.07)",
                  border: "1px solid rgba(239,68,68,0.15)",
                }}
              >
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse flex-shrink-0" />
                <span className="text-[11px] text-rose-300 font-mono font-semibold">
                  {unreadCount} unread alert{unreadCount !== 1 ? "s" : ""} require attention
                </span>
              </div>
            )}
          </div>

          {/* ── Notifications List ── */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: "420px",
              padding: "10px 12px",
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(51,65,85,0.4) transparent",
            }}
          >
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <FaCheckCircle className="text-3xl text-slate-700" />
                <p className="text-sm text-slate-500 font-mono text-center">
                  No active FIR alerts
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((n) => {
                  const isRead = readIds.includes(n.id);
                  const cfg = severityConfig[n.severity] || severityConfig.MEDIUM;
                  const IconComp = cfg.icon;

                  return (
                    <div
                      key={n.id}
                      onClick={() => handleOpenNotice(n)}
                      className={`group relative rounded-xl cursor-pointer transition-all duration-150 border-l-2 ${cfg.accent}`}
                      style={{
                        padding: "12px 14px",
                        background: isRead
                          ? "rgba(15,23,42,0.4)"
                          : "rgba(15,23,42,0.85)",
                        border: `1px solid ${isRead ? "rgba(51,65,85,0.2)" : "rgba(51,65,85,0.4)"}`,
                        borderLeftWidth: "3px",
                        opacity: isRead ? 0.65 : 1,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(37,99,235,0.07)";
                        e.currentTarget.style.borderColor = "rgba(37,99,235,0.35)";
                        e.currentTarget.style.opacity = "1";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = isRead
                          ? "rgba(15,23,42,0.4)"
                          : "rgba(15,23,42,0.85)";
                        e.currentTarget.style.borderColor = isRead
                          ? "rgba(51,65,85,0.2)"
                          : "rgba(51,65,85,0.4)";
                        e.currentTarget.style.opacity = isRead ? 0.65 : 1;
                      }}
                    >
                      <div className="flex items-start gap-3">
                        {/* Severity Icon */}
                        <div
                          className="flex-shrink-0 rounded-lg flex items-center justify-center mt-0.5"
                          style={{
                            width: 32,
                            height: 32,
                            background: "rgba(15,23,42,0.6)",
                            border: "1px solid rgba(51,65,85,0.3)",
                          }}
                        >
                          <IconComp className={`text-sm ${cfg.iconColor}`} />
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          {/* Top row: severity pill + date + unread dot */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-md uppercase tracking-wider border ${cfg.pill}`}
                              >
                                {cfg.label}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">
                                {n.date}
                              </span>
                            </div>
                            {!isRead && (
                              <span className={`h-2 w-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                            )}
                          </div>

                          {/* Title */}
                          <p className="text-[12.5px] font-semibold text-white leading-snug line-clamp-1 group-hover:text-blue-300 transition-colors">
                            {n.title}
                          </p>

                          {/* Location */}
                          <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1 font-mono">
                            📍 {n.location}
                          </p>

                          {/* Description */}
                          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed line-clamp-2">
                            {n.description}
                          </p>

                          {/* Footer row */}
                          <div
                            className="flex items-center justify-between mt-2 pt-2"
                            style={{ borderTop: "1px solid rgba(51,65,85,0.2)" }}
                          >
                            <span className="text-[10px] font-mono text-slate-500">
                              FIR #{n.crimeNo}
                            </span>
                            <span className="flex items-center gap-1 text-[10px] font-mono text-blue-400 group-hover:text-blue-300">
                              <FaEye className="text-[9px]" />
                              View Dossier
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer ── */}
          <div
            style={{
              padding: "12px 20px",
              borderTop: "1px solid rgba(51,65,85,0.3)",
              background: "rgba(6,13,26,0.5)",
              borderRadius: "0 0 16px 16px",
            }}
          >
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                Real-time Telemetry
              </span>
              <span className="text-[10px] font-mono text-slate-500">
                {notifications.length} alerts · {unreadCount} unread
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Slide-down keyframe injected inline */}
      <style>{`
        @keyframes notifSlideDown {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0)  scale(1); }
        }
      `}</style>

      {/* FIR Detail Modal */}
      {selectedFirModal && (
        <FIRDetailModal
          isOpen={!!selectedFirModal}
          onClose={() => setSelectedFirModal(null)}
          record={selectedFirModal}
        />
      )}
    </div>
  );
};

export default NotificationDropdown;
