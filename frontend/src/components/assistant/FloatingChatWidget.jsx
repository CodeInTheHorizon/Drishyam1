import React, { useState, useEffect, useRef } from "react";
import { FaComments, FaTimes, FaPaperPlane, FaBrain, FaUser, FaTrash, FaTerminal, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { assistantService } from "../../services/assistantService";

const translations = {
  "bhopal / indore crime analytics summary": `### भोपाल / इंदौर नगर अपराध विश्लेषण सारांश (2026)

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

* **एसपी कार्तिक सिंघल (बैज SP01)**
  * प्रमुख क्षेत्र: साइबर अपराध एवं क्रिप्टोग्राफी
  * कार्यभार: अनुकूल (18 सक्रिय / 142 कुल)
  * मामले: 124 निस्तारित | सुलझाने की दर: **94%**
* **डीएसपी मेधावी अग्रवाल (बैज DSP24)**
  * प्रमुख क्षेत्र: आर्थिक अपराध एवं फील्ड ऑपरेशंस
  * कार्यभार: संतुलित (14 सक्रिय / 198 कुल)
  * मामले: 166 निस्तारित | सुलझाने की दर: **91%**
* **निरीक्षक हितेश संघी (बैज IN74)**
  * प्रमुख क्षेत्र: संपत्ति अपराध एवं जांच
  * कार्यभार: अनुकूल (12 सक्रिय / 115 कुल)
  * मामले: 101 निस्तारित | सुलझाने की दर: **88%**`,

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

const FloatingMessageBubble = ({ msg, parseMarkdown }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lang, setLang] = useState("en");
  const isOfficer = msg.sender === "officer";

  const activeText = isOfficer ? msg.text : getTranslation(msg.text, lang);

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

  return (
    <div 
      className={`flex gap-2.5 max-w-[85%] ${
        isOfficer ? "ml-auto flex-row-reverse" : "mr-auto"
      }`}
    >
      {/* Avatar Icon */}
      <div className={`h-6 w-6 rounded flex items-center justify-center border flex-shrink-0 text-[10px] ${
        isOfficer 
          ? "bg-slate-900 border-slate-800 text-slate-400"
          : "bg-blue-600/10 border-blue-500/30 text-blue-400"
      }`}>
        {isOfficer ? <FaUser /> : <FaTerminal />}
      </div>

      {/* Message Bubble */}
      <div className={`rounded-xl border p-2.5 shadow-sm text-[10px] ${
        isOfficer
          ? "bg-slate-900/80 border-slate-800 text-slate-200"
          : "bg-slate-950/80 border-slate-900 text-slate-350"
      }`}>
        <div className="flex items-center justify-between border-b border-slate-900/20 pb-0.5 mb-1 text-[7px] text-slate-500 tracking-wider">
          <span>{isOfficer ? "OFFICER CONSOLE" : "AI ENGINE OUT"}</span>
          <div className="flex items-center gap-1.5 ml-2">
            {!isOfficer && (
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800/90 rounded-md p-0.5 shadow-sm">
                <button
                  onClick={() => { setLang("en"); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
                  className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded transition-all cursor-pointer ${
                    lang === "en" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  EN
                </button>
                <button
                  onClick={() => { setLang("hi"); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
                  className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded transition-all cursor-pointer ${
                    lang === "hi" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  हिंदी
                </button>
              </div>
            )}
            {!isOfficer && (
              <button 
                onClick={handleSpeak}
                className="flex items-center justify-center p-1.5 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-blue-400 hover:border-blue-500/50 transition-all cursor-pointer shadow-sm active:scale-95 ml-1"
                title={isSpeaking ? "Stop Speaking" : "Read Aloud"}
              >
                {isSpeaking ? <FaVolumeMute className="text-xs text-rose-400" /> : <FaVolumeUp className="text-xs text-blue-400" />}
              </button>
            )}
          </div>
        </div>
        <div className="space-y-1">
          {isOfficer ? (
            <p className="leading-relaxed font-sans">{msg.text}</p>
          ) : (
            parseMarkdown(activeText)
          )}
        </div>
      </div>
    </div>
  );
};

const FloatingChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "👋 Welcome to MP Police AI Platform. I am your Intelligence Copilot.\n\nAsk me about case files, officer performance, hotspots, or regional crime trends."
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef(null);

  // Auto-scroll to the bottom of the chat window
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText.trim();
    if (!text) return;

    if (!textToSend) {
      setInputText("");
    }

    // Add user message
    setMessages((prev) => [...prev, { sender: "officer", text }]);
    setIsTyping(true);

    try {
      // Query the backend function (via Vite dev server proxy)
      const reply = await assistantService.queryAssistant(text);
      setMessages((prev) => [...prev, { sender: "assistant", text: reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { 
          sender: "assistant", 
          text: "⚠️ **System Offline:** Failed to connect to local Catalyst gateway. Verify that the server is running." 
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        sender: "assistant",
        text: "Conversation cleared. How can I assist you now with MP Police intelligence?"
      }
    ]);
  };

  // Light-weight custom parser to format mock markdown responses into clean React nodes
  const parseMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split("\n");
    const elements = [];
    let tableRows = [];
    let inTable = false;

    const renderTable = (rows, key) => {
      if (rows.length === 0) return null;
      const headerCells = rows[0].split("|").map(c => c.trim()).filter(c => c);
      const bodyRows = rows.slice(2).map(r => r.split("|").map(c => c.trim()).filter(c => c));

      return (
        <div key={key} className="my-2 overflow-x-auto border border-slate-800/80 rounded-lg bg-slate-950/60 shadow-inner max-w-full">
          <table className="w-full text-left border-collapse font-mono text-[9px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60 text-slate-400 font-bold uppercase">
                {headerCells.map((h, idx) => (
                  <th key={idx} className="py-1.5 px-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/40 text-slate-300">
              {bodyRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-900/20">
                  {row.map((cell, cidx) => (
                    <td key={cidx} className="py-1.5 px-3">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    };

    const parseBold = (str) => {
      const parts = str.split("**");
      return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-white font-bold">{part}</strong> : part);
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (line.startsWith("|")) {
        inTable = true;
        tableRows.push(line);
        continue;
      }

      if (inTable && !line.startsWith("|")) {
        elements.push(renderTable(tableRows, `table-${i}`));
        tableRows = [];
        inTable = false;
      }

      if (line.startsWith("###")) {
        elements.push(
          <h3 key={i} className="text-[10px] font-bold text-blue-400 font-mono uppercase mt-3 mb-1 border-b border-slate-800 pb-0.5">
            {parseBold(line.replace("###", "").trim())}
          </h3>
        );
      } else if (line.startsWith("####")) {
        elements.push(
          <h4 key={i} className="text-[9px] font-bold text-slate-200 font-mono uppercase mt-2 mb-1">
            {parseBold(line.replace("####", "").trim())}
          </h4>
        );
      } else if (line.startsWith("*") || line.startsWith("-")) {
        elements.push(
          <div key={i} className="flex items-start gap-1.5 pl-1 text-[10px] text-slate-300 my-0.5 font-sans leading-relaxed">
            <span className="h-1 w-1 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
            <span>{parseBold(line.substring(1).trim())}</span>
          </div>
        );
      } else if (line) {
        elements.push(
          <p key={i} className="text-[10px] leading-relaxed text-slate-400 my-1 font-sans">
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

  const suggestions = [
    { label: "Bhopal vs Indore Crime", query: "Summarize crime distribution across Bhopal & Indore" },
    { label: "MP Crime Hotspots", query: "Show high-risk crime hotspots and patrol deployment zones" },
    { label: "Cyber Fraud Vectors", query: "Explain recent cyber fraud vectors and prevention roadmap" },
    { label: "Officer Performance", query: "Evaluate officer caseload and investigation clearance rates" },
    { label: "DGP Executive Brief", query: "Draft an executive crime briefing for DGP" }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono">
      {/* Floating Chat Box Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 w-[350px] sm:w-[400px] h-[550px] bg-slate-950/95 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-fade-in transition-all duration-300">
          
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-6 w-6 rounded bg-blue-600/10 border border-blue-500/30 flex items-center justify-center text-blue-400 animate-pulse">
                <FaBrain className="text-[10px]" />
              </div>
              <div>
                <div className="text-[11px] font-bold text-white tracking-wider">MP POLICE CO-PILOT</div>
                <div className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">AI Tactical Node</div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={clearChat}
                title="Clear conversation"
                className="text-slate-500 hover:text-rose-400 transition-colors p-1"
              >
                <FaTrash className="text-[10px]" />
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-500 hover:text-white transition-colors p-1"
              >
                <FaTimes className="text-[12px]" />
              </button>
            </div>
          </div>

          {/* Messages Container */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-slate-850">
            {messages.map((msg, index) => (
              <FloatingMessageBubble key={index} msg={msg} parseMarkdown={parseMarkdown} />
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex gap-2.5 max-w-[85%] mr-auto">
                <div className="h-6 w-6 rounded flex items-center justify-center bg-blue-600/10 border border-blue-500/30 text-blue-400 flex-shrink-0 text-[10px]">
                  <div className="h-2 w-2 rounded-full border border-slate-800 border-t-blue-500 animate-spin" />
                </div>
                <div className="rounded-xl border border-slate-900 p-2.5 bg-slate-950/80 text-slate-500 text-[8px] tracking-wider uppercase animate-pulse">
                  Querying CCTNS analytics...
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Quick suggestions wrapper */}
          <div className="px-4 py-2 border-t border-slate-900/60 bg-slate-950/50 flex flex-wrap gap-1.5 overflow-x-auto select-none">
            {suggestions.map((sug, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sug.query)}
                className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800/80 text-slate-400 hover:text-white rounded text-[8px] font-sans transition-all active:scale-95 whitespace-nowrap"
              >
                {sug.label}
              </button>
            ))}
          </div>

          {/* Input Panel */}
          <div className="p-3 border-t border-slate-900 bg-slate-950 flex items-center gap-2">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Ask copilot..."
              className="flex-1 max-h-16 min-h-[36px] bg-slate-900/60 border border-slate-800/80 focus:border-blue-500/50 rounded-lg px-3 py-1.5 text-[10px] text-slate-200 outline-none placeholder-slate-600 resize-none font-sans scrollbar-none"
            />
            <button
              onClick={() => handleSend()}
              className="h-8 w-8 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white flex items-center justify-center rounded-lg shadow-lg hover:shadow-blue-500/20 transition-all flex-shrink-0"
            >
              <FaPaperPlane className="text-[10px]" />
            </button>
          </div>

        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Open AI Command Copilot"
        className={`h-12 w-12 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 flex items-center justify-center text-white shadow-[0_0_15px_rgba(37,99,235,0.4)] hover:shadow-[0_0_25px_rgba(37,99,235,0.6)] border border-blue-500/20 transform transition-all duration-300 hover:scale-105 active:scale-95 ${
          isOpen ? "rotate-90 bg-rose-600 hover:bg-rose-500 shadow-rose-500/40" : ""
        }`}
      >
        {isOpen ? (
          <FaTimes className="text-base" />
        ) : (
          <FaComments className="text-base animate-pulse" />
        )}
      </button>
    </div>
  );
};

export default FloatingChatWidget;
