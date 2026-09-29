/**
 * ==============================================================================
 * MP POLICE - ABHEDYA CRIME INTELLIGENCE PLATFORM
 * ESP32 + 0.96" I2C OLED (SSD1306) + MFRC522 RFID Reader + CV Biometric Face Model
 * ==============================================================================
 * Firmware Version: 3.0.0 (Air-Gapped Section Lock + RFID Smart Card + Face 2FA)
 * 
 * Hardware Architecture:
 *  1. Section Lockdown: CCTNS "Manage Records" section is locked by default.
 *  2. Dual-Factor Unlock:
 *     - Step 1: Physical RFID Smart Card Tap on MFRC522 -> Reads Card UID
 *     - Step 2: Computer Vision Face Scan on terminal webcam -> Parameter match
 *  3. FIR CRUD Re-Authentication: Every Create/Edit/Delete action requires Face Scan.
 *  4. OTP-Free: Pure hardware token + biometric computer vision.
 * 
 * Pin Connections:
 * -------------------------------------------------------------
 * 1. 0.96" SSD1306 OLED Display (I2C):
 *    - VCC  -> 3.3V / 5V
 *    - GND  -> GND
 *    - SCL  -> GPIO 22 (ESP32 I2C SCL)
 *    - SDA  -> GPIO 21 (ESP32 I2C SDA)
 * 
 * 2. MFRC522 RFID Card Reader (SPI):
 *    - 3.3V -> 3.3V (Do NOT connect to 5V!)
 *    - GND  -> GND
 *    - RST  -> GPIO 27
 *    - SDA/SS -> GPIO 5
 *    - SCK  -> GPIO 18
 *    - MOSI -> GPIO 23
 *    - MISO -> GPIO 19
 * 
 * 3. Status Buzzer / LED (Optional):
 *    - BUZZER -> GPIO 4
 *    - GREEN_LED -> GPIO 2
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <SPI.h>
#include <MFRC522.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <ArduinoJson.h>

// ---------------- Wi-Fi & Gateway Configuration ----------------
const char* WIFI_SSID     = "MPP_POLICE_SECURE_WIFI";
const char* WIFI_PASSWORD = "PoliceCommand@2026";

// Server Gateway URL running Abhedya Platform
// Replace with your laptop's local IP (e.g. http://192.168.1.100:3000)
const char* SERVER_BASE_URL = "http://192.168.1.100:3000";

// Device Identification
const char* DEVICE_ID = "ESP32-RC522-CV-01";

// ---------------- OLED Configuration ----------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ---------------- MFRC522 RFID Configuration ----------------
#define SS_PIN  5
#define RST_PIN 27
MFRC522 rfid(SS_PIN, RST_PIN);

// Output Indicator Pins
#define BUZZER_PIN 4
#define LED_PIN 2

// State Tracking
unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL = 1500; // Poll server every 1.5s
String lastCardUid = "";
unsigned long lastCardTime = 0;

void beep(int ms = 80) {
  digitalWrite(BUZZER_PIN, HIGH);
  digitalWrite(LED_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
}

void renderOLED(const char* header, const char* line1, const char* line2, const char* line3, const char* statusTag = "AIR-GAP") {
  display.clearDisplay();
  
  // Header bar
  display.fillRect(0, 0, 128, 12, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK);
  display.setTextSize(1);
  display.setCursor(2, 2);
  display.print(header);

  // Status tag on top right
  display.setCursor(85, 2);
  display.print(statusTag);

  // Body text
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(2, 16);
  display.print(line1);

  display.setCursor(2, 30);
  display.setTextSize(1);
  display.print(line2);

  display.setCursor(2, 46);
  display.print(line3);

  // Bottom line accent
  display.drawFastHLine(0, 62, 128, SSD1306_WHITE);
  display.display();
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);

  // 1. Initialize OLED (I2C on GPIO 21 SDA, GPIO 22 SCL)
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
  } else {
    renderOLED("MP POLICE ABHEDYA", "BOOTING SYSTEM...", "AIR-GAP INITIALIZING", "ESP32 HARDWARE READY", "INIT");
  }

  // 2. Initialize SPI & MFRC522 RFID Reader
  SPI.begin(18, 19, 23, 5); // SCK, MISO, MOSI, SS
  rfid.PCD_Init();
  Serial.println("MFRC522 RFID Reader Initialized!");
  rfid.PCD_DumpVersionToSerial();

  // 3. Connect Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int wifiRetries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetries < 15) {
    delay(400);
    Serial.print(".");
    wifiRetries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
    renderOLED("CCTNS HARDWARE", "WIFI CONNECTED", WiFi.localIP().toString().c_str(), "TAP RFID BADGE >>", "ONLINE");
    beep(120);
  } else {
    Serial.println("\nWiFi offline. Running local hardware loop.");
    renderOLED("CCTNS OFFLINE", "LOCAL LINK ACTIVE", "CARD SCANNER READY", "TAP RFID BADGE >>", "READY");
  }
}

// Post RFID Card Tap to Backend Server
void sendCardTapToServer(String uid) {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[Offline] Card Tapped: " + uid);
    renderOLED("CARD DETECTED", uid.c_str(), "OFFLINE DEMO MODE", "SCAN FACE ON SCREEN", "2FA");
    beep(80);
    return;
  }

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/hardware/rfid-tap";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<200> doc;
  doc["cardUid"] = uid;
  doc["deviceId"] = DEVICE_ID;
  String requestBody;
  serializeJson(doc, requestBody);

  int httpCode = http.POST(requestBody);
  if (httpCode == 200) {
    String response = http.getString();
    StaticJsonDocument<512> respDoc;
    deserializeJson(respDoc, response);

    const char* officerName = respDoc["data"]["officer"]["officerName"] | "Officer";
    const char* badgeNumber = respDoc["data"]["officer"]["badgeNumber"] | "MPP-CARD";

    beep(90);
    renderOLED("CARD DETECTED", officerName, badgeNumber, ">> LOOK AT CAMERA <<", "FACE");
    Serial.println("RFID Tap sent to server successfully! Officer: " + String(officerName));
  } else {
    Serial.println("Error sending card tap: " + String(httpCode));
  }
  http.end();
}

// Poll server for live OLED screen buffer and section status
void pollServerStatus() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/hardware/esp32-poll";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<128> reqDoc;
  reqDoc["deviceId"] = DEVICE_ID;
  String reqJson;
  serializeJson(reqDoc, reqJson);

  int httpCode = http.POST(reqJson);
  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> doc;
    deserializeJson(doc, payload);

    if (doc.containsKey("oled")) {
      const char* h  = doc["oled"]["header"] | "MP POLICE";
      const char* l1 = doc["oled"]["line1"]  | "MANAGE RECORDS";
      const char* l2 = doc["oled"]["line2"]  | "[ LOCKED ]";
      const char* l3 = doc["oled"]["line3"]  | "TAP RFID TO UNLOCK";
      const char* st = doc["oled"]["status"] | "STANDBY";
      renderOLED(h, l1, l2, l3, st);
    }
  }
  http.end();
}

void loop() {
  // 1. Check for physical RFID Card presence on MFRC522 reader
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String cardUid = "";
    for (byte i = 0; i < rfid.uid.size; i++) {
      if (i > 0) cardUid += ":";
      if (rfid.uid.uidByte[i] < 0x10) cardUid += "0";
      cardUid += String(rfid.uid.uidByte[i], HEX);
    }
    cardUid.toUpperCase();

    // Debounce: prevent rapid repeated reads of same card within 2 seconds
    if (cardUid != lastCardUid || (millis() - lastCardTime > 2000)) {
      lastCardUid = cardUid;
      lastCardTime = millis();
      Serial.println("New RFID Card Read: " + cardUid);
      sendCardTapToServer(cardUid);
    }

    rfid.PICC_HaltA();
    rfid.PCD_StopCrypto1();
  }

  // 2. Periodic poll to server for live OLED display updates
  if (millis() - lastPollTime >= POLL_INTERVAL) {
    lastPollTime = millis();
    pollServerStatus();
  }

  delay(50);
}
