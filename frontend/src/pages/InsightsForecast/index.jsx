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
  const [pageLang, setPageLang] = useState("en"); // 'en' or 'hi'

  // Chat state
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState("");
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  const isHi = pageLang === "hi";

  const TABS = [
    { id: "copilot", label: isHi ? "एआई को-पायलट और खोज" : "AI Copilot & Search", icon: RiRobot2Line, activeColor: "from-blue-600 to-violet-600" },
    { id: "forecast", label: isHi ? "पूर्वानुमान रुझान एवं विश्लेषण" : "Predictive Trend Forecast", icon: TbChartLine, activeColor: "from-violet-600 to-purple-700" },
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
    setSessions((prev) => [{ id: newId, title: isHi ? "नया सत्र" : "New Session", timestamp: isHi ? "अभी" : "Just now", status: "active" }, ...prev]);
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
      setMessages((prev) => [...prev, { sender: "assistant", text: isHi ? "त्रुटि: अनुरोध संसाधित करने में विफल।" : "Error: Failed to process request." }]);
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
            {isHi ? "अपराध पूर्वानुमान और विश्लेषण (AI Insights & Forecast)" : "AI Insights & Forecast"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 font-sans mt-1.5 max-w-2xl leading-relaxed">
            {isHi
              ? "प्राकृतिक भाषा खुफिया खोज, अपराध पूर्वानुमान और विसंगति पहचान प्रणाली।"
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
              onClick={() => setPageLang("hi")}
              className={`px-3 py-1.5 text-xs font-bold rounded-none transition-all cursor-pointer ${
                pageLang === "hi" ? "bg-purple-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
              }`}
            >
              हिंदी
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
                    {isHi ? "सत्र सूची" : "Sessions"}
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
                    <p className="text-xs font-bold text-white font-space">MP Police AI Copilot</p>
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
            <Loader message={isHi ? "क्विकएमएल पूर्वानुमान मॉडल लोड हो रहे हैं..." : "Loading QuickML Time-Series Predictive Models..."} />
          ) : (
            <div className="flex flex-col" style={{ gap: "2rem" }}>
              {/* KPI Cards */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title={isHi ? "अनुमानित सीडीआर/आईपीडीआर वृद्धि" : "Forecasted CDR/IPDR Spike"}
                  value="+18.4%"
                  change={isHi ? "क्विकएमएल मॉडल" : "QuickML Model"}
                  icon={FaBrain}
                  color="text-purple-400"
                  borderColor="border-purple-500"
                  dataSource="CaseMaster + UnitID 4108"
                  coverage={isHi ? "संवेदनशील शहरी थाना" : "Urban Police Station"}
                  lastSync="QuickML Realtime"
                  subText={isHi ? "आईपीडीआर विसंगति वृद्धि" : "IPDR Anomaly Surge"}
                />
                <StatCard
                  title={isHi ? "अनुमानित चार्जशीट दर" : "Predicted Charge-sheet Rate"}
                  value="76.8%"
                  change={isHi ? "+2.6% अनुमान" : "+2.6% Projection"}
                  icon={FaGavel}
                  color="text-emerald-400"
                  borderColor="border-emerald-500"
                  dataSource="ChargesheetDetails ML"
                  coverage={isHi ? "न्यायिक मजिस्ट्रेट न्यायालय" : "Judicial Magistrate Courts"}
                  lastSync="Daily Batch Run"
                  subText={isHi ? "अंतिम रिपोर्ट प्रकार 'A'" : "Final Report Type 'A'"}
                />
                <StatCard
                  title={isHi ? "साइबर धोखाधड़ी वेग" : "Cyber Fraud Velocity"}
                  value="210 / Mo"
                  change={isHi ? "+14.2% मासिक जोखिम" : "+14.2% MoM Risk"}
                  icon={FaSearch}
                  color="text-amber-400"
                  borderColor="border-amber-500"
                  dataSource="ActSection IT Sec 66D"
                  coverage={isHi ? "शहरी साइबर सेल रेंज" : "Urban Cyber Cell Range"}
                  lastSync="Hourly Telemetry"
                  subText={isHi ? "AePS क्लोन धोखाधड़ी" : "AePS Clone Scams"}
                />
                <StatCard
                  title={isHi ? "पैटर्न विसंगति सूचकांक" : "Pattern Anomaly Index"}
                  value={isHi ? "उच्च (0.78)" : "HIGH (0.78)"}
                  change={isHi ? "3 सक्रिय अलर्ट" : "3 Active Alerts"}
                  icon={FaExclamationTriangle}
                  color="text-rose-400"
                  borderColor="border-rose-500"
                  dataSource="QuickML Anomaly Matrix"
                  coverage={isHi ? "राज्यव्यापी अलर्ट ग्रिड" : "Statewide Alert Grid"}
                  lastSync="Live Stream"
                  subText={isHi ? "संबंधित मामला क्लस्टर" : "Correlated Case Clusters"}
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
                        {isHi ? "कार्यकारी पूर्वानुमान सारांश · क्विकएमएल खुफिया रिपोर्ट" : "Executive Forecast Summary · QuickML Intelligence Report"}
                      </p>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {isHi ? "राज्यव्यापी अपराध परिदृश्य — तिमाही 2026" : "Statewide Crime Outlook — Q3 2026"}
                      </h3>
                    </div>
                    {isHi ? (
                      <>
                        <p className="text-sm text-slate-300 font-sans leading-relaxed">
                          क्विकएमएल पूर्वानुमान विश्लेषण इंजन बहु-वर्षीय सीसीटीएनएस केसमास्टर लॉग और भौगोलिक इकाई सीमाओं का विश्लेषण करता है। मौसमी भिन्नता और पुनरावृत्ति अपराध धाराओं के आधार पर, आगामी सप्ताहांतों में शहरी पुलिस परिक्षेत्रों में संपत्ति चोरी की घटनाओं में <strong className="text-white">18.4%</strong> की वृद्धि होने का अनुमान है। शहरी क्षेत्रों में साइबर धोखाधड़ी में तेजी से <strong className="text-white">+14.2%</strong> मासिक वृद्धि देखी जा रही है, जो मुख्य रूप से AePS क्लोनिंग अभियानों से प्रेरित है। सामरिक तैनाती अनुशंसाएं थाना प्रभारियों को प्रेषित कर दी गई हैं।
                        </p>
                        <p className="text-sm text-slate-300 font-sans leading-relaxed">
                          उच्च विश्वास वाले क्षेत्रों में <strong className="text-white">संवेदनशील शहरी क्षेत्र (86% चोरी संभाव्यता)</strong>, <strong className="text-white">पारगमन कॉरिडोर (नारकोटिक्स, 61%)</strong>, और <strong className="text-white">साइबर कॉरिडोर (74%)</strong> शामिल हैं। सभी पूर्वानुमान 12-सप्ताह की आगे की विंडो में 88.4% विश्वास सूचकांक के साथ सक्रिय प्राथमिकी रिकॉर्ड से मॉडल-जनरेट किए गए हैं।
                        </p>
                      </>
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
