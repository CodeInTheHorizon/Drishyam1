import React, { useState, useEffect } from "react";
import ConversationSidebar from "../../components/assistant/ConversationSidebar";
import SuggestedPrompts from "../../components/assistant/SuggestedPrompts";
import ChatWindow from "../../components/assistant/ChatWindow";
import ChatInput from "../../components/assistant/ChatInput";
import AIAlertsList from "../../components/dashboard/AIAlertsList";
import StatCard from "../../components/dashboard/StatCard";
import PredictiveForecastingCard from "../../components/dashboard/PredictiveForecastingCard";
import Loader from "../../components/common/Loader";
import { assistantService } from "../../services/assistantService";
import { fetchDashboardData } from "../../services/dashboardService";
import { RiBrainLine, RiRobot2Line, RiGlobalLine } from "react-icons/ri";
import { TbChartLine } from "react-icons/tb";
import { FaBrain, FaGavel, FaSearch, FaExclamationTriangle, FaHistory, FaRobot } from "react-icons/fa";

const InsightsForecast = () => {
  const [activeTab, setActiveTab] = useState("copilot");
  const [pageLang, setPageLang] = useState("en"); // 'en' or 'kn'

  // Chat state
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const isKn = pageLang === "kn";

  const TABS = [
    { id: "copilot", label: isKn ? "ಎಐ ಕಾಪಿಲಟ್ ಮತ್ತು ಹುಡುಕಾಟ" : "AI Copilot & Search", icon: RiRobot2Line, activeColor: "from-blue-600 to-violet-600" },
    { id: "forecast", label: isKn ? "ಪೂರ್ವಸೂಚಕ ಪ್ರವೃತ್ತಿ ಮತ್ತು ಮುನ್ಸೂಚನೆ" : "Predictive Trend Forecast", icon: TbChartLine, activeColor: "from-violet-600 to-purple-700" },
  ];

  useEffect(() => {
    const list = assistantService.getSessions();
    setSessions(list);
    if (list.length > 0) {
      setActiveSessionId(list[0].id);
      setMessages(assistantService.getSessionMessages(list[0].id));
    }
    fetchDashboardData().then((res) => {
      if (res?.data) setDashboardData(res.data);
      setLoadingData(false);
    });
  }, []);

  const handleSelectSession = (id) => {
    setActiveSessionId(id);
    setMessages(assistantService.getSessionMessages(id));
  };

  const handleNewSession = () => {
    const newId = `session-temp-${Date.now()}`;
    setSessions((prev) => [{ id: newId, title: isKn ? "ಹೊಸ ಸೇಶನ್" : "New Session", timestamp: isKn ? "ಈಗಷ್ಟೇ" : "Just now", status: "active" }, ...prev]);
    setActiveSessionId(newId);
    setMessages([]);
  };

  const handleSend = async (text) => {
    setMessages((prev) => [...prev, { sender: "officer", text }]);
    setIsTyping(true);
    try {
      const replyText = await assistantService.queryAssistant(text);
      setMessages((prev) => [...prev, { sender: "assistant", text: replyText }]);
    } catch {
      setMessages((prev) => [...prev, { sender: "assistant", text: isKn ? "ದೋಷ: ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲು ಸಾಧ್ಯವಾಗಿಲ್ಲ." : "Error: Failed to process request." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleClear = () => setMessages([]);

  return (
    <div 
      className="flex flex-col gap-6 font-sans pb-12" 
      style={{ minHeight: "calc(100vh - 160px)", display: "flex", flexDirection: "column", gap: "24px" }}
    >

      {/* ── Page Header Banner ── */}
      <div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-5 bg-slate-900/85 border border-slate-700/60 rounded-none backdrop-blur-md shadow-xl animate-fade-in-up"
        style={{ padding: "24px 28px" }}
      >
        <div className="pl-1">
          <div className="flex items-center gap-2 mb-1.5">
            <RiBrainLine className="text-purple-400 text-lg animate-pulse" />
            <span className="text-[10.5px] font-mono font-bold text-purple-400 uppercase tracking-widest">
              QuickML Engine v4.2 · Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-tight">
            {isKn ? "ಅಪರಾಧ ಮುನ್ಸೂಚನೆ ಮತ್ತು ವಿಶ್ಲೇಷಣೆ (AI Insights & Forecast)" : "AI Insights & Forecast"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1.5 max-w-2xl leading-relaxed">
            {isKn
              ? "ನೈಸರ್ಗಿಕ ಭಾಷೆಯ ಗುಪ್ತಚರ ಹುಡುಕಾಟ, ಅಪರಾಧ ಮುನ್ಸೂಚನೆ ಮತ್ತು ವೈಪರೀತ್ಯ ಪತ್ತೆ ಸಿಸ್ಟಮ್."
              : "Natural language intelligence search, predictive crime forecasting, and automated anomaly detection."}
          </p>
        </div>

        {/* Live indicator & Page Translation Switcher Toggle */}
        <div className="flex flex-wrap items-center gap-3 self-start md:self-auto pr-1">
          <div className="flex items-center gap-2 px-3 py-2 bg-transparent text-emerald-400 font-mono text-xs font-semibold">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>CCTNS Live Connected</span>
          </div>

          {/* Global Page Language Switcher Toggle */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-700/70 rounded-none p-1.5 shadow-md font-mono">
            <span className="text-xs text-purple-300 font-bold px-2.5 flex items-center gap-1.5">
              <RiGlobalLine className="text-sm text-purple-400" /> Lang:
            </span>
            <button
              type="button"
              onClick={() => setPageLang("en")}
              className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all cursor-pointer ${
                pageLang === "en" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setPageLang("kn")}
              className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all cursor-pointer ${
                pageLang === "kn" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              ಕನ್ನಡ
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex justify-center px-2">
        <div className="flex items-center gap-3 p-2 rounded-none bg-slate-900/85 border border-slate-700/60 shadow-lg">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-3 px-8 py-3.5 text-xs font-bold font-mono uppercase tracking-wider rounded-none transition-all duration-150 cursor-pointer ${
                  isActive ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                }`}
              >
                <Icon className="text-sm" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ TAB 1: AI COPILOT ══ */}
      {activeTab === "copilot" && (
        <div
          className="flex flex-1 rounded-none border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl overflow-hidden"
          style={{
            height: "calc(100vh - 310px)",
            minHeight: 520,
          }}
        >
          {/* Sidebar: Sessions */}
          {sidebarOpen && (
            <div
              className="flex-shrink-0 flex flex-col"
              style={{
                width: 240,
                borderRight: "1px solid rgba(51,65,85,0.5)",
                background: "rgba(10,18,30,0.85)",
              }}
            >
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(51,65,85,0.4)" }}>
                <div className="flex items-center gap-2.5 pl-2">
                  <FaHistory className="text-xs text-slate-400" />
                  <span className="text-[11px] font-bold font-mono text-slate-300 uppercase tracking-wider">
                    {isKn ? "ಸೇಶನ್‌ಗಳು" : "Sessions"}
                  </span>
                </div>
              </div>

              {/* Sidebar content */}
              <div className="flex-1 overflow-hidden">
                <ConversationSidebar
                  sessions={sessions}
                  activeSessionId={activeSessionId}
                  onSelectSession={handleSelectSession}
                  onNewSession={handleNewSession}
                />
              </div>
            </div>
          )}

          {/* Main Chat Area */}
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat top bar */}
            <div
              className="flex items-center justify-between px-7 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(51,65,85,0.25)" }}
            >
              <div className="flex items-center gap-3.5 pl-2">
                <button
                  onClick={() => setSidebarOpen((p) => !p)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors cursor-pointer"
                  title="Toggle session sidebar"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <rect x="1" y="2" width="12" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="1" y="6.25" width="12" height="1.5" rx="0.75" fill="currentColor" />
                    <rect x="1" y="10.5" width="12" height="1.5" rx="0.75" fill="currentColor" />
                  </svg>
                </button>
                <div className="flex items-center gap-2.5">
                  <div
                    className="flex items-center justify-center rounded-xl"
                    style={{ width: 32, height: 32, background: "linear-gradient(135deg,rgba(37,99,235,0.25),rgba(124,58,237,0.25))", border: "1px solid rgba(37,99,235,0.3)" }}
                  >
                    <FaRobot className="text-sm text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white font-space">KSP AI Copilot</p>
                    <p className="text-[10px] font-mono text-emerald-400">● Online · CCTNS Live</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <ChatWindow messages={messages} isTyping={isTyping} />

            {/* Suggested Prompts (shown only when empty) */}
            {messages.length === 0 && (
              <div className="px-6 pb-4 flex-shrink-0">
                <SuggestedPrompts onPromptClick={handleSend} />
              </div>
            )}

            {/* Chat Input */}
            <ChatInput onSend={handleSend} onClear={handleClear} disabled={isTyping} />
          </div>
        </div>
      )}

      {/* ══ TAB 2: PREDICTIVE FORECAST ══ */}
      {activeTab === "forecast" && (
        <div>
          {loadingData ? (
            <Loader message={isKn ? "ಕ್ವಿಕ್‌ಎಮ್‌ಎಲ್ ಮುನ್ಸೂಚಕ ಮಾದರಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ..." : "Loading QuickML Time-Series Predictive Models..."} />
          ) : (
            <div className="flex flex-col" style={{ gap: "2rem" }}>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title={isKn ? "ಅಂದಾಜು ಕಳ್ಳತನ ಹೆಚ್ಚಳ" : "Forecasted Theft Spike"}
                  value="+18.4%"
                  change={isKn ? "ಕ್ವಿಕ್‌ಎಮ್‌ಎಲ್ ಮಾದರಿ" : "QuickML Model"}
                  icon={FaBrain}
                  color="text-purple-400"
                  borderColor="border-purple-500"
                  dataSource="CaseMaster + UnitID 4108"
                  coverage={isKn ? "ಕೋರಮಂಗಲ ಪೊಲೀಸ್ ಠಾಣೆ" : "Koramangala Police Station"}
                  lastSync="QuickML Realtime"
                  subText={isKn ? "ಆಸ್ತಿ ಕಳ್ಳತನದ ಹೆಚ್ಚಳ" : "Property Theft Spike"}
                />
                <StatCard
                  title={isKn ? "ಅಂದಾಜು ಚಾರ್ಜ್ ಶೀಟ್ ದರ" : "Predicted Charge-sheet Rate"}
                  value="76.8%"
                  change={isKn ? "+2.6% ಪ್ರಕ್ಷೇಪಣ" : "+2.6% Projection"}
                  icon={FaGavel}
                  color="text-emerald-400"
                  borderColor="border-emerald-500"
                  dataSource="ChargesheetDetails ML"
                  coverage={isKn ? "ನ್ಯಾಯಾಂಗ ಮ್ಯಾಜಿಸ್ಟ್ರೇಟ್ ನ್ಯಾಯಾಲಯಗಳು" : "Judicial Magistrate Courts"}
                  lastSync="Daily Batch Run"
                  subText={isKn ? "ಅಂತಿಮ ವರದಿ ವಿಧ 'A'" : "Final Report Type 'A'"}
                />
                <StatCard
                  title={isKn ? "ಸೈಬರ್ ವಂಚನೆ ವೇಗ" : "Cyber Fraud Velocity"}
                  value="210 / Mo"
                  change={isKn ? "+14.2% ಮಾಸಿಕ ಅಪಾಯ" : "+14.2% MoM Risk"}
                  icon={FaSearch}
                  color="text-amber-400"
                  borderColor="border-amber-500"
                  dataSource="ActSection IT Sec 66D"
                  coverage={isKn ? "ಬೆಂಗಳೂರು ಪೂರ್ವ ವಲಯ" : "Bengaluru East Range"}
                  lastSync="Hourly Telemetry"
                  subText={isKn ? "AePS ಕ್ಲೋನ್ ವಂಚನೆಗಳು" : "AePS Clone Scams"}
                />
                <StatCard
                  title={isKn ? "ಮಾದರಿ ವೈಪರೀತ್ಯ ಸೂಚ್ಯಂಕ" : "Pattern Anomaly Index"}
                  value={isKn ? "ಹೆಚ್ಚು (0.78)" : "HIGH (0.78)"}
                  change={isKn ? "3 ಸಕ್ರಿಯ ಎಚ್ಚರಿಕೆಗಳು" : "3 Active Alerts"}
                  icon={FaExclamationTriangle}
                  color="text-rose-400"
                  borderColor="border-rose-500"
                  dataSource="QuickML Anomaly Matrix"
                  coverage={isKn ? "ರಾಜ್ಯವ್ಯಾಪಿ ಎಚ್ಚರಿಕೆಯ ನಕ್ಷೆ" : "Statewide Alert Grid"}
                  lastSync="Live Stream"
                  subText={isKn ? "ಸಂಬಂಧಿತ ಪ್ರಕರಣಗಳ ಗುಂಪು" : "Correlated Case Clusters"}
                />
              </div>

              {/* Executive Forecast Narrative */}
              <div
                className="rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl"
                style={{ padding: "22px 24px" }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="flex-shrink-0 flex items-center justify-center rounded-sm shadow-md"
                    style={{ width: 44, height: 44, background: "rgba(124,58,237,0.2)", border: "1px solid rgba(124,58,237,0.4)" }}
                  >
                    <RiBrainLine className="text-xl text-purple-400" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div>
                      <p className="text-[10px] font-mono font-bold text-purple-400 uppercase tracking-widest mb-1">
                        {isKn ? "ಕಾರ್ಯನಿರ್ವಾಹಕ ಮುನ್ಸೂಚನೆ ಸಾರಾಂಶ · ಕ್ವಿಕ್‌ಎಮ್‌ಎಲ್ ವರದಿ" : "Executive Forecast Summary · QuickML Intelligence Report"}
                      </p>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {isKn ? "ರಾಜ್ಯವ್ಯಾಪಿ ಅಪರಾಧ ಮುನ್ಸೂಚನೆ — ತ್ರೈಮಾಸಿಕ 2025" : "Statewide Crime Outlook — Q3 2025"}
                      </h3>
                    </div>
                    {isKn ? (
                      <p className="text-sm text-slate-300 font-sans leading-relaxed">
                        ಕ್ವಿಕ್‌ಎಮ್‌ಎಲ್ ಮುನ್ಸೂಚಕ ವಿಶ್ಲೇಷಣೆ ಎಂಜಿನ್ ಬಹು-ವರ್ಷಗಳ ಸಿಸಿಟಿಎನ್‌ಎಸ್ ಪ್ರಕರಣಗಳ ಡೇಟಾವನ್ನು ನಕ್ಷೆ ಮಾಡುತ್ತದೆ. ಮುಂಬರುವ ವಾರಾಂತ್ಯಗಳಲ್ಲಿ ನಗರ ಪೊಲೀಸ್ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ಆಸ್ತಿ ಕಳ್ಳತನದ ಘಟನೆಗಳು <strong className="text-white">18.4%</strong> ಹೆಚ್ಚಾಗುವ ಮುನ್ಸೂಚನೆಯಿದೆ. ಬೆಂಗಳೂರು ಪೂರ್ವದಲ್ಲಿ ಸೈಬರ್ ವಂಚನೆ ಹೆಚ್ಚಳವು ಮಾಸಿಕ <strong className="text-white">+14.2%</strong> ರಷ್ಟಿದೆ. ಕೋರಮಂಗಲ (<strong className="text-white">86% ಕಳ್ಳತನದ ಸಂಭವನೀಯತೆ</strong>), ಮಂಗಳೂರು ಬಂದರು ವಲಯ (<strong className="text-white">ಮಾದಕದ್ರವ್ಯ 61%</strong>), ಮತ್ತು ಬೆಂಗಳೂರು ಪೂರ್ವ ಸೈಬರ್ ಕಾರಿಡಾರ್ (<strong className="text-white">74%</strong>) ಹೆಚ್ಚಿನ ಅಪಾಯಕಾರಿ ವಲಯಗಳಾಗಿವೆ.
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-slate-300 font-sans leading-relaxed">
                          The QuickML predictive analytics engine correlates multi-year CCTNS{" "}
                          <code className="text-purple-300 font-mono text-[11px] bg-purple-900/30 border border-purple-500/30 px-1.5 py-0.5 rounded">CaseMaster</code>{" "}
                          timestamps with geographic unit boundaries (
                          <code className="text-purple-300 font-mono text-[11px] bg-purple-900/30 border border-purple-500/30 px-1.5 py-0.5 rounded">UnitID</code>
                          ). Based on seasonal variance and repeat Offence Section spikes, property theft incidents in urban
                          police ranges are projected to rise by <strong className="text-white">18.4%</strong> over upcoming weekends.
                          Cyber fraud escalation in Bengaluru East follows an accelerating +14.2% monthly trend driven by AePS
                          cloning operations. Tactical deployment recommendations have been dispatched to precinct shift supervisors.
                        </p>
                        <p className="text-sm text-slate-300 font-sans leading-relaxed">
                          High confidence zones include <strong className="text-white">Koramangala (86% theft probability)</strong>,{" "}
                          <strong className="text-white">Mangaluru Port Zone (narcotics, 61%)</strong>, and{" "}
                          <strong className="text-white">Bengaluru East cyber corridor (74%)</strong>. All predictions are
                          model-generated from active FIR records with an 88.4% confidence index across a 12-week forward window.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Forecast Intelligence Card (Probabilities + What-Ifs + Threat Zones) */}
              <div
                className="rounded-md border border-slate-700/60 bg-slate-900/85 backdrop-blur-md shadow-xl"
                style={{ padding: "24px 28px" }}
              >
                <PredictiveForecastingCard lang={pageLang} />
              </div>


            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default InsightsForecast;
