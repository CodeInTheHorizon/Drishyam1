/**
 * ==============================================================================
 * MP POLICE - ABHEDYA CRIME INTELLIGENCE PLATFORM
 * ESP32 + 0.96" I2C OLED (SSD1306) + Biometric Fingerprint Scanner (R307/AS608)
 * ==============================================================================
 * Firmware Version: 2.4.0 (Hardware 2-Factor Biometric + Dynamic OLED OTP)
 * 
 * Target Board: ESP32 Dev Module / NodeMCU-32S
 * Communication: HTTP REST Polling & Event Postings
 * 
 * Hardware Pin Connections:
 * -------------------------------------------------------------
 * 1. 0.96" SSD1306 OLED Display (I2C):
 *    - VCC  -> 3.3V / 5V
 *    - GND  -> GND
 *    - SCL  -> GPIO 22 (ESP32 I2C SCL)
 *    - SDA  -> GPIO 21 (ESP32 I2C SDA)
 * 
 * 2. R307 / AS608 Optical Fingerprint Scanner (UART Serial2):
 *    - VCC  -> 5V (Red)
 *    - GND  -> GND (Black)
 *    - TX   -> GPIO 16 (ESP32 RX2 - Green/Yellow)
 *    - RX   -> GPIO 17 (ESP32 TX2 via voltage divider if needed - White)
 * 
 * 3. Status Buzzer / LED (Optional):
 *    - BUZZER -> GPIO 4
 *    - GREEN_LED -> GPIO 2
 * ==============================================================================
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include <Adafruit_Fingerprint.h>
#include <ArduinoJson.h>

// ---------------- Wi-Fi & Gateway Configuration ----------------
const char* WIFI_SSID     = "MPP_POLICE_SECURE_WIFI";
const char* WIFI_PASSWORD = "PoliceCommand@2026";

// Server Gateway URL running Abhedya Platform
// Replace with your server IP (e.g. http://192.168.1.100:3000)
const char* SERVER_BASE_URL = "http://192.168.1.100:3000";

// Device Identification
const char* DEVICE_ID = "ESP32-OLED-BIO-01";

// ---------------- OLED Configuration ----------------
#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

// ---------------- Fingerprint Sensor Configuration ----------------
// Hardware Serial 2 on ESP32 (RX=16, TX=17)
HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);

// Output Indicator Pins
#define BUZZER_PIN 4
#define LED_PIN 2

// State Tracking
unsigned long lastPollTime = 0;
const unsigned long POLL_INTERVAL = 1500; // Poll server every 1.5s for display state
String currentMode = "STANDBY";
int lastFingerprintId = -1;

void beep(int ms = 80) {
  digitalWrite(BUZZER_PIN, HIGH);
  digitalWrite(LED_PIN, HIGH);
  delay(ms);
  digitalWrite(BUZZER_PIN, LOW);
  digitalWrite(LED_PIN, LOW);
}

void renderOLED(const char* header, const char* line1, const char* line2, const char* line3, bool isOtp = false) {
  display.clearDisplay();
  
  // Header bar
  display.fillRect(0, 0, 128, 12, SSD1306_WHITE);
  display.setTextColor(SSD1306_BLACK);
  display.setTextSize(1);
  display.setCursor(2, 2);
  display.print(header);

  // Body text
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(2, 16);
  display.print(line1);

  display.setCursor(2, 28);
  if (isOtp) {
    display.setTextSize(2);
    display.print(line2);
    display.setTextSize(1);
  } else {
    display.print(line2);
  }

  display.setCursor(2, 48);
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

  // Initialize OLED Display (I2C address 0x3C typically)
  Wire.begin(21, 22);
  if (!display.begin(SSD1306_SWITCHCAPVCC, 0x3C)) {
    Serial.println(F("SSD1306 allocation failed"));
  } else {
    renderOLED("MP POLICE ABHEDYA", "BOOTING SYSTEM...", "CONNECTING WIFI", "ESP32 INITIALIZING");
  }

  // Initialize Wi-Fi
  Serial.print("Connecting to Wi-Fi: ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  int wifiRetries = 0;
  while (WiFi.status() != WL_CONNECTED && wifiRetries < 20) {
    delay(500);
    Serial.print(".");
    wifiRetries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nWiFi Connected! IP: " + WiFi.localIP().toString());
    renderOLED("MP POLICE ONLINE", "WIFI CONNECTED", WiFi.localIP().toString().c_str(), "SCANNING SENSOR...");
  } else {
    Serial.println("\nWiFi connection failed! Continuing in offline/mock sensor mode.");
    renderOLED("WIFI OFFLINE", "LOCAL LINK ACTIVE", "CHECK ROUTER IP", "STANDBY READY");
  }

  // Initialize Fingerprint Sensor
  finger.begin(57600);
  if (finger.verifyPassword()) {
    Serial.println("Found optical fingerprint sensor!");
    beep(100);
  } else {
    Serial.println("Fingerprint sensor not responding. Check baud rate / wiring.");
  }

  renderOLED("MP POLICE • ABHEDYA", "SYSTEM ACTIVE", "ESP32 + OLED + BIO", "READY FOR 2FA AUTH");
}

int getFingerprintID() {
  uint8_t p = finger.getImage();
  if (p != FINGERPRINT_OK) return -1;

  p = finger.image2Tz();
  if (p != FINGERPRINT_OK) return -1;

  p = finger.fingerSearch();
  if (p == FINGERPRINT_OK) {
    Serial.print("Found ID #"); Serial.print(finger.fingerID);
    Serial.print(" with confidence of "); Serial.println(finger.confidence);
    beep(150);
    return finger.fingerID;
  }
  return -1;
}

void pollServerState() {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/hardware/esp32-poll";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["ip"] = WiFi.localIP().toString();
  String reqBody;
  serializeJson(doc, reqBody);

  int httpCode = http.POST(reqBody);
  if (httpCode == 200) {
    String payload = http.getString();
    StaticJsonDocument<512> resp;
    deserializeJson(resp, payload);

    const char* header = resp["display"]["header"] | "MP POLICE";
    const char* line1  = resp["display"]["line1"] | "ONLINE";
    const char* line2  = resp["display"]["line2"] | "";
    const char* line3  = resp["display"]["line3"] | "";
    const char* mode   = resp["display"]["mode"] | "STANDBY";

    currentMode = String(mode);
    bool isOtpMode = (currentMode == "DISPLAYING_OTP");
    renderOLED(header, line1, line2, line3, isOtpMode);
  }
  http.end();
}

void notifyFingerprintScanned(int slotId) {
  if (WiFi.status() != WL_CONNECTED) return;

  HTTPClient http;
  String url = String(SERVER_BASE_URL) + "/api/hardware/scan-biometric";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  StaticJsonDocument<256> doc;
  doc["deviceId"] = DEVICE_ID;
  doc["fingerprintSlot"] = slotId;
  doc["timestamp"] = millis();
  String reqBody;
  serializeJson(doc, reqBody);

  int httpCode = http.POST(reqBody);
  Serial.print("Biometric scan reported. Server HTTP: ");
  Serial.println(httpCode);
  http.end();
}

void loop() {
  // Check for fingerprint sensor touches
  int fingerId = getFingerprintID();
  if (fingerId != -1) {
    Serial.println("Valid fingerprint touched on sensor!");
    notifyFingerprintScanned(fingerId);
    delay(1000); // Prevent duplicate triggers
  }

  // Poll server for OLED screen updates
  if (millis() - lastPollTime > POLL_INTERVAL) {
    lastPollTime = millis();
    pollServerState();
  }

  delay(20);
}
