#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>

const char* ssid = "Nita";
const char* password = "010924193Nita";

// API Endpoints
const char* requestUrl = "http://192.168.3.5:8081/requestData?stationID=";
const char* serverName = "http://192.168.3.5:8081/stationData";

// Data to send
int StationID = 1;
int targetPower = 100;
int chargePower = 9;
float cost = 13.4;
int ChargeHours = 1;
int ChargeMinutes = 20;
float latitude = 11.5963058, longitude = 104.7995911;

// Station's Define the pins
#define CP_FB 35
#define CP_PWM 23
#define READY_Charge_LED 26
#define Fault_LED 13
#define Float_LED 14
#define Charge_LED 12
#define BUZZER 33
#define POWER_RELAY 5

const int pwmChannel = 0;
const int pwmFrequency = 1000;
const int pwmResolution = 8;

// Thresholds for Control Pilot states on ESP32
const int stateThresholds[][2] = {
  { 4044, 4095 },  // State A
  { 3980, 4040 },  // State B
  { 3500, 3960 }   // State C
};

const int stationMaxCurrent = 32;
const float gridMaxCurrent = 5;
float limitCurrent = 40;
int peakVoltage = 0;
bool buzzerActivated = false;
String State = "";

void setup() {
  Serial.begin(115200);
  analogReadResolution(12);
  analogSetAttenuation(ADC_11db);

  ledcAttachChannel(CP_PWM, pwmFrequency, pwmResolution, pwmChannel);
  pinMode(CP_FB, INPUT);
  pinMode(READY_Charge_LED, OUTPUT);
  pinMode(Fault_LED, OUTPUT);
  pinMode(Float_LED, OUTPUT);
  pinMode(Charge_LED, OUTPUT);
  pinMode(POWER_RELAY, OUTPUT);
  pinMode(BUZZER, OUTPUT);

  limitCurrent = min(limitCurrent, min(gridMaxCurrent, (float)stationMaxCurrent));
  ledcWriteChannel(CP_PWM, currentToDutyCycle(limitCurrent));
  resetOutputs();

  // Start RTOS tasks
  xTaskCreatePinnedToCore(WifiConnectTask, "WifiConnectTask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(controlPilotTask, "ControlPilotTask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(UpdateTask, "UpdateTask", 4096, NULL, 1, NULL, 1);
}

void loop() {
  // RTOS handles all tasks, no need for the main loop to handle logic
}
