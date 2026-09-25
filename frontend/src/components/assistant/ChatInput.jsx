import React, { useState, useRef, useEffect } from "react";
import { FaPaperPlane, FaMicrophone, FaStop, FaTrash } from "react-icons/fa";
import { RiRobot2Fill } from "react-icons/ri";

const ChatInput = ({ onSend, onClear, disabled }) => {
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-IN"); // 'en-IN' (English) or 'kn-IN' (Kannada)
  const recognitionRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = voiceLang;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setText(transcript);
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
            textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 140) + "px";
          }
        }
      };

      recognition.onerror = (err) => {
        console.error("Speech recognition error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    onSend(text.trim());
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInput = (e) => {
    setText(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 140) + "px";
    }
  };

  const canSend = text.trim() && !disabled;

  return (
    <div
      className="flex-shrink-0"
      style={{
        padding: "16px 24px 18px",
        borderTop: "1px solid rgba(51,65,85,0.3)",
        background: "rgba(6,13,26,0.7)",
      }}
    >
      {/* Status row */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <RiRobot2Fill className="text-xs text-blue-400" />
            <span className="text-xs font-semibold text-slate-400 font-inter">KSP AI Copilot</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-400/90 font-inter font-medium">CCTNS Live Connected</span>
          </div>
        </div>

        {/* Voice Language Toggle */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-none p-1">
          <span className="text-[10px] font-mono text-slate-400 px-1.5">Mic Lang:</span>
          <button
            type="button"
            onClick={() => setVoiceLang("en-IN")}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-none transition-colors cursor-pointer ${
              voiceLang === "en-IN" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setVoiceLang("kn-IN")}
            className={`px-2 py-0.5 text-[10px] font-bold rounded-none transition-colors cursor-pointer ${
              voiceLang === "kn-IN" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
            }`}
          >
            ಕನ್ನಡ
          </button>
        </div>
      </div>

      {/* Listening Status Banner */}
      {isListening && (
        <div className="mb-2.5 flex items-center gap-2 px-3.5 py-2 rounded-none bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-inter animate-pulse">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
          <span>Listening ({voiceLang === "kn-IN" ? "ಕನ್ನಡ Voice Input" : "English Voice Input"})... Speak now</span>
        </div>
      )}

      {/* Input container */}
      <form onSubmit={handleSubmit}>
        <div
          className="flex items-end gap-3 rounded-none transition-all duration-200"
          style={{
            padding: "12px 18px",
            background: "rgba(15,23,42,0.9)",
            border: `1px solid ${canSend ? "rgba(37,99,235,0.6)" : "rgba(71,85,105,0.5)"}`,
          }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            rows={1}
            value={text}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              voiceLang === "kn-IN"
                ? "ಕನ್ನಡದಲ್ಲಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಪ್ರಶ್ನೆ ಕೇಳಿ..."
                : "Ask about crimes, FIR records, officers, district stats…"
            }
            className="flex-1 bg-transparent text-[13.5px] text-white placeholder-slate-400 focus:outline-none resize-none font-sans leading-relaxed pl-2 pr-2"
            style={{
              minHeight: 40,
              maxHeight: 140,
              padding: "4px 0",
              scrollbarWidth: "none",
            }}
          />

          {/* Action buttons */}
          <div className="flex items-center gap-2 flex-shrink-0 pb-0.5 pr-1">
            {/* Voice Input Mic Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-2.5 rounded-none transition-all cursor-pointer ${
                isListening
                  ? "bg-rose-600 text-white shadow-lg shadow-rose-600/50 animate-pulse"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
              title={isListening ? "Stop Voice Input" : `Speak in ${voiceLang === "kn-IN" ? "ಕನ್ನಡ" : "English"}`}
            >
              {isListening ? <FaStop className="text-sm" /> : <FaMicrophone className="text-sm" />}
            </button>

            <button
              type="button"
              onClick={onClear}
              className="p-2.5 rounded-none text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
              title="Clear conversation"
            >
              <FaTrash className="text-sm" />
            </button>

            {/* Send */}
            <button
              type="submit"
              disabled={!canSend}
              className="flex items-center gap-2 rounded-none px-4 py-2.5 text-xs font-bold font-mono uppercase tracking-wider transition-all duration-150 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: canSend
                  ? "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)"
                  : "rgba(51,65,85,0.5)",
                color: "white",
                border: "none",
                boxShadow: canSend ? "0 4px 16px rgba(37,99,235,0.3)" : "none",
              }}
            >
              <FaPaperPlane className="text-xs" />
              <span>Send</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default ChatInput;
