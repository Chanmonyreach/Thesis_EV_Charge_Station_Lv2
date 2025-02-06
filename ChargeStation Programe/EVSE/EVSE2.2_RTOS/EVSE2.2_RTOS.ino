#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <PZEM004Tv30.h>

// Protection State
bool ProtectionState = false;
// wifi connection
const char* ssid = "Nita";
const char* password = "010924193Nita";

// API Endpoints
const char* requestUrl = "http://192.168.3.5:8081/requestData?stationID=";
const char* serverName = "http://192.168.3.5:8081/stationData";

// Data to send
int StationID = 1;
int targetPower = 250;
float chargePower = 0.0;
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
#define BUZZER 31
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
String Evss_State = "";

//SCT013
#define ADC_PIN 34               // ESP32 ADC1 GPIO34 (Use ADC1 pins only)
#define SAMPLES 1000             // Number of ADC samples per cycle
#define ADC_REF_VOLT 3.3         // ESP32 ADC reference voltage
#define ADC_RES 4095.0           // 12-bit ADC resolution
#define BURDEN_RESISTOR 10.0     // Burden resistor value in ohms
#define CT_TURNS 2000            // Number of turns in SCT-013
#define CURRENT_THRESHOLD 0.005  // Set a threshold for current detection (e.g., 0.5A)

float currentRMS = 0, voltageRMS = 0;

String SourceState = "";

// Pzem
HardwareSerial pzemSerial(2);
PZEM004Tv30 pzem(pzemSerial, 22, 21);  // RX, TX

float MaxVoltage = 240.5, MinVoltage = 200, Pzem_voltage = 0.0;
float Pzem_current = 0.0;

// weld_detection
#define Weld_pin 4
float weld = 0;
bool RelayState = false;

// PE_detection
#define PE_pin 4
float PE = 0;
bool PEState = false;

// GFCI Protection
#define GFCI_pin 4
float GFCI = 0;
bool GFCI_State = false;

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
  pinMode(Weld_pin, INPUT);
  pinMode(PE_pin, INPUT);
  delay(3000);

  limitCurrent = min(limitCurrent, min(gridMaxCurrent, (float)stationMaxCurrent));
  ledcWriteChannel(CP_PWM, currentToDutyCycle(limitCurrent));
  resetOutputs();

  // Start RTOS tasks
  xTaskCreatePinnedToCore(WifiConnectTask, "WifiConnectTask", 4096, NULL, 1, NULL, 0);
  xTaskCreatePinnedToCore(PETask, "ProtectionEarthTask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(GFCITask, "GFCITask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(ProtectionTask, "ProtectionTask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(controlPilotTask, "ControlPilotTask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(currentDetectionTask, "CurrentDetection", 2048, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(UpdateTask, "UpdateTask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(PzemTask, "PzemTask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(WeldTask, "WeldTask", 4096, NULL, 1, NULL, 1);
  xTaskCreatePinnedToCore(PrintTask, "Print", 4096, NULL, 1, NULL, 1);
}

void loop() {
  // RTOS handles all tasks, no need for the main loop to handle logic
}
