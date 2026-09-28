import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import {
  FaCamera,
  FaCheckCircle,
  FaRedo,
  FaCloudUploadAlt,
  FaShieldAlt,
  FaExclamationTriangle,
  FaUserCheck,
  FaVideo,
  FaVideoSlash
} from "react-icons/fa";
import { hardwareService } from "../../services/hardwareService";

const FaceEnrollmentWidget = forwardRef(({ officerData, onEnrollmentComplete, isEnrolled, enrolledInfo }, ref) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(enrolledInfo?.photoUrl || null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(Boolean(isEnrolled));
  const [cloudinaryUrl, setCloudinaryUrl] = useState(enrolledInfo?.photoUrl || "");
  const [faceDetected, setFaceDetected] = useState(true);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Expose imperative methods to parent (e.g. AddOfficerModal)
  useImperativeHandle(ref, () => ({
    capture: () => handleCapturePhoto(),
    retake: () => handleRetake(),
    openFilePicker: () => fileInputRef.current?.click(),
    isReady: () => cameraActive,
    isUploading: () => uploading,
    isEnrolled: () => uploadSuccess && Boolean(cloudinaryUrl)
  }));

  // Start webcam feed
  const startCamera = async () => {
    setCameraError("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: "user"
          },
          audio: false
        });
        streamRef.current = stream;
        setCameraActive(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      } else {
        setCameraError("Webcam API not supported in this browser. Please upload a photo file instead.");
      }
    } catch (err) {
      console.warn("[FaceEnrollmentWidget] Camera access error:", err);
      setCameraError("Camera access denied or unavailable. You can click 'Upload File' to select a photo.");
      setCameraActive(false);
    }
  };

  // Sync stream to video element whenever camera becomes active or mounts
  useEffect(() => {
    if (cameraActive && streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.play().catch(() => {});
      }
    }
  }, [cameraActive, capturedPhoto]);

  // Stop webcam feed
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (!capturedPhoto) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, []);

  // Capture frame from webcam
  const handleCapturePhoto = async () => {
    if (!videoRef.current || !cameraActive) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
      return;
    }

    setIsCapturing(true);
    setCameraError("");

    try {
      const video = videoRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");

      // Mirror the frame horizontally to match user perspective
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL("image/jpeg", 0.9);

      setCapturedPhoto(dataUrl);
      stopCamera();

      // Upload directly to Cloudinary
      await uploadToCloudinary(dataUrl);
    } catch (err) {
      setCameraError("Capture failed: " + err.message);
    } finally {
      setIsCapturing(false);
    }
  };

  // Upload image to Cloudinary via backend
  const uploadToCloudinary = async (base64Data) => {
    setUploading(true);
    setCameraError("");
    try {
      const resp = await hardwareService.uploadFacePhoto(base64Data);
      if (resp && (resp.url || resp.secure_url)) {
        const finalUrl = resp.url || resp.secure_url;
        setCloudinaryUrl(finalUrl);
        setUploadSuccess(true);
        setFaceDetected(resp.faceCount > 0);

        if (onEnrollmentComplete) {
          onEnrollmentComplete({
            photoUrl: finalUrl,
            faceDetected: resp.faceCount > 0,
            publicId: resp.publicId,
            enrolledAt: new Date().toISOString(),
            biometricType: "CV_FACE_MODEL"
          });
        }
      } else {
        throw new Error("No URL returned from Cloudinary upload.");
      }
    } catch (err) {
      console.error("[FaceEnrollmentWidget] Cloudinary upload error:", err);
      setCameraError(err.message || "Failed to upload photo to Cloudinary. Please try again.");
      setUploadSuccess(false);
    } finally {
      setUploading(false);
    }
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setCloudinaryUrl("");
    setUploadSuccess(false);
    setCameraError("");
    startCamera();
  };

  // File upload fallback
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const base64 = evt.target?.result;
        if (base64) {
          setCapturedPhoto(base64);
          stopCamera();
          await uploadToCloudinary(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 bg-slate-950/80 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-inner">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
            <FaCamera className="text-base" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              <span>Mandatory Facial Photo Capture</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase font-mono">
                Cloudinary AI
              </span>
            </h4>
            <p className="text-[11px] text-slate-400">
              Live face enrollment required for AI Face Recognition authentication during FIR CRUD
            </p>
          </div>
        </div>

        {uploadSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm">
            <FaCheckCircle className="text-xs" />
            <span>Face Enrolled Live</span>
          </span>
        )}
      </div>

      {/* Main Viewfinder / Photo Container */}
      <div className="relative w-full aspect-[4/3] max-h-[320px] rounded-xl overflow-hidden bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
        {capturedPhoto ? (
          // Captured Preview
          <div className="relative w-full h-full">
            <img
              src={capturedPhoto}
              alt="Enrolled Officer Face"
              className="w-full h-full object-cover"
            />
            {uploading && (
              <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-cyan-400">
                <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-mono font-bold tracking-wider animate-pulse">
                  UPLOADING TO CLOUDINARY...
                </span>
              </div>
            )}
            {uploadSuccess && !uploading && (
              <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-lg bg-slate-950/90 border border-emerald-500/50 flex items-center justify-between text-xs backdrop-blur-md shadow-lg">
                <div className="flex items-center gap-2">
                  <FaCheckCircle className="text-emerald-400 text-sm" />
                  <span className="font-semibold text-white">Stored in Cloudinary Database</span>
                </div>
                <button
                  type="button"
                  onClick={handleRetake}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium flex items-center gap-1 transition-all cursor-pointer"
                >
                  <FaRedo className="text-[10px]" />
                  <span>Retake</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          // Live Webcam Stream with Biometric Reticle
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <video
              ref={(el) => {
                videoRef.current = el;
                if (el && streamRef.current && el.srcObject !== streamRef.current) {
                  el.srcObject = streamRef.current;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${!cameraActive ? "hidden" : "block"}`}
              style={{ transform: "scaleX(-1)" }}
            />
            {!cameraActive && (
              <div className="flex flex-col items-center justify-center p-4 text-center text-slate-400 space-y-2">
                <FaVideoSlash className="text-3xl text-slate-600" />
                <span className="text-xs">Camera initializing or access restricted</span>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3 py-1 rounded bg-slate-800 text-cyan-400 text-xs font-mono cursor-pointer hover:bg-slate-700"
                >
                  Start Camera
                </button>
              </div>
            )}

            {/* Biometric Oval Face Alignment Frame */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-[180px] h-[230px] rounded-[50%] border-2 border-dashed border-cyan-400/70 shadow-[0_0_25px_rgba(34,211,238,0.35)] relative flex items-center justify-center animate-pulse">
                {/* Horizontal Scan Laser Line */}
                <div className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_10px_#22d3ee] animate-bounce" />
                <span className="text-[10px] font-mono font-bold text-cyan-300/80 uppercase tracking-widest bg-slate-950/60 px-2 py-0.5 rounded">
                  ALIGN FACE HERE
                </span>
              </div>
            </div>

            {/* Live Indicator */}
            {cameraActive && (
              <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold tracking-wider">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>LIVE CAMERA FEED</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Banner */}
      {cameraError && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          <FaExclamationTriangle className="shrink-0 text-rose-400" />
          <span>{cameraError}</span>
        </div>
      )}

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          {!capturedPhoto ? (
            <button
              type="button"
              onClick={handleCapturePhoto}
              disabled={isCapturing || uploading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/25 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <FaCamera />
              <span>{isCapturing ? "Capturing..." : "Capture Officer Photo"}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleRetake}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-all cursor-pointer"
            >
              <FaRedo />
              <span>Capture Different Photo</span>
            </button>
          )}

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-medium text-xs flex items-center gap-2 border border-slate-800 transition-all cursor-pointer"
            title="Upload photo from disk if camera is not available"
          >
            <FaCloudUploadAlt />
            <span>Upload File</span>
          </button>
        </div>

        {cloudinaryUrl && (
          <div className="text-[11px] font-mono text-slate-400 truncate max-w-xs">
            <span className="text-emerald-400 font-bold">Cloudinary: </span>
            <a
              href={cloudinaryUrl}
              target="_blank"
              rel="noreferrer"
              className="text-cyan-400 underline hover:text-cyan-300"
            >
              View Cloud Image
            </a>
          </div>
        )}
      </div>
    </div>
  );
});

export default FaceEnrollmentWidget;
