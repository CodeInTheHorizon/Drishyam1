# ESP32 + RC522 RFID + OLED Hardware Setup Guide

## 1. Hardware Overview & Bill of Materials (BOM)
- **Microcontroller**: ESP32 DevKit V1 (30-pin or 38-pin NodeMCU-32S)
- **Display**: 0.96" I2C Monochrome OLED Display (128x64 SSD1306)
- **RFID Reader**: MFRC522 13.56 MHz RFID Reader Module
- **RFID Tags**: Mifare Classic 1K RFID Cards / Keyfob Badges
- **Status Indicators (Optional)**: Active 5V Buzzer + 5mm LED
- **Power**: Micro-USB or 5V 2A external DC power supply

---

## 2. Pin Connections

### OLED Display (SSD1306 - I2C):
| OLED Pin | ESP32 Pin | Note |
| :--- | :--- | :--- |
| **VCC** | `3.3V` or `5V` | Standard Power |
| **GND** | `GND` | Ground |
| **SCL** | `GPIO 22` | ESP32 Default I2C SCL |
| **SDA** | `GPIO 21` | ESP32 Default I2C SDA |

### MFRC522 RFID Module (SPI):
| RC522 Pin | ESP32 Pin | Note |
| :--- | :--- | :--- |
| **3.3V** | `3.3V` | **CAUTION**: Do NOT connect to 5V! |
| **RST** | `GPIO 27` | Reset pin |
| **GND** | `GND` | Ground |
| **IRQ** | *Unused* | Leave disconnected |
| **MISO** | `GPIO 19` | ESP32 SPI MISO |
| **MOSI** | `GPIO 23` | ESP32 SPI MOSI |
| **SCK** | `GPIO 18` | ESP32 SPI SCK |
| **SDA / SS** | `GPIO 5` | SPI Chip Select |

### Feedback Indicators (Optional):
| Component | ESP32 Pin |
| :--- | :--- |
| **Buzzer (+)** | `GPIO 4` |
| **Green LED (+)** | `GPIO 2` |

---

## 3. Arduino IDE Setup
1. Open **Arduino IDE** (v2.x recommended).
2. Install the **ESP32 Board Package**:
   - Go to `Tools` -> `Board` -> `Boards Manager`.
   - Search for `esp32` by Espressif Systems and click **Install**.
3. Install required libraries via `Sketch` -> `Include Library` -> `Manage Libraries...`:
   - `MFRC522` (by GithubCommunity)
   - `Adafruit SSD1306`
   - `Adafruit GFX Library`
   - `ArduinoJson` (v6.x or v7.x)
4. Open [`hardware/esp32_firmware/esp32_firmware.ino`](file:///Users/kartiksinghal/Downloads/ksp-crime-intelligence-platform-main-7/hardware/esp32_firmware/esp32_firmware.ino).
5. Edit your Wi-Fi credentials and server IP:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_SSID";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* SERVER_BASE_URL = "http://<YOUR_LAPTOP_IP>:3000";
   ```
6. Select Board `ESP32 Dev Module`, choose your COM port, and click **Upload**.

---

## 4. Hardware Security Architecture & Workflow

### 1. Section Lockdown (CCTNS Manage Records & FIRs)
- By default, the sensitive **Manage Records** section is air-gapped and locked for all users.
- To unlock the section, an officer must complete **Dual-Factor Authentication (2FA)**:
  - **Factor 1 (Physical Hardware)**: The officer taps their physical RFID Police Smart Card on the RC522 reader.
    - ESP32 reads the card UID (e.g. `04:A2:8F:1A`), chirps the buzzer, and sends the UID to `/api/hardware/rfid-tap`.
    - The OLED displays: `CARD DETECTED / [OFFICER NAME] / >> LOOK AT CAMERA <<`.
  - **Factor 2 (Computer Vision Biometric)**: The camera scans the officer's face.
    - Parameter check: The face scan must match the registered officer associated with that RFID card ($\ge 50\%$ biometric similarity).
    - If an imposter attempts to use a borrowed/stolen card, access is rejected immediately and an alarm is raised.
  - **Database Audit Log**: On unlock, an immutable record is saved in Zoho Catalyst `BiometricAuditTrail`:
    - `Action`: `"MANAGE_RECORDS_SECTION_UNLOCK"`
    - `OTPUsed`: `"RFID:" + cardUid`
    - `ChangesSummary`: Card UID, match percentage, and Cloudinary audit photo URL.

### 2. FIR CRUD Re-Authentication (NO OTP)
- The 6-digit OTP system has been completely removed.
- Once the section is unlocked, before performing any high-stakes FIR operation (Create, Edit, Delete, or Mark Completed):
  - An authorization modal opens requiring a **Face Scan**.
  - The officer looks at the camera $\rightarrow$ Facial Recognition verifies their identity against the unlocked officer.
  - On verification:
    - OLED updates to: `CRUD AUTHORIZED / ACT: [ACTION] / CHANGES COMMITTED`.
    - A row is written directly into Zoho Catalyst `BiometricAuditTrail` with the exact FIR number and Cloudinary photo.
    - The FIR operation executes immediately!

---

## 5. Database Architecture Mapping (Zoho Catalyst)

No modifications to your Catalyst Data Store schema are strictly required:

| Field in `BiometricAuditTrail` | Value Stored for 2FA Unlock / CRUD |
| :--- | :--- |
| `OfficerName` | Full name of the authenticated police officer |
| `KGID` | Officer Badge Number (e.g. `MPP-2026-5882`) |
| `EmployeeID` | Officer Employee ID in Catalyst `Employee` table |
| `Action` | `"MANAGE_RECORDS_SECTION_UNLOCK"`, `"CREATE_FIR"`, `"UPDATE_FIR"`, `"DELETE_FIR"` |
| `TargetTable` | `"ManageRecordsSection"` or `"CaseMaster"` |
| `TargetRecordID` | Session ID or exact FIR number (e.g. `FIR/MP/2026/041`) |
| `DeviceID` | `"ESP32-RC522-CV-01"` |
| `FingerprintVerified` | `true` (denoting physical 2FA hardware passed) |
| `OTPUsed` | Stores `RFID:<Card_UID>` for unlocks, or `"FACE_REAUTH"` for CRUD actions |
| `ChangesSummary` | Detailed audit string with confidence score and Cloudinary URL |
| `AuditTimestamp` | Real-time ISO timestamp |
