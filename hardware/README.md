# ESP32 + OLED + Biometric Hardware Setup Guide

## 1. Hardware Overview & Bill of Materials (BOM)
- **Controller**: ESP32 DevKit V1 (30-pin or 38-pin NodeMCU-32S)
- **Display**: 0.96" I2C Monochrome OLED Display (128x64 SSD1306)
- **Biometric Scanner**: Optical Fingerprint Sensor (R307, AS608, or FPM10A)
- **Buzzer / LED (Optional)**: Active 5V Buzzer + 5mm Green LED
- **Power**: Micro-USB or 5V 2A external DC power supply

---

## 2. Pin Connections

### OLED Display (SSD1306 - I2C):
| OLED Pin | ESP32 Pin | Note |
| :--- | :--- | :--- |
| **VCC** | `3.3V` or `5V` | Standard VCC |
| **GND** | `GND` | Ground |
| **SCL** | `GPIO 22` | ESP32 Default I2C SCL |
| **SDA** | `GPIO 21` | ESP32 Default I2C SDA |

### Optical Fingerprint Sensor (R307 / AS608 - UART Serial 2):
| Sensor Wire / Pin | ESP32 Pin | Wire Color (Typical) |
| :--- | :--- | :--- |
| **VCC** | `5V` (or `VIN`) | Red |
| **GND** | `GND` | Black |
| **TX** | `GPIO 16` (RX2) | Green / Yellow |
| **RX** | `GPIO 17` (TX2) | White |

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
3. Install the required libraries via `Sketch` -> `Include Library` -> `Manage Libraries...`:
   - `Adafruit SSD1306`
   - `Adafruit GFX Library`
   - `Adafruit Fingerprint Sensor Library`
   - `ArduinoJson` (v6.x or v7.x)
4. Open [`hardware/esp32_firmware/esp32_firmware.ino`](file:///Users/kartiksinghal/Downloads/ksp-crime-intelligence-platform-main-7/hardware/esp32_firmware/esp32_firmware.ino).
5. Edit your Wi-Fi credentials:
   ```cpp
   const char* WIFI_SSID     = "Your_WiFi_SSID";
   const char* WIFI_PASSWORD = "Your_WiFi_Password";
   const char* SERVER_BASE_URL = "http://<YOUR_COMPUTER_IP>:3000";
   ```
6. Select Board `ESP32 Dev Module`, choose your COM port, and click **Upload**.

---

## 4. How the 2-Factor Biometric Hardware Workflow Operates
1. **Officer Biometric Enrollment**:
   - When an administrator adds a new officer in the web platform, the ESP32 enters enrollment mode.
   - The officer touches the optical scanner twice to capture their fingerprint template.
   - The template ID is saved into the database and ESP32 flash memory.
2. **FIR and Officer Profile CRUD Operations**:
   - Whenever an officer attempts to create, update, or delete an FIR or modify personnel details, the platform requires physical authorization.
   - The ESP32 OLED lights up prompting: `[ 2FA AUTH REQ ] PLACE FINGERPRINT`.
   - The officer scans their registered fingerprint on the sensor.
   - The ESP32 authenticates the fingerprint, records the exact timestamp, and generates a dynamic 6-digit OTP displayed on the OLED screen:
     ```
     +--------------------------+
     |   BIOMETRIC VERIFIED     |
     |   OFFICER: K. SINGHAL    |
     |   2FA OTP: [ 749201 ]    |
     |   EXPIRES IN: 90 SECONDS |
     +--------------------------+
     ```
   - The officer enters this 6-digit OTP in the platform modal.
   - Once matched, the action executes, and an audit trail row is saved in Zoho Catalyst `BiometricAuditTrail`.
