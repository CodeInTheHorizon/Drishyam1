import React, { useState } from "react";
import { FaTimes, FaPrint, FaShieldAlt, FaUserCheck, FaMapMarkerAlt, FaFileContract, FaCheckCircle, FaFileAlt, FaExpand } from "react-icons/fa";

const FIRDetailModal = ({ isOpen, onClose, record, onToggleStatus }) => {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!isOpen || !record) return null;

  const isClosed = record.status === "Case Closed / Completed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-3xl rounded-sm border border-slate-700/60 bg-slate-950 shadow-2xl overflow-hidden my-8 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-sm bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FaShieldAlt className="text-base" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-mono font-bold text-white tracking-wider uppercase">
                  FIR RECORD: {record.crimeNo}
                </h2>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-sm border uppercase ${
                  isClosed
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30"
                }`}>
                  {record.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Karnataka State Police • CCTNS IIF-1 Official Log
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="text-slate-400 hover:text-white p-2 transition-colors rounded-sm hover:bg-slate-800 cursor-pointer"
              title="Print Dossier"
            >
              <FaPrint className="text-sm" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 transition-colors rounded-sm hover:bg-slate-800 cursor-pointer"
            >
              <FaTimes className="text-base" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6 text-xs">
          
          {/* Top Summary Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/60 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Registration Date</span>
              <span className="text-slate-200 font-bold">{record.regDate}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">District Range</span>
              <span className="text-slate-200 font-bold">{record.district}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Police Station</span>
              <span className="text-slate-200 font-bold">{record.unit}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 uppercase block">Severity Level</span>
              <span className={`font-bold ${
                record.severity === "CRITICAL" ? "text-rose-400" :
                record.severity === "HIGH" ? "text-amber-400" : "text-blue-400"
              }`}>{record.severity}</span>
            </div>
          </div>

          {/* Section 1: Offence Details */}
          <div className="space-y-3">
            <h3 className="font-mono font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1">
              <FaFileContract /> 1. Offence & Act Sections
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/40 p-3.5 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-slate-500 font-mono block">Major Crime Head:</span>
                <span className="text-slate-200 font-semibold">{record.crimeHead}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">Sub-head / MO:</span>
                <span className="text-slate-200 font-semibold">{record.crimeSubHead || "N/A"}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">Act & Sections:</span>
                <span className="text-purple-300 font-mono font-bold">{record.actSections}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">Cognizable Type:</span>
                <span className="text-slate-200">{record.cognizableType}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Complainant & Location */}
          <div className="space-y-3">
            <h3 className="font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1">
              <FaUserCheck /> 2. Complainant & Incident Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/40 p-3.5 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-slate-500 font-mono block">Complainant Name:</span>
                <span className="text-slate-200 font-semibold">{record.complainantName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">Phone Number:</span>
                <span className="text-slate-200 font-mono">{record.complainantPhone || "N/A"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-mono block">Complainant Address:</span>
                <span className="text-slate-300">{record.complainantAddress || "N/A"}</span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-500 font-mono block">Incident Site Address:</span>
                <span className="text-slate-200 font-semibold">{record.locationStreet}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">GIS Coordinates:</span>
                <span className="text-slate-400 font-mono">Lat: {record.lat}, Lng: {record.lng}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Allotted Officer & Accused */}
          <div className="space-y-3">
            <h3 className="font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1">
              <FaMapMarkerAlt /> 3. Allotted Officer & Suspect Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900/40 p-3.5 rounded-lg border border-slate-800/80">
              <div>
                <span className="text-slate-500 font-mono block">Investigating Officer:</span>
                <span className="text-slate-200 font-bold">{record.allottedOfficerName} ({record.allottedOfficerRank})</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">Officer KGID:</span>
                <span className="text-slate-300 font-mono">{record.allottedOfficerKgid}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">Primary Accused:</span>
                <span className="text-slate-200 font-semibold">{record.accusedName}</span>
              </div>
              <div>
                <span className="text-slate-500 font-mono block">Apprehension Status:</span>
                <span className="text-amber-400 font-mono font-bold">{record.accusedStatus}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Narrative Facts & Property */}
          <div className="space-y-3">
            <h3 className="font-mono font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1">
              4. Chronological Brief Facts & Property Seizure
            </h3>
            <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800/80 space-y-3 font-sans">
              <div>
                <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">Brief Facts Narrative:</span>
                <p className="text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded border border-slate-900">
                  {record.briefFacts}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block">Stolen / Seized Items:</span>
                  <span className="text-slate-300">{record.propertyDescription || "None"}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Estimated Valuation:</span>
                  <span className="text-emerald-400 font-bold">₹ {Number(record.estimatedValue || 0).toLocaleString("en-IN")}</span>
                </div>
              </div>

              {record.resolutionNotes && (
                <div className="border-t border-slate-800/80 pt-2 font-mono">
                  <span className="text-slate-500 text-[10px] uppercase block mb-1">Disposal / Resolution Notes:</span>
                  <p className="text-emerald-300 bg-emerald-950/20 p-2.5 rounded border border-emerald-900/40">
                    {record.resolutionNotes}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Section 5: Written Official Report Document */}
          <div className="space-y-3">
            <h3 className="font-mono font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-1">
              <FaFileAlt /> 5. Official Written Report Scanned Document / Photo
            </h3>
            <div className="bg-slate-900/40 p-4 rounded-lg border border-slate-800/80 space-y-2">
              {record.officialReportImage ? (
                <div className="space-y-2">
                  <div className="relative group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-56 flex items-center justify-center">
                    <img
                      src={record.officialReportImage}
                      alt="Official Written Report Scanned Copy"
                      className="w-full h-56 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setIsLightboxOpen(true)}
                    />
                    <button
                      type="button"
                      onClick={() => setIsLightboxOpen(true)}
                      className="absolute bottom-3 right-3 bg-slate-950/80 border border-slate-700 text-white text-xs font-mono px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-lg"
                    >
                      <FaExpand /> Inspect Full Resolution Document
                    </button>
                  </div>
                  <p className="text-[10px] font-mono text-slate-500 text-center">
                    Click image or 'Inspect Full Resolution Document' to view high-resolution scan.
                  </p>
                </div>
              ) : (
                <div className="text-center py-6 text-slate-500 font-mono text-xs space-y-1">
                  <FaFileAlt className="text-2xl text-slate-600 mx-auto" />
                  <p>No official written report document photo attached to this record.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Lightbox Fullscreen Document Viewer */}
        {isLightboxOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
            <div className="relative max-w-4xl max-h-[90vh] w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl p-4 flex flex-col items-center">
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
                <span className="font-mono text-xs font-bold text-white uppercase">
                  Official Written Report Scan • FIR {record.crimeNo}
                </span>
                <button
                  onClick={() => setIsLightboxOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <FaTimes className="text-base" />
                </button>
              </div>
              <div className="overflow-auto max-h-[75vh] w-full flex justify-center">
                <img
                  src={record.officialReportImage}
                  alt="Full Resolution Official Report"
                  className="max-w-full max-h-full object-contain rounded-lg border border-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={() => onToggleStatus(record.id)}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
              isClosed
                ? "bg-amber-600/20 text-amber-300 border border-amber-500/40 hover:bg-amber-600/40"
                : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
            }`}
          >
            <FaCheckCircle /> {isClosed ? "Re-open Case Investigation" : "Mark Case Closed / Completed"}
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs font-mono transition-all"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};

export default FIRDetailModal;
