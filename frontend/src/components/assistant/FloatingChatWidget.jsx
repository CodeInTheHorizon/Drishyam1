import React, { useState, useEffect, useRef } from "react";
import { FaComments, FaTimes, FaPaperPlane, FaBrain, FaUser, FaTrash, FaTerminal, FaVolumeUp, FaVolumeMute } from "react-icons/fa";
import { assistantService } from "../../services/assistantService";

const translations = {
  "bengaluru city crime analytics summary": `### ಬೆಂಗಳೂರು ನಗರ ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ ಸಾರಾಂಶ (2026)

ಒಟ್ಟು ನೋಂದಾಯಿತ ಎಫ್‌ಐಆರ್ ಪ್ರಕರಣಗಳು: **1,482** (ವರ್ಷದಿಂದ ವರ್ಷಕ್ಕೆ **4.2%** ಹೆಚ್ಚಳ).

#### ಅಪರಾಧ ವಿಭಾಗಗಳ ವಿವರ:
1. **ಆಸ್ತಿ ಅಪರಾಧಗಳು**: 642 ಪ್ರಕರಣಗಳು (ಒಟ್ಟಾರೆಯಾಗಿ 43%) - ಪ್ರಮುಖ ಕಳವಳ: ರಾತ್ರಿ ಮನೆಗಳ್ಳತನ.
2. **ಸೈಬರ್ ಅಪರಾಧಗಳು**: 412 ಪ್ರಕರಣಗಳು (ಒಟ್ಟಾರೆಯಾಗಿ 28%) - ಪ್ರಮುಖ ಕಳವಳ: ಒಟಿಪಿ/ಸಿಮ್ ಸ್ವ್ಯಾಪ್ ವಂಚನೆ.
3. **ದೈಹಿಕ ಅಪರಾಧಗಳು**: 224 ಪ್ರಕರಣಗಳು (ಒಟ್ಟಾರೆಯಾಗಿ 15%) - ಪ್ರಮುಖ ಕಳವಳ: ವಾಣಿಜ್ಯ ವಲಯಗಳ ಹೊರಗೆ ಹಲ್ಲೆ.
4. **ಹಣಕಾಸು ವಂಚನೆ**: 142 ಪ್ರಕರಣಗಳು (ಒಟ್ಟಾರೆಯಾಗಿ 10%) - ಪ್ರಮುಖ ಕಳವಳ: ಶೆಲ್ ಕಂಪನಿ ಹೂಡಿಕೆ ವಂಚನೆ.

#### ಪ್ರಮುಖ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು:
* ಸೆಂಟ್ರಲ್ ಡಿವಿಷನ್ (31% ಘಟನೆಗಳು)
* ಈಸ್ಟ್ ಡಿವಿಷನ್ (24% ಘಟನೆಗಳು)
* ಸೌತ್-ಈಸ್ಟ್ ಡಿವಿಷನ್ (18% ಘಟನೆಗಳು)`,

  "karnataka high-risk districts": `### ಕರ್ನಾಟಕದ ಹೈ-ರಿಸ್ಕ್ ಜಿಲ್ಲೆಗಳು (GIS ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು)

ಜಿಐಎಸ್ ಇಂಟೆಲಿಜೆನ್ಸ್ ಟ್ರ್ಯಾಕರ್‌ನ ಸಕ್ರಿಯ ನಕ್ಷೆಗಳ ಆಧಾರದ ಮೇಲೆ:

| ಶ್ರೇಣಿ | ಜಿಲ್ಲಾ ವಲಯ | ಸಕ್ರಿಯ ಪ್ರಕರಣಗಳು | ಪ್ರಮುಖ ಬೆದರಿಕೆ | ಘಟನೆಯ ದರ |
| :--- | :--- | :--- | :--- | :--- |
| 1 | ಬೆಂಗಳೂರು ನಗರ | 642 ಪ್ರಕರಣಗಳು | ಸೈಬರ್ ಮತ್ತು ಆಸ್ತಿ ಅಪರಾಧಗಳು | ಹೆಚ್ಚು |
| 2 | ಮಂಗಳೂರು ನಗರ | 198 ಪ್ರಕರಣಗಳು | ಮಾದಕದ್ರವ್ಯ ಮತ್ತು ದೈಹಿಕ ಅಪರಾಧ | ಮಧ್ಯಮ-ಹೆಚ್ಚು |
| 3 | ಹುಬ್ಬಳ್ಳಿ-ಧಾರವಾಡ | 145 ಪ್ರಕರಣಗಳು | ಆಸ್ತಿ ಅಪರಾಧ ಮತ್ತು ಕಳ್ಳತನ | ಮಧ್ಯಮ |
| 4 | ಬೆಳಗಾವಿ ಜಿಲ್ಲೆ | 120 ಪ್ರಕರಣಗಳು | ಹಣಕಾಸು ವಂಚನೆ ಮತ್ತು ತಪಾಸಣೆ | ಮಧ್ಯಮ |

#### ಎಐ ಶಿಫಾರಸು:
ಬೆಂಗಳೂರು ಸೆಂಟ್ರಲ್ ವಿಭಾಗಕ್ಕೆ ಹೆಚ್ಚುವರಿ ಸೈಬರ್ ಗಸ್ತು ಸಂಪನ್ಮೂಲಗಳನ್ನು ನಿಯೋಜಿಸಿ ಮತ್ತು ಮಂಗಳೂರು ಸಾರಿಗೆ ಬಂದರುಗಳಲ್ಲಿ ಎನ್‌ಡಿಪಿಎಸ್ ತಪಾಸಣೆಯನ್ನು ಹೆಚ್ಚಿಸಿ.`,

  "cyber fraud trends": `### ಎಐ ಟೆಲಿಮೆಟ್ರಿ - ಸೈಬರ್ ವಂಚನೆ ಪ್ರವೃತ್ತಿಗಳು (2026)

ನಮ್ಮ ಎಂಎಲ್ ಸ್ಕ್ಯಾನ್‌ಗಳು ಮೂರು ಪ್ರಮುಖ ಬೆದರಿಕೆಗಳನ್ನು ಗುರುತಿಸಿವೆ:

* **ವೆಕ್ಟರ್ 1: ಆಧಾರ್ ಸಕ್ರಿಯಗೊಳಿಸಿದ ಪಾವತಿ ವ್ಯವಸ್ಥೆ (AePS) ಕ್ಲೋನ್‌ಗಳು**
  * ಬ್ಯಾಂಕ್ ಖಾತೆಗಳಿಂದ ಹಣವನ್ನು ಲೂಟಿ ಮಾಡಲು ಭೂ ನೋಂದಣಿ ಪೋರ್ಟಲ್‌ಗಳಿಂದ ಫಿಂಗರ್‌ಪ್ರಿಂಟ್‌ಗಳನ್ನು ಕ್ಲೋನ್ ಮಾಡಲಾಗುತ್ತಿದೆ.
* **ವೆಕ್ಟರ್ 2: ನಕಲಿ ವಿದ್ಯುತ್ ಬಿಲ್ ಸಂಪರ್ಕ ಕಡಿತ**
  * ಸಂಪರ್ಕ ಕಡಿತ ತಡೆಯಲು ನಕಲಿ ಸಂಖ್ಯೆಗಳಿಗೆ ಕರೆ ಮಾಡುವಂತೆ ಬೃಹತ್ ಎಸ್‌ಎಂಎಸ್ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ.
* **ವೆಕ್ಟರ್ 3: ಎಐ ಧ್ವನಿ ಕ್ಲೋನಿಂಗ್ ಹಗರಣಗಳು**
  * ಕುಟುಂಬದ ತುರ್ತು ಪರಿಸ್ಥಿತಿಯನ್ನು ಅನುಕರಿಸಿ ತಕ್ಷಣ ಯುಪಿಐ ವರ್ಗಾವಣೆಗೆ ವಿನಂತಿಸಲು ಧ್ವನಿ ಕ್ಲೋನ್ ಮಾಡಲಾಗುತ್ತಿದೆ.

#### ತಡೆಗಟ್ಟುವ ಮಾರ್ಗಸೂಚಿ:
ಜಿಲ್ಲಾ ಮಟ್ಟದ ಸೈಬರ್ ಭದ್ರತಾ ಜಾಗೃತಿ ಸೆಮಿನಾರ್‌ಗಳನ್ನು ನಡೆಸುವುದು ಮತ್ತು ಪ್ರಾದೇಶಿಕ ಟೆಲಿಕಾಂ ಪೂರೈಕೆದಾರರೊಂದಿಗೆ ಆಡಿಟ್‌ಗಳನ್ನು ಸಂಯೋಜಿಸುವುದು.`,

  "lead officer performance summary": `### ಕೆಎಸ್‌ಪಿ ಕಮಾಂಡ್ - ಪ್ರಮುಖ ಅಧಿಕಾರಿಗಳ ಕಾರ್ಯಕ್ಷಮತೆ ಸಾರಾಂಶ

ಅಧಿಕಾರಿಗಳ ಪ್ರೊಫೈಲ್ ವಿಶ್ಲೇಷಣೆ:

* **ಎಸಿಪಿ ರಾಜೇಶ್ವರಿ ಎನ್. (ಬ್ಯಾಡ್ಜ್ ACP88)**
  * ಪ್ರಮುಖ ಕ್ಷೇತ್ರ: ಸೈಬರ್ ಅಪರಾಧಗಳು ಮತ್ತು ಕ್ರಿಪ್ಟೋಗ್ರಫಿ
  * ಲೋಡ್: ಉತ್ತಮ (18 ಸಕ್ರಿಯ / 142 ಒಟ್ಟು)
  * ಪ್ರಕರಣಗಳು: 124 ಮುಚ್ಚಲಾಗಿದೆ | ಪತ್ತೆ ದರ: **92%**
* **ಇನ್ಸ್‌ಪೆಕ್ಟರ್ ರವಿ ಕುಮಾರ್ (ಬ್ಯಾಡ್ಜ್ IN74)**
  * ಪ್ರಮುಖ ಕ್ಷೇತ್ರ: ಮಾದಕದ್ರವ್ಯ ಮತ್ತು ಫೀಲ್ಡ್ ಕಾರ್ಯಾಚರಣೆಗಳು
  * ಲೋಡ್: ಹೆಚ್ಚು (32 ಸಕ್ರಿಯ / 198 ಒಟ್ಟು)
  * ಪ್ರಕರಣಗಳು: 166 ಮುಚ್ಚಲಾಗಿದೆ | ಪತ್ತೆ ದರ: **89%**
* **ಡಿವೈಎಸ್‌ಪಿ ಶರಣಪ್ಪ ಕೆ. (ಬ್ಯಾಡ್ಜ್ DSP11)**
  * ಪ್ರಮುಖ ಕ್ಷೇತ್ರ: ಕಾರ್ಪೊರೇಟ್ ವಂಚನೆ ಮತ್ತು ಶೆಲ್ ತಪಾಸಣೆ
  * ಲೋಡ್: ಉತ್ತಮ (14 ಸಕ್ರಿಯ / 215 ಒಟ್ಟು)
  * ಪ್ರಕರಣಗಳು: 201 ಮುಚ್ಚಲಾಗಿದೆ | ಪತ್ತೆ ದರ: **95%**`,

  "district crime comparison": `### ಜಿಲ್ಲಾ ಅಪರಾಧ ಹೋಲಿಕೆ: ಬೆಂಗಳೂರು ಮತ್ತು ಮಂಗಳೂರು

| ಮೆಟ್ರಿಕ್ ವರ್ಗ | ಬೆಂಗಳೂರು ನಗರ | ಮಂಗಳೂರು ನಗರ | ವ್ಯತ್ಯಾಸ (ಡೆಲ್ಟಾ) |
| :--- | :--- | :--- | :--- |
| ಒಟ್ಟು ನೋಂದಾಯಿತ ಎಫ್‌ಐಆರ್‌ಗಳು | 1,482 ಪ್ರಕರಣಗಳು | 398 ಪ್ರಕರಣಗಳು | +1,084 ಪ್ರಕರಣಗಳು |
| ಸಕ್ರಿಯ ತನಿಖೆಗಳು | 148 ಪ್ರಕರಣಗಳು | 62 ಪ್ರಕರಣಗಳು | +86 ಪ್ರಕರಣಗಳು |
| ಚಾರ್ಜ್ ಶೀಟ್ ದರ | 78% | 84% | +6% (ಮಂಗಳೂರು) |
| ಪತ್ತೆ ಯಶಸ್ಸಿನ ಅನುಪಾತ | 82% | 88% | +6% (ಮಂಗಳೂರು) |`,

  "executive intelligence briefing": `### ಕಾರ್ಯನಿರ್ವಾಹಕ ಗುಪ್ತಚರ ವರದಿ: ಗೌಪ್ಯ

**ಜಾರಿಗೊಳಿಸಿದವರು**: ಕೆಎಸ್‌ಪಿ ಕಮಾಂಡ್ ಸೆಂಟರ್ ಎಐ ಎಂಜಿನ್  
**ಸ್ವೀಕೃತದಾರರು**: ಮಹಾನಿರ್ದೇಶಕರು ಮತ್ತು ಪೊಲೀಸ್ ಮಹಾನಿರೀಕ್ಷಕರು (DG&IGP), ಕರ್ನಾಟಕ  

#### 1. ಕಾರ್ಯತಂತ್ರದ ಸಾರಾಂಶ
ಎಲ್ಲಾ 31 ಜಿಲ್ಲೆಗಳಲ್ಲಿ ಒಟ್ಟು ನೋಂದಾಯಿತ ಎಫ್‌ಐಆರ್‌ಗಳು **14,832** ಪ್ರಕರಣಗಳಾಗಿವೆ. ಒಟ್ಟಾರೆ ಅಪರಾಧ ಪತ್ತೆ ದರವು **86.4%** ನಷ್ಟಿದೆ.

#### 2. ಪ್ರಮುಖ ಬೆದರಿಕೆ ಎಚ್ಚರಿಕೆ
* **ಸೈಬರ್ ಫಿಶಿಂಗ್ ಹೆಚ್ಚಳ**: ಗಡಿಯಾಚೆಗಿನ ಸೆಲ್‌ಗಳಿಂದ ಸಿಮ್ ಸ್ವ್ಯಾಪಿಂಗ್ ಘಟನೆಗಳಲ್ಲಿ 12% ಏರಿಕೆ.
* **ಮಾದಕದ್ರವ್ಯ ಸಾಗಣೆ**: ಮಂಗಳೂರು ಕರಾವಳಿ ಸಾರಿಗೆ ವಲಯಗಳಲ್ಲಿ ಹೆಚ್ಚಿನ ಕಣ್ಗಾವಲು ಅಗತ್ಯವಿದೆ.

#### 3. ಕಾರ್ಯತಂತ್ರದ ಶಿಫಾರಸುಗಳು
* ಬೆಂಗಳೂರು ಸೆಂಟ್ರಲ್‌ಗೆ 4 ಹೆಚ್ಚುವರಿ ಸೈಬರ್ ವಿಧಿವಿಜ್ಞಾನ ಇನ್ಸ್‌ಪೆಕ್ಟರ್‌ಗಳನ್ನು ನಿಯೋಜಿಸಿ.
* ಮಂಗಳೂರು ಸಾರಿಗೆ ವಲಯಗಳಲ್ಲಿ ಜಂಟಿ ಸಂಸ್ಥೆ ಕಾರ್ಯಾಚರಣೆಗಳನ್ನು ನಡೆಸಿ.`,

  "dashboard evaluation": `ಕೆಎಸ್‌ಪಿ ಕಮಾಂಡ್ ಸೆಂಟರ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ಮೌಲ್ಯಮಾಪನ: ಸಕ್ರಿಯ ಸಿಸಿಟಿಎನ್‌ಎಸ್ ಕೆಪಿಐಗಳು, ನೋಂದಾಯಿತ ಪ್ರಕರಣಗಳು, ಮಾಸಿಕ ಅಪರಾಧ ವಕ್ರಾಕೃತಿಗಳು ಮತ್ತು ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳನ್ನು ಪ್ರದರ್ಶಿಸುತ್ತದೆ. ಸ್ವಯಂಚಾಲಿತ ವರದಿಗಳಿಗಾಗಿ 'ಬೆಂಗಳೂರು', 'ಸೈಬರ್', ಅಥವಾ 'ಅಧಿಕಾರಿಗಳು' ನಂತಹ ಕೀವರ್ಡ್‌ಗಳನ್ನು ನಮೂದಿಸಿ.`,

  "cctns ai intelligence assistant": `ಸಿಸಿಟಿಎನ್‌ಎಸ್ ಎಐ ಗುಪ್ತಚರ ಸಹಾಯಕ: ನಿಮ್ಮ ವಿನಂತಿಯನ್ನು ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗಿದೆ. ಜಿಲ್ಲಾ ಅಪರಾಧ ಪ್ರೊಫೈಲ್ ಮತ್ತು ಅಂಕಿಅಂಶಗಳಿಗಾಗಿ ಕೀವರ್ಡ್‌ಗಳನ್ನು ಬಳಸಿ: 'ಬೆಂಗಳೂರು', 'ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳು', 'ಅಧಿಕಾರಿಗಳು', ಅಥವಾ 'ಪ್ರವೃತ್ತಿಗಳು'.`,

  "highest number of reported crimes": `ಬೆಂಗಳೂರು ನಗರ ಜಿಲ್ಲೆಯು ಅತ್ಯಧಿಕ ಅಪರಾಧ ಪ್ರಕರಣಗಳನ್ನು ಹೊಂದಿದೆ.`
};

const getTranslation = (text, lang) => {
  if (lang === "kn") {
    const normalized = text.toLowerCase();
    for (const [key, value] of Object.entries(translations)) {
      if (normalized.includes(key)) {
        return value;
      }
    }
    return `ಸಹಾಯಕ (ಅನುವಾದ): ${text}`;
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
      
      if (lang === "kn") {
        utterance.lang = "kn-IN";
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
                  onClick={() => { setLang("kn"); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
                  className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded transition-all cursor-pointer ${
                    lang === "kn" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  ಕನ್ನಡ
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
      text: "👋 Welcome to KSP AI Platform. I am your Intelligence Copilot.\n\nAsk me about case files, officer performance, hotspots, or regional crime trends."
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
        text: "Conversation cleared. How can I assist you now with KSP intelligence?"
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
    { label: "Bengaluru Crime Summary", query: "Summarize crimes in Bengaluru City" },
    { label: "High-Risk Districts", query: "Show high-risk districts" },
    { label: "Cyber Fraud Trends", query: "Explain recent cyber fraud trends" },
    { label: "Officer Profiles", query: "Generate officer performance summary" }
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
                <div className="text-[11px] font-bold text-white tracking-wider">KSP CO-PILOT</div>
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
