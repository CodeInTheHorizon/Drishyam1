/**
 * hardwareService.js
 * 
 * Client service for ESP32 + OLED Display + AI Computer Vision Face Recognition module.
 * Coordinates Cloudinary face verification, dynamic OLED OTP authentication, and tamper-proof live audit trails.
 */

const API_BASE = "/api/hardware";

export const hardwareService = {
  getDeviceStatus: async () => {
    return hardwareService.checkDeviceConnection();
  },

  // Check if hardware biometric camera / OLED device is connected
  checkDeviceConnection: async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const json = await res.json();
        const connected = Boolean(json.data?.isConnected ?? json.data?.isOnline);
        return {
          connected,
          label: connected ? "CV Face Recognition & 2FA Online" : "Biometric camera not connected",
          data: json.data
        };
      }
    } catch (err) {
      console.warn("[hardwareService] Connection check failed:", err.message);
    }
    return {
      connected: false,
      label: "Biometric camera not connected",
      data: null
    };
  },

  // Toggle connection state (probe or simulate physical device link)
  toggleConnection: async (connected = true) => {
    try {
      const res = await fetch(`${API_BASE}/toggle-connection`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ connected })
      });
      const json = await res.json();
      return json.data;
    } catch (err) {
      console.warn("[hardwareService] Failed toggling device connection:", err.message);
      return null;
    }
  },

  // 1. Upload Officer Face Photo to Cloudinary
  uploadFacePhoto: async (base64Image) => {
    const res = await fetch("/api/face/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image: base64Image })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to upload photo to Cloudinary.");
    }
    const json = await res.json();
    return json.data;
  },

  // 2. Request 2FA Hardware Authentication Session before CRUD operations
  requestAuth: async (actionDetails) => {
    const res = await fetch(`${API_BASE}/request-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actionDetails)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to initiate hardware authentication.");
    }
    const json = await res.json();
    return json.data;
  },

  // 3. Scan & Match Face against Database via Cloudinary CV Face Recognition
  matchFaceAuth: async ({ sessionId, image }) => {
    const res = await fetch(`${API_BASE}/face-auth-match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, image })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Facial recognition match failed: Officer not recognized.");
    }
    const json = await res.json();
    return json.data;
  },

  // Fallback / legacy biometric scan
  scanBiometric: async (sessionId, officerData) => {
    const res = await fetch(`${API_BASE}/scan-biometric`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, ...officerData })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Biometric face verification failed.");
    }
    const json = await res.json();
    return json.data;
  },

  // 4. Verify 2FA OTP shown on the physical ESP32 OLED Display
  verifyOtp: async (verifyPayload) => {
    const res = await fetch(`${API_BASE}/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(verifyPayload)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Invalid 2FA OTP. Please check the OLED display.");
    }
    const json = await res.json();
    return json.data;
  }
};

