/**
 * hardwareService.js
 * 
 * Client service for ESP32 + OLED Display + Biometric Scanner hardware module.
 * Coordinates 2-Factor Biometric Fingerprint verification and dynamic OLED OTP authentication.
 */

const API_BASE = "/api/hardware";

export const hardwareService = {
  getDeviceStatus: async () => {
    return hardwareService.getStatus();
  },

  // Check if hardware biometric device is connected
  checkDeviceConnection: async () => {
    try {
      const res = await fetch(`${API_BASE}/status`);
      if (res.ok) {
        const json = await res.json();
        const connected = Boolean(json.data?.isConnected ?? json.data?.isOnline);
        return {
          connected,
          label: connected ? "Biometric device connected" : "Biometric device not connected",
          data: json.data
        };
      }
    } catch (err) {
      console.warn("[hardwareService] Connection check failed:", err.message);
    }
    return {
      connected: false,
      label: "Biometric device not connected",
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

  // 1. Start Biometric Fingerprint Enrollment for New Officer
  startEnrollment: async (officerData) => {
    const res = await fetch(`${API_BASE}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(officerData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to initiate biometric enrollment on ESP32.");
    }
    const json = await res.json();
    return json.data;
  },

  // Confirm Biometric Fingerprint Enrollment
  confirmEnrollment: async (enrollData) => {
    const res = await fetch(`${API_BASE}/confirm-enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(enrollData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Failed to store biometric template.");
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

  // 3. Scan Fingerprint on ESP32 Biometric Scanner
  scanBiometric: async (sessionId, officerData) => {
    const res = await fetch(`${API_BASE}/scan-biometric`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, ...officerData })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || "Biometric fingerprint verification failed.");
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
      throw new Error(err.error || "Invalid 2FA OTP.");
    }
    const json = await res.json();
    return json.data;
  }
};
