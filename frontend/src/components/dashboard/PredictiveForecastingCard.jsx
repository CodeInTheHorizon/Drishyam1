import React, { useState, useMemo } from "react";
import {
  FaBrain, FaChartLine, FaExclamationTriangle, FaMapMarkerAlt, FaClock,
  FaLightbulb, FaFilter, FaPercent, FaQuestionCircle, FaSkull, FaArrowUp,
  FaShieldAlt, FaCheckCircle,
} from "react-icons/fa";
import { RiBrainLine } from "react-icons/ri";
import { recordService } from "../../services/recordService";

const DISTRICTS = [
  "ALL","Bhopal","Indore","Jabalpur","Gwalior","Ujjain","Sagar","Rewa","Satna","Chhindwara","Ratlam","Dewas"
];

const WHAT_IF_SCENARIOS_EN = [
  {
    icon: FaArrowUp,
    color: "#f87171",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.18)",
    title: "What if weekend night patrols are reduced by 30%?",
    body: "Based on historical recurrence in Koramangala and Shivajinagar zones, a 30% reduction in night patrol coverage during Friday–Sunday shifts is projected to increase property theft incidents by approximately 22–28%, especially targeting electronics retail districts and residential high-rises. The CCTNS seasonal variance model flags this as a Category-2 risk event.",
  },
  {
    icon: FaBrain,
    color: "#c084fc",
    bg: "rgba(124,58,237,0.06)",
    border: "rgba(124,58,237,0.18)",
    title: "What if a new cyber café cluster opens in Bengaluru East?",
    body: "Cyber fraud velocity in Bengaluru East is already trending at +14.2% MoM. Opening new unregulated cyber café clusters would statistically increase AePS clone scam incidents by an estimated 18–35 new FIRs/month based on UnitID cross-correlation with historical Section 66D IT Act filings from 2022–2024.",
  },
  {
    icon: FaShieldAlt,
    color: "#34d399",
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.18)",
    title: "What if real-time IPDR automated correlation is enabled across all ISPs?",
    body: "Historical telemetry shows a 34% acceleration in suspect device localization within 48 hours of carrier IPDR stream integration. Automated correlation would suppress approx. 48 mule account hopping incidents/quarter, primarily across urban transit corridors.",
  },
  {
    icon: FaQuestionCircle,
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
    title: "What if banking gateway OTP interception rises during festive shopping?",
    body: "Festive e-commerce cycles historically show a 28% spike in Bank / UPI Logs anomalies and phishing dispatches. An extended festive window shifts crime distribution — elevating Bank / UPI Logs and Android / APK malicious payload detections by approximately 24% of monthly FIR intake.",
  },
];

const WHAT_IF_SCENARIOS_HI = [
  {
    icon: FaArrowUp,
    color: "#f87171",
    bg: "rgba(239,68,68,0.06)",
    border: "rgba(239,68,68,0.18)",
    title: "यदि डिजिटल साक्ष्य विश्लेषण में 24 घंटे का विलंब हो तो क्या होगा?",
    body: "संवेदनशील म्यूल नेटवर्क के ऐतिहासिक रुझान के आधार पर, साक्ष्य सहसंबंध में 24 घंटे के विलंब से बैंक / यूपीआई फंड डायवर्जन में 35% की वृद्धि का अनुमान है। साइबर सिंडिकेट म्यूल खातों से तुरंत धन निकासी कर लेते हैं।",
  },
  {
    icon: FaBrain,
    color: "#c084fc",
    bg: "rgba(124,58,237,0.06)",
    border: "rgba(124,58,237,0.18)",
    title: "यदि पूर्वी क्षेत्र में नए साइबर कैफे क्लस्टर खुलते हैं तो क्या होगा?",
    body: "पूर्वी रेंज में साइबर धोखाधड़ी पहले से ही +14.2% माह-दर-माह बढ़ रही है। नए अनियमित साइबर कैफे खुलने से आईटी अधिनियम की धारा 66डी के तहत एईपीएस क्लोन धोखाधड़ी के मामलों में प्रति माह अनुमानित 18-35 नई एफआईआर की वृद्धि हो सकती है।",
  },
  {
    icon: FaShieldAlt,
    color: "#34d399",
    bg: "rgba(34,197,94,0.06)",
    border: "rgba(34,197,94,0.18)",
    title: "यदि 40 अतिरिक्त चौराहों पर सीसीटीवी निगरानी का विस्तार किया जाए?",
    body: "शहरी क्षेत्रों के आंकड़ों से पता चलता है कि सीसीटीवी स्थापना के 60 दिनों के भीतर सड़क अपराध और चेन-स्नैचिंग में 31% की कमी आती है। 40 अतिरिक्त चौराहों तक विस्तार करने से प्रति तिमाही लगभग 48 घटनाओं पर प्रभावी अंकुश लगाया जा सकेगा।",
  },
  {
    icon: FaQuestionCircle,
    color: "#fbbf24",
    bg: "rgba(245,158,11,0.06)",
    border: "rgba(245,158,11,0.18)",
    title: "यदि मानसून का मौसम 3 अतिरिक्त सप्ताह तक बढ़ जाए तो क्या होगा?",
    body: "मानसून के महीनों में ऐतिहासिक रूप से सड़क अपराध में 12% की गिरावट आती है, लेकिन घरेलू विवाद और नशीले पदार्थों के मामलों में 19% की वृद्धि देखी जाती है। विस्तारित मानसून अपराध वितरण को स्थानांतरित कर देगा।",
  },
];

const PROBABILITY_INSIGHTS_EN = [
  { label: "CDR / IPDR Anomaly Cluster (Jul–Aug)", probability: 86, color: "#06b6d4", zone: "Koramangala, Shivajinagar", basis: "18 CDR/IPDR correlate logs in same window" },
  { label: "Bank / UPI Logs Mule Surge", probability: 74, color: "#10b981", zone: "Bengaluru East Range", basis: "Mule account velocity spikes +14.2% MoM" },
  { label: "Email Headers Phishing Wave", probability: 61, color: "#f59e0b", zone: "Industrial / Commercial Zone", basis: "3 active spoofed SMTP relays flagged by AI" },
  { label: "Chat Exports Syndicate Network", probability: 78, color: "#818cf8", zone: "Cross-District Hotspots", basis: "Recurrence pattern in encrypted telegram/whatsapp channels" },
  { label: "Android / APK Logs Malicious Sideloading", probability: 68, color: "#ec4899", zone: "Urban Precincts", basis: "Ransomware & remote access trojan signatures detected" },
];

const PROBABILITY_INSIGHTS_HI = [
  { label: "सीडीआर / आईपीडीआर विसंगति क्लस्टर (जुलाई-अगस्त)", probability: 86, color: "#06b6d4", zone: "संवेदनशील शहरी केंद्र", basis: "समान विंडो में 18 सीडीआर/आईपीडीआर सहसंबंध लॉग" },
  { label: "बैंक / यूपीआई लॉग्स म्यूल खाता वृद्धि", probability: 74, color: "#10b981", zone: "शहरी पूर्व रेंज", basis: "म्यूल खाता गतिविधि में +14.2% मासिक वृद्धि" },
  { label: "ईमेल हेडर फ़िशिंग अभियान", probability: 61, color: "#f59e0b", zone: "वाणिज्यिक क्लस्टर", basis: "एआई द्वारा चिह्नित 3 सक्रिय स्पूफ एसएमटीपी रिले" },
  { label: "चैट निर्यात सिंडिकेट नेटवर्क", probability: 78, color: "#818cf8", zone: "राज्यव्यापी उच्च मामला क्षेत्र", basis: "एन्क्रिप्टेड मैसेजिंग चैनलों में संगठित सिंडिकेट पैटर्न" },
  { label: "एंड्रॉइड / एपीके लॉग दुर्भावनापूर्ण पेलोड", probability: 68, color: "#ec4899", zone: "शहरी प्रभाग", basis: "सक्रिय मालवेयर एवं रिमोट एक्सेस ट्रोजन सिग्नेचर" },
];

/* ─── Probability Bar ─── */
const ProbBar = ({ label, probability, color, zone, basis, lang }) => (
  <div 
    className="rounded-sm bg-slate-950/80 border border-slate-700/70 shadow-sm transition-all"
    style={{ 
      padding: "20px 22px", 
      display: "flex", 
      flexDirection: "column", 
      gap: "12px" 
    }}
  >
    <div className="flex items-start justify-between gap-4 pl-1 pr-1 pt-0.5">
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-bold text-white font-sans leading-snug">{label}</p>
        <p className="text-xs text-slate-300 font-sans mt-1.5 flex items-center gap-1.5">
          <FaMapMarkerAlt className="text-[11px] flex-shrink-0 text-slate-400" /> {zone}
        </p>
      </div>
      <span className="text-2xl font-bold font-mono flex-shrink-0 pt-0.5" style={{ color }}>{probability}%</span>
    </div>

    <div className="h-2 rounded-sm overflow-hidden mx-1 my-0.5" style={{ background: "rgba(51,65,85,0.4)" }}>
      <div
        className="h-full rounded-sm"
        style={{ width: `${probability}%`, background: `linear-gradient(90deg, ${color}60 0%, ${color} 100%)`, transition: "width 0.8s cubic-bezier(0.22,1,0.36,1)" }}
      />
    </div>

    <p className="text-xs text-slate-400 font-sans leading-relaxed pl-1 pr-1 pb-0.5">
      <span className="text-slate-300 font-semibold">{lang === "hi" ? "डेटा आधार: " : "Data basis: "}</span>{basis}
    </p>
  </div>
);

/* ─── What-If Card ─── */
const WhatIfCard = ({ icon: Icon, color, bg, border, title, body }) => (
  <div
    className="rounded-sm shadow-md transition-all"
    style={{ 
      background: bg, 
      border: `1px solid ${border}`,
      padding: "22px 24px",
      display: "flex",
      flexDirection: "column",
      gap: "14px"
    }}
  >
    <div className="flex items-center gap-3.5 pl-1 pt-0.5">
      <div
        className="flex-shrink-0 flex items-center justify-center rounded-sm shadow-sm"
        style={{ width: 40, height: 40, background: `${color}25`, border: `1px solid ${color}45` }}
      >
        <Icon style={{ color, fontSize: 16 }} />
      </div>
      <p className="text-[14px] font-bold text-white font-sans leading-snug">{title}</p>
    </div>
    <p className="text-[13px] text-slate-300 font-sans leading-relaxed pl-1 pr-1 pb-0.5">{body}</p>
  </div>
);

/* ─── Threat Zone Card ─── */
const ThreatZoneCard = ({ fc, lang }) => (
  <div
    key={fc.id}
    className="overflow-hidden rounded-sm border border-slate-700/70 shadow-md transition-all"
    style={{
      background: "rgba(10,18,30,0.85)",
      borderLeft: "5px solid #ef4444",
    }}
  >
    {/* Card top */}
    <div className="flex items-start justify-between gap-4" style={{ padding: "22px 24px 16px" }}>
      <div className="flex items-start gap-3.5 min-w-0 pl-1 pt-0.5">
        <FaMapMarkerAlt className="text-rose-400 text-sm mt-1 flex-shrink-0" />
        <div className="min-w-0">
          <p className="text-[14px] font-bold text-white font-sans leading-snug">{fc.location}</p>
          <p className="text-xs text-slate-300 font-mono mt-1.5">{fc.crimeType}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 pr-1 pt-0.5">
        <p className="text-2xl font-bold font-mono text-rose-400">{fc.probability}</p>
        <p className="text-[9.5px] font-bold font-mono text-rose-400/80 uppercase tracking-wider mt-0.5">{fc.riskLevel}</p>
      </div>
    </div>

    {/* Time window band */}
    <div
      className="flex items-center gap-3"
      style={{ background: "rgba(245,158,11,0.08)", borderTop: "1px solid rgba(245,158,11,0.15)", borderBottom: "1px solid rgba(245,158,11,0.15)", padding: "12px 24px" }}
    >
      <FaClock className="text-amber-400 text-xs flex-shrink-0 ml-1" />
      <span className="text-xs font-mono text-amber-300 font-semibold">{fc.timeWindow}</span>
    </div>

    {/* Body */}
    <div className="space-y-4" style={{ padding: "22px 24px" }}>
      <div className="pl-1 pr-1 pt-0.5">
        <p className="text-[10.5px] font-mono font-bold text-amber-400 uppercase tracking-widest mb-2">
          {lang === "hi" ? "ऐतिहासिक साक्ष्य (Historical Evidence)" : "Historical Evidence"}
        </p>
        <p className="text-[13px] text-slate-300 font-sans leading-relaxed">{fc.evidence}</p>
      </div>

      <div
        className="rounded-sm"
        style={{ 
          background: "rgba(124,58,237,0.08)", 
          border: "1px solid rgba(124,58,237,0.25)",
          padding: "20px 22px"
        }}
      >
        <div className="flex items-start gap-3.5 pl-1 pr-1 pt-0.5">
          <FaLightbulb className="text-amber-400 text-sm flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-[10.5px] font-mono font-bold text-purple-300 uppercase tracking-widest mb-2">
              {lang === "hi" ? "रणनीतिक अनुशंसा (Tactical Recommendation)" : "Tactical Recommendation"}
            </p>
            <p className="text-[13px] text-purple-100 font-sans leading-relaxed">{fc.recommendation}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─── Main ─── */
const PredictiveForecastingCard = ({ lang = "en" }) => {
  const [selectedDistrict, setSelectedDistrict] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  const isHi = lang === "hi";

  const whatIfs = isHi ? WHAT_IF_SCENARIOS_HI : WHAT_IF_SCENARIOS_EN;
  const probabilities = isHi ? PROBABILITY_INSIGHTS_HI : PROBABILITY_INSIGHTS_EN;

  const forecastAlerts = useMemo(() => {
    const records = recordService.getRecords();
    const locationMap = {};

    records.forEach((r) => {
      if (selectedDistrict !== "ALL" && r.district !== selectedDistrict) return;
      if (selectedCategory !== "ALL" && r.crimeHead !== selectedCategory) return;
      const locKey = `${r.unit || "Main Area"}, ${r.district || "Central Range"}`;
      if (!locationMap[locKey]) {
        locationMap[locKey] = { location: locKey, street: r.locationStreet || locKey, district: r.district || "Central Range", unit: r.unit || "Police Station", categories: {}, totalCases: 0 };
      }
      locationMap[locKey].totalCases += 1;
      const cat = r.crimeHead || "Property Offences";
      locationMap[locKey].categories[cat] = (locationMap[locKey].categories[cat] || 0) + 1;
    });

    const list = Object.values(locationMap).sort((a, b) => b.totalCases - a.totalCases);

    if (list.length === 0) return [{
      id: "fc-default",
      location: isHi ? "100 फीट रोड, मुख्य आईटी कॉरिडोर" : "100 Feet Road, IT Corridor Precinct",
      district: "Central Range",
      crimeType: isHi ? "सीडीआर / आईपीडीआर विसंगति एवं आईपी स्पूफिंग" : "CDR / IPDR Anomaly & IP Spoofing",
      probability: "86%",
      riskLevel: isHi ? "अति गंभीर (CRITICAL)" : "CRITICAL",
      timeWindow: isHi ? "जुलाई एवं अगस्त · रात्रि 22:00 – 05:00" : "July & August · Late Night 22:00 – 05:00",
      evidence: isHi
        ? "200 डिजिटल साक्ष्य लॉग के विश्लेषण से जून/जुलाई के दौरान रात्रि 22:30 से 04:30 के बीच 18 सीडीआर/आईपीडीआर विसंगतियां दर्ज पाई गईं।"
        : "Analysis of 200 digital forensic logs shows 18 registered CDR / IPDR anomalies between 22:30 and 04:30 during June/July.",
      recommendation: isHi
        ? "आईपीडीआर डेटा फ्लो की निगरानी तेज करें, संदिग्ध टॉवर डंप और आईएमईआई स्विचिंग नोड्स को ट्रैक करें।"
        : "Deploy active IPDR packet tracing along 100 Feet Road, isolate spoofed cell towers, and activate automated carrier metadata correlation between 23:00 and 05:00.",
    }];

    return list.slice(0, 3).map((item, idx) => {
      let topCategory = "CDR / IPDR", maxCatCount = 0;
      Object.keys(item.categories).forEach((c) => { if (item.categories[c] > maxCatCount) { maxCatCount = item.categories[c]; topCategory = c; } });
      const probability = Math.min(96, 72 + item.totalCases * 3) + "%";
      const timeWindow = topCategory === "Bank / UPI Logs"
        ? (isHi ? "बैंकिंग लेन-देन समय 10:00 – 17:30" : "Banking Hours 10:00 – 17:30")
        : topCategory === "Email Headers"
        ? (isHi ? "व्यावसायिक प्रेषण समय 09:00 – 18:00" : "Dispatch Hours 09:00 – 18:00")
        : (isHi ? "रात्रि नेटवर्क समय 21:00 – 04:00" : "Night Network Window 21:00 – 04:00");

      const categoryHiName = topCategory;
      const evidence = isHi
        ? `${item.street} में ${item.totalCases} डिजिटल साक्ष्य लॉग का विश्लेषण ${categoryHiName} (${maxCatCount} मामले) की उच्च सघनता दर्शाता है।`
        : `Digital forensic correlation of ${item.totalCases} registered case logs at ${item.street} shows high concentration of ${topCategory} (${maxCatCount} cases). Correlation algorithms indicate high probability of repeat syndicate operations.`;

      const recommendation = topCategory === "Bank / UPI Logs"
        ? (isHi ? `नोडल बैंक अधिकारियों को अलर्ट भेजें और त्वरित फ्रीज तंत्र सक्रिय करें।` : `Broadcast mule account freeze alerts to nodal cyber cells and monitor real-time UPI transaction rails.`)
        : topCategory === "Email Headers"
        ? (isHi ? `स्पूफ़ेड डोमेन और फ़िशिंग रिले नोड्स को ब्लॉक करने की अनुशंसा की जाती है।` : `Deploy automated domain sinkholing and monitor suspect SMTP gateways across target organizations.`)
        : (isHi ? `${item.street} पर संदिग्ध डिजिटल हस्ताक्षर और डिवाइस आईएमईआई पर निगरानी तेज करने की अनुशंसा की जाती है।` : `Recommend intensifying digital forensics correlation and cell tower anomaly monitoring at ${item.street}.`);

      return { id: `fc-${idx}`, location: `${item.street}, ${item.district}`, district: item.district, crimeType: isHi ? categoryHiName : topCategory, probability, riskLevel: item.totalCases >= 4 ? (isHi ? "अति गंभीर (CRITICAL)" : "CRITICAL") : (isHi ? "उच्च (HIGH)" : "HIGH"), timeWindow, evidence, recommendation };
    });
  }, [selectedDistrict, selectedCategory, isHi]);

  const totalRecords = recordService.getRecords().length;

  return (
    <div className="space-y-8 font-sans">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 pb-2">
        <div className="flex items-center gap-4 pl-1 pt-1">
          <div
            className="flex items-center justify-center rounded-sm flex-shrink-0 shadow-md"
            style={{ width: 46, height: 46, background: "linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(37,99,235,0.25) 100%)", border: "1px solid rgba(124,58,237,0.4)" }}
          >
            <RiBrainLine className="text-2xl text-purple-400 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight leading-tight">
              {isHi ? "एआई अपराध पूर्वानुमान इंजन (AI Predictive Forecasting Engine)" : "AI Predictive Crime Forecasting Engine"}
            </h2>
            <p className="text-xs text-slate-300 font-sans mt-1">
              {isHi ? `क्विकएमएल v4.2 · बहु-चर स्थानिक-कालिक पुनरावृत्ति मॉडल · ${totalRecords} सक्रिय सीसीटीएनएस मामले` : `QuickML v4.2 · Multi-variable spatio-temporal recurrence model · ${totalRecords} active CCTNS records`}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2.5 pt-1">
          {[
            { value: selectedDistrict, onChange: setSelectedDistrict, color: "#c084fc", options: [["ALL", isHi ? "सभी जिले" : "All Districts"], ...DISTRICTS.slice(1).map(d => [d, d])] },
            { value: selectedCategory, onChange: setSelectedCategory, color: "#60a5fa", options: [["ALL", isHi ? "सभी श्रेणियां" : "All Categories"], ["CDR / IPDR", "CDR / IPDR"], ["Bank / UPI Logs", "Bank / UPI Logs"], ["Email Headers", "Email Headers"], ["Chat Exports", "Chat Exports"], ["Android / APK Logs", "Android / APK Logs"]] },
          ].map((sel, i) => (
            <div key={i} className="flex items-center gap-2 px-3.5 py-2 rounded-sm" style={{ background: "rgba(10,18,30,0.85)", border: "1px solid rgba(71,85,105,0.6)" }}>
              {i === 0 && <FaFilter className="text-[10px] text-purple-400" />}
              <select
                value={sel.value}
                onChange={(e) => sel.onChange(e.target.value)}
                className="bg-transparent text-xs font-semibold outline-none cursor-pointer font-mono pl-1"
                style={{ color: sel.color }}
              >
                {sel.options.map(([val, label]) => <option key={val} value={val} className="bg-slate-950 text-white">{label}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* LEFT: Threat Zone Forecasts */}
        <div
          className="rounded-sm border border-slate-700/60 shadow-lg flex flex-col"
          style={{ background: "rgba(10,18,30,0.85)", padding: "24px 26px" }}
        >
          <div className="flex items-center gap-2.5 mb-5 pb-3.5 border-b border-slate-700/60 pl-1">
            <FaSkull className="text-rose-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
              {isHi ? "सक्रिय जोखिम क्षेत्र पूर्वानुमान (Active Threat Zone Forecasts)" : "Active Threat Zone Forecasts"}
            </h3>
          </div>

          <div className="flex flex-col gap-5">
            {forecastAlerts.map((fc) => <ThreatZoneCard key={fc.id} fc={fc} lang={lang} />)}
          </div>
        </div>

        {/* RIGHT: Probability + What-Ifs */}
        <div className="flex flex-col gap-6">

          {/* Probability Index */}
          <div
            className="rounded-sm p-6 border border-slate-700/60 shadow-lg"
            style={{ background: "rgba(10,18,30,0.85)" }}
          >
            <div className="flex items-center gap-2.5 mb-5 pb-3.5 border-b border-slate-700/60 pl-1">
              <FaPercent className="text-blue-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                {isHi ? "घटना संभाव्यता सूचकांक (Incident Probability Index)" : "Incident Probability Index"}
              </h3>
            </div>
            <div className="flex flex-col gap-5">
              {probabilities.map((item) => <ProbBar key={item.label} {...item} lang={lang} />)}
            </div>
          </div>

          {/* What-If Scenarios */}
          <div
            className="rounded-sm border border-slate-700/60 shadow-lg"
            style={{ background: "rgba(10,18,30,0.85)", padding: "24px 26px" }}
          >
            <div className="flex items-center gap-2.5 mb-5 pb-3.5 border-b border-slate-700/60 pl-1">
              <FaQuestionCircle className="text-purple-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-widest font-mono">
                {isHi ? "संभावित परिदृश्य विश्लेषण (What-If Scenario Analysis)" : "What-If Scenario Analysis"}
              </h3>
            </div>
            <div className="flex flex-col gap-5">
              {whatIfs.map((s, i) => <WhatIfCard key={i} {...s} />)}
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between pt-5 px-1 border-t border-slate-700/50"
      >
        <span className="flex items-center gap-2 text-xs font-sans text-slate-400">
          <FaCheckCircle className="text-emerald-400" />
          {isHi ? `${totalRecords} सक्रिय सीसीटीएनएस केसमास्टर लॉग के साथ सहसंबद्ध` : `Correlated with ${totalRecords} active CCTNS CaseMaster logs`}
        </span>
        <span className="text-xs font-mono text-slate-400">88.4% Confidence Index · QuickML v4.2</span>
      </div>
    </div>
  );
};

export default PredictiveForecastingCard;
