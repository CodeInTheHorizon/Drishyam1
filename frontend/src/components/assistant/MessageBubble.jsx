import React, { useState, useEffect } from "react";
import { FaUser, FaBrain, FaVolumeUp, FaVolumeMute } from "react-icons/fa";

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
                  onClick={() => { setLang("kn"); window.speechSynthesis.cancel(); setIsSpeaking(false); }}
                  className={`px-2.5 py-0.5 text-[10px] font-bold rounded-none transition-all cursor-pointer ${
                    lang === "kn" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400 hover:text-white"
                  }`}
                >
                  ಕನ್ನಡ
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
