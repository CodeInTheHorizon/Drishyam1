import React, { useState, useEffect } from "react";
import { FaUser, FaBrain, FaVolumeUp, FaVolumeMute } from "react-icons/fa";

const translations = {
  "bengaluru city crime analytics summary": `### भोपाल / इंदौर नगर अपराध विश्लेषण सारांश (2026)

कुल पंजीकृत प्राथमिकी (FIR) मामले: **1,482** (वर्ष-दर-वर्ष **4.2%** की वृद्धि)।

#### अपराध श्रेणियों का विवरण:
1. **संपत्ति संबंधी अपराध**: 642 मामले (कुल का 43%) - मुख्य चिंता: रात्रि नकबजनी।
2. **साइबर अपराध**: 412 मामले (कुल का 28%) - मुख्य चिंता: ओटीपी / सिम स्वैप धोखाधड़ी।
3. **शारीरिक अपराध**: 224 मामले (कुल का 15%) - मुख्य चिंता: वाणिज्यिक क्षेत्रों के बाहर मारपीट।
4. **वित्तीय धोखाधड़ी**: 142 मामले (कुल का 10%) - मुख्य चिंता: फर्जी कंपनी निवेश घोटाला।

#### प्रमुख हॉटस्पॉट:
* सेंट्रल डिवीजन (31% घटनाएं)
* ईस्ट डिवीजन (24% घटनाएं)
* साउथ-ईस्ट डिवीजन (18% घटनाएं)`,

  "madhya pradesh high-risk districts": `### Madhya Pradesh High-Risk Districts (GIS Hotspots)

जीआईएस इंटेलिजेंस ट्रैकर के सक्रिय मानचित्रों के आधार पर:

| रैंक | जिला / क्षेत्र | सक्रिय मामले | मुख्य खतरा | घटना दर |
| :--- | :--- | :--- | :--- | :--- |
| 1 | भोपाल / इंदौर शहरी | 642 मामले | साइबर एवं संपत्ति अपराध | उच्च |
| 2 | जबलपुर संभाग | 198 मामले | नशीले पदार्थ एवं शारीरिक अपराध | मध्यम-उच्च |
| 3 | ग्वालियर क्षेत्र | 145 मामले | संपत्ति अपराध एवं चोरी | मध्यम |
| 4 | उज्जैन जिला | 120 मामले | वित्तीय धोखाधड़ी एवं जांच | मध्यम |

#### एआई अनुशंसा:
संवेदनशील शहरी डिवीजनों में अतिरिक्त साइबर गश्ती संसाधन तैनात करें और प्रमुख पारगमन मार्गों पर एनडीपीएस जांच तेज करें।`,

  "cyber fraud trends": `### एआई टेलीमेट्री - साइबर धोखाधड़ी रुझान (2026)

हमारे एमएल स्कैन ने तीन प्रमुख खतरों की पहचान की है:

* **वेक्टर 1: आधार सक्षम भुगतान प्रणाली (AePS) क्लोनिंग**
  * बैंक खातों से अनधिकृत निकासी के लिए भूमि पंजीकरण पोर्टल से फिंगरप्रिंट क्लोन किए जा रहे हैं।
* **वेक्टर 2: फर्जी बिजली बिल डिस्कनेक्शन नोटिस**
  * डिस्कनेक्शन रोकने के लिए फर्जी नंबरों पर कॉल करने हेतु बल्क एसएमएस भेजे जा रहे हैं।
* **वेक्टर 3: एआई वॉयस क्लोनिंग घोटाले**
  * पारिवारिक आपात स्थिति का नाटक कर तत्काल यूपीआई ट्रांसफर मांगने हेतु आवाज क्लोन की जा रही है।

#### निवारक दिशानिर्देश:
जिला स्तरीय साइबर सुरक्षा जागरूकता सेमिनार आयोजित करें और क्षेत्रीय दूरसंचार प्रदाताओं के साथ ऑडिट समन्वय करें।`,

  "lead officer performance summary": `### एमपी पुलिस कमान - प्रमुख अधिकारियों का कार्यप्रदर्शन सारांश

अधिकारी प्रोफाइल विश्लेषण:

* **एसीपी राजेश्वरी एन. (बैज ACP88)**
  * प्रमुख क्षेत्र: साइबर अपराध एवं क्रिप्टोग्राफी
  * कार्यभार: अनुकूल (18 सक्रिय / 142 कुल)
  * मामले: 124 निस्तारित | सुलझाने की दर: **92%**
* **इंस्पेक्टर रवि कुमार (बैज IN74)**
  * प्रमुख क्षेत्र: नारकोटिक्स एवं फील्ड ऑपरेशंस
  * कार्यभार: उच्च (32 सक्रिय / 198 कुल)
  * मामले: 166 निस्तारित | सुलझाने की दर: **89%**
* **डीएसपी शरणप्पा के. (बैज DSP11)**
  * प्रमुख क्षेत्र: कॉर्पोरेट धोखाधड़ी एवं शेल जांच
  * कार्यभार: अनुकूल (14 सक्रिय / 215 कुल)
  * मामले: 201 निस्तारित | सुलझाने की दर: **95%**`,

  "district crime comparison": `### जिला अपराध तुलना: भोपाल और इंदौर

| मीट्रिक श्रेणी | भोपाल शहरी | इंदौर शहरी | अंतर (डेल्टा) |
| :--- | :--- | :--- | :--- |
| कुल पंजीकृत एफआईआर | 1,482 मामले | 1,398 मामले | +84 मामले |
| सक्रिय जांच | 148 मामले | 162 मामले | -14 मामले |
| चार्जशीट दर | 78% | 84% | +6% (इंदौर) |
| केस सुलझाने की सफलता दर | 82% | 88% | +6% (इंदौर) |`,

  "executive intelligence briefing": `### कार्यकारी खुफिया रिपोर्ट: गोपनीय

**जारीकर्ता**: एमपी पुलिस कमांड सेंटर एआई इंजन  
**प्राप्तकर्ता**: पुलिस महानिदेशक (DGP), मध्य प्रदेश  

#### 1. रणनीतिक सारांश
सभी जिलों में कुल पंजीकृत एफआईआर **14,832** मामले हैं। समग्र अपराध सुलझाने की दर **86.4%** दर्ज की गई है।

#### 2. मुख्य चेतावनी
* **साइबर फ़िशिंग में वृद्धि**: सीमा पार नेटवर्क से सिम स्वैपिंग घटनाओं में 12% की बढ़ोतरी।
* **मादक पदार्थ तस्करी**: प्रमुख पारगमन गलियारों में कड़ी निगरानी की आवश्यकता।

#### 3. रणनीतिक अनुशंसाएं
* साइबर सेल में अतिरिक्त फोरेंसिक इंस्पेक्टरों की प्रतिनियुक्ति करें।
* पारगमन चौकियों पर संयुक्त अंतर-एजेंसी अभियान संचालित करें।`,

  "dashboard evaluation": `एमपी पुलिस कमांड सेंटर डैशबोर्ड मूल्यांकन: सक्रिय सीसीटीएनएस केपीआई, पंजीकृत मामले, मासिक अपराध वक्र और हॉटस्पॉट प्रदर्शित करता है। स्वचालित रिपोर्ट के लिए 'अपराध', 'साइबर', या 'अधिकारी' जैसे कीवर्ड दर्ज करें।`,

  "cctns ai intelligence assistant": `सीसीटीएनएस एआई खुफिया सहायक: आपका अनुरोध संसाधित किया गया है। जिला अपराध प्रोफाइल और आंकड़ों के लिए कीवर्ड का उपयोग करें: 'हॉटस्पॉट', 'अधिकारी', या 'रुझान'।`,

  "highest number of reported crimes": `इस संभाग में सर्वाधिक अपराध मामले दर्ज किए गए हैं।`
};

const getTranslation = (text, lang) => {
  if (lang === "hi") {
    const normalized = text.toLowerCase();
    for (const [key, value] of Object.entries(translations)) {
      if (normalized.includes(key)) {
        return value;
      }
    }
    return `सहायक (अनुवाद): ${text}`;
  }
  return text;
};

const MessageBubble = ({ message }) => {
  const isOfficer = message.sender === "officer";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lang, setLang] = useState("en");

  const activeText = isOfficer ? message.text : getTranslation(message.text, lang);

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      window.speechSynthesis.cancel();
      const textToSpeak = activeText.replace(/[*#|:-]/g, " ");
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      
      if (lang === "hi") {
        utterance.lang = "hi-IN";
      } else {
        utterance.lang = "en-IN";
      }

      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    }
  };

  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const parseMarkdown = (text) => {
    const lines = text.split("\n");
    const elements = [];
    let tableRows = [];
    let inTable = false;

    const renderTable = (rows, key) => {
      if (rows.length === 0) return null;
      
      const headerCells = rows[0].split("|").map(c => c.trim()).filter(c => c);
      const bodyRows = rows.slice(2).map(r => r.split("|").map(c => c.trim()).filter(c => c));

      return (
        <div key={key} className="my-4 overflow-x-auto border border-slate-700/60 rounded-none bg-slate-950/70 shadow-inner">
          <table className="w-full text-left border-collapse font-mono text-[11px]">
            <thead>
              <tr className="border-b border-slate-700/60 bg-slate-900/80 text-slate-300 font-bold uppercase tracking-wider">
                {headerCells.map((cell, idx) => (
                  <th key={idx} className="py-3 px-5">{cell}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-900/40 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2.5 px-5">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    const parseBold = (str) => {
      const parts = str.split(/(\*\*.*?\*\*)/g);
      return parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) {
          return <strong key={i} className="text-white font-bold">{part.slice(2, -2)}</strong>;
        }
        return part;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes("|") && line.trim().startsWith("|")) {
        inTable = true;
        tableRows.push(line);
        continue;
      } else if (inTable) {
        elements.push(renderTable(tableRows, `table-${i}`));
        tableRows = [];
        inTable = false;
      }

      if (line.startsWith("###")) {
        elements.push(
          <h3 key={i} className="text-xs font-bold text-blue-400 tracking-wider font-mono uppercase mt-4 mb-2.5 border-b border-slate-800 pb-1.5 pl-1.5">
            {parseBold(line.replace("###", "").trim())}
          </h3>
        );
      } else if (line.startsWith("####")) {
        elements.push(
          <h4 key={i} className="text-[11px] font-bold text-slate-200 font-mono uppercase mt-3.5 mb-2 pl-1.5">
            {parseBold(line.replace("####", "").trim())}
          </h4>
        );
      } else if (line.startsWith("*") || line.startsWith("-")) {
        elements.push(
          <div key={i} className="flex items-start gap-3 pl-3 sm:pl-4 pr-2 text-xs leading-relaxed text-slate-300 my-1.5 font-sans">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            <span>{parseBold(line.substring(1).trim())}</span>
          </div>
        );
      } else if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.")) {
        elements.push(
          <div key={i} className="flex items-start gap-3 pl-3 sm:pl-4 pr-2 text-xs leading-relaxed text-slate-300 my-1.5 font-sans">
            <span className="font-mono text-blue-400 font-bold flex-shrink-0">{line.slice(0, 2)}</span>
            <span>{parseBold(line.substring(2).trim())}</span>
          </div>
        );
      } else if (line) {
        elements.push(
          <p key={i} className="text-xs leading-relaxed text-slate-300 my-2.5 pl-1.5 font-sans">
            {parseBold(line)}
          </p>
        );
      }
    }

    if (inTable && tableRows.length > 0) {
      elements.push(renderTable(tableRows, `table-end`));
    }

    return elements;
  };

  return (
    <div className={`flex gap-3.5 w-full max-w-3xl ${isOfficer ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
      
      {/* Icon Avatar */}
      <div className={`h-8 w-8 rounded-none flex items-center justify-center border flex-shrink-0 shadow-sm ${
        isOfficer 
          ? "bg-slate-900 border-slate-700/80 text-slate-300"
          : "bg-blue-600/10 border-blue-500/30 text-blue-400"
      }`}>
        {isOfficer ? <FaUser className="text-xs" /> : <FaBrain className="text-xs animate-pulse" />}
      </div>

      {/* Bubble text */}
      <div 
        className={`flex-1 border shadow-md font-sans rounded-none ${
          isOfficer 
            ? "bg-slate-900/85 border-slate-700/70 text-slate-200" 
            : "bg-slate-950/80 border-slate-700/70 text-slate-200"
        }`} 
        style={{ padding: "18px 22px" }}
      >
        <div className="flex items-center justify-between border-b border-slate-700/50 pb-2.5 mb-3 px-1 text-[10px] font-mono text-slate-400 tracking-wider">
          <span className="font-bold">{isOfficer ? "INVESTIGATING OFFICER" : "AI PLATFORM CONSOLE"}</span>
          <div className="flex items-center gap-2">
            {!isOfficer && (
              <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 rounded-none p-1 shadow-sm font-mono">
                <button
                  onClick={() => { setLang("en"); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                    lang === "en" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => { setLang("hi"); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                    lang === "hi" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  हिंदी
                </button>
              </div>
            )}
            {!isOfficer && (
              <button 
                onClick={handleSpeak}
                className="flex items-center justify-center p-1.5 rounded-none bg-slate-900 border border-slate-700/80 text-slate-300 hover:text-blue-400 hover:border-blue-500/50 transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
                title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
              >
                {isSpeaking ? <FaVolumeMute className="text-xs text-rose-400" /> : <FaVolumeUp className="text-xs text-blue-400" />}
              </button>
            )}
            <span className="text-[10px] font-mono text-slate-400">{new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}</span>
          </div>
        </div>
        <div className="space-y-1">
          {isOfficer ? (
            <p className="text-sm leading-relaxed font-sans font-medium pl-1">{message.text}</p>
          ) : (
            parseMarkdown(activeText)
          )}
        </div>
      </div>

    </div>
  );
};

export default MessageBubble;
