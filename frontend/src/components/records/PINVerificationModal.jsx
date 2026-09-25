import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  FaTimes,
  FaLock,
  FaExclamationCircle,
  FaCheckCircle
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";

const PINVerificationModal = ({ isOpen, onClose, onSuccess, actionTitle = "Manage Record Action" }) => {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef(null);
  const { verifyPin } = useAuth();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError("");
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleInputChange = (e) => {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setPin(val);
    if (error) setError("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSubmit(e);
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    if (!pin.trim()) {
      setError("Please enter your security PIN.");
      inputRef.current?.focus();
      return;
    }

    const isValid = verifyPin(pin);

    if (isValid) {
      onSuccess();
      onClose();
    } else {
      setError("Incorrect PIN. Authorization failed.");
      setPin("");
      inputRef.current?.focus();
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in">
      {/* Click outside to close backdrop */}
      <div className="fixed inset-0 -z-10" onClick={onClose} />

      {/* Centered Security Modal Card */}
      <div 
        className="w-full max-w-[420px] mx-auto rounded-xl border border-slate-700/70 bg-slate-900 shadow-2xl shadow-black relative overflow-hidden font-jakarta text-center animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Line */}
        <div className="h-1 w-full bg-blue-500" />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          title="Close"
        >
          <FaTimes className="text-sm" />
        </button>

        <div className="p-7 sm:p-8 flex flex-col items-center justify-center space-y-6">
          
          {/* Centered Header & Icon */}
          <div className="flex flex-col items-center justify-center text-center space-y-3 w-full">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 shadow-inner">
              <FaLock className="text-xl" />
            </div>

            <div className="w-full flex flex-col items-center justify-center text-center">
              <h3 className="text-lg font-bold text-white tracking-tight text-center w-full">
                Security Authorization
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed text-center w-full px-2">
                Enter your officer PIN to authorize <span className="text-slate-200 font-medium">"{actionTitle}"</span>
              </p>
            </div>
          </div>

          {/* Centered Error Message */}
          {error && (
            <div className="w-full p-3 rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-center justify-center gap-2 animate-fade-in text-center">
              <FaExclamationCircle className="text-sm flex-shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Centered Digit Slots Display */}
          <div className="w-full flex flex-col items-center justify-center space-y-4">
            <div 
              onClick={() => inputRef.current?.focus()}
              className="flex items-center justify-center gap-3 cursor-pointer py-1"
            >
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                const isCurrent = pin.length === idx;

                return (
                  <div
                    key={idx}
                    className={`h-14 w-12 rounded-lg border flex items-center justify-center transition-all duration-150 ${
                      isFilled
                        ? "bg-slate-950 border-blue-500 text-white font-mono text-xl shadow-[0_0_12px_rgba(59,130,246,0.25)]"
                        : isCurrent
                        ? "bg-slate-950/80 border-blue-400/80 ring-2 ring-blue-500/30"
                        : "bg-slate-950/50 border-slate-800 text-slate-600"
                    }`}
                  >
                    {isFilled ? (
                      <span className="h-3 w-3 rounded-full bg-blue-400 shadow-sm" />
                    ) : (
                      <span className="text-xs text-slate-600 font-mono">•</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Hidden Input that captures all typing */}
            <input
              ref={inputRef}
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="opacity-0 absolute -z-10 pointer-events-none"
              autoFocus
            />

            <p className="text-[11px] text-center text-slate-400">
              Default system PIN is <code className="text-blue-400 font-mono font-semibold bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800">1122</code>
            </p>
          </div>

          {/* Centered Action Buttons */}
          <div className="w-full grid grid-cols-2 gap-3.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 rounded-lg border border-slate-700/80 bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold tracking-wide transition-all cursor-pointer flex items-center justify-center"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="h-11 rounded-lg bg-blue-600 hover:bg-blue-500 active:scale-[0.98] text-white text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-600/25 border-none"
            >
              <FaCheckCircle className="text-xs" /> Authorize
            </button>
          </div>

        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PINVerificationModal;
